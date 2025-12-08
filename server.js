const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDB, sql } = require('./config/db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// === HELPER: Parse địa chỉ ===
function parseDiaChi(diaChiStr) {
    if (!diaChiStr) return { soNha: "", duong: "", phuong: "", quan: "", tinh: "" };
    const parts = diaChiStr.split(',').map(s => s.trim());
    return {
        soNha: parts[0] || "",
        duong: parts[1] || "",
        phuong: parts[2] || "",
        quan: parts[3] || "",
        tinh: parts[4] || ""
    };
}

// ================= API ROUTES =================

// 1. ĐĂNG NHẬP
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('u', sql.VarChar, username)
            .input('p', sql.VarChar, password)
            .query('SELECT * FROM USERS WHERE USERNAME = @u AND PASSWD = @p');

        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY DANH SÁCH HỘ KHẨU (Chỉ lấy thông tin Hộ + List thành viên rút gọn nếu cần)
app.get('/api/households', async (req, res) => {
    try {
        const pool = await connectDB();

        // Lấy thông tin Hộ Khẩu
        const hkRes = await pool.request().query(`
            SELECT 
                hk.ID, 
                'HK' + RIGHT('000' + CAST(hk.ID AS VARCHAR(10)), 3) as maHoKhau,
                nk.HOTEN as chuHo,
                hk.DIACHI as diaChiFull,
                FORMAT(hk.NGAYLAP, 'yyyy-MM-dd') as ngayLapSo
            FROM HOKHAU hk
            LEFT JOIN NHANKHAU nk ON hk.IDCHUHO = nk.ID
        `);

        // Lấy danh sách thành viên để nhúng vào hộ khẩu (phục vụ hiển thị chi tiết Hộ)
        // Nếu muốn tách hẳn, có thể bỏ đoạn này và gọi API lấy thành viên theo ID hộ khi click chi tiết
        const tvRes = await pool.request().query(`
            SELECT 
                tv.IDHOKHAU,
                nk.ID as realId,
                'NK' + RIGHT('000' + CAST(nk.ID AS VARCHAR(10)), 3) as id,
                nk.HOTEN as ten,
                FORMAT(nk.NGAYSINH, 'yyyy-MM-dd') as ngaySinh,
                nk.GIOITINH as gioiTinh,
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                nk.NGHENGHIEP as nghe,
                nk.QUOCTICH as quocTich,
                nk.DANTOC as danToc,
                nk.TONGIAO as tonGiao,
                nk.NGUYENQUAN as queQuan,
                nk.NOITHUONGTRU as diaChiThuongTru,
                nk.DIACHIHIENNAY as noiOHienTai,
                tv.QUANHEVOICHUHO as vaiTro,
                nk.GHICHU as ghiChu
            FROM THANHVIENCUAHO tv
            JOIN NHANKHAU nk ON tv.IDNHANKHAU = nk.ID
            LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
        `);

        const households = hkRes.recordset.map(hk => ({
            id: hk.maHoKhau,
            realId: hk.ID,
            chuHo: hk.chuHo,
            diaChi: parseDiaChi(hk.diaChiFull),
            ngayLapSo: hk.ngayLapSo,
            // Vẫn trả về nhanKhau để file app.js cũ hoạt động (logic renderHouseholds đang dùng h.nhanKhau.length)
            nhanKhau: tvRes.recordset
                .filter(nk => nk.IDHOKHAU === hk.ID)
                .map(nk => ({ ...nk, hoKhauId: hk.maHoKhau }))
        }));

        res.json(households);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY DANH SÁCH TOÀN BỘ NHÂN KHẨU (RIÊNG BIỆT)
// API này phục vụ cho tab "Quản lý nhân khẩu" và tìm kiếm nhân khẩu
app.get('/api/residents', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                nk.ID as realId,
                'NK' + RIGHT('000' + CAST(nk.ID AS VARCHAR(10)), 3) as id,
                nk.HOTEN as ten,
                FORMAT(nk.NGAYSINH, 'yyyy-MM-dd') as ngaySinh,
                nk.GIOITINH as gioiTinh,
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                nk.NGHENGHIEP as nghe,
                nk.QUOCTICH as quocTich,
                nk.DANTOC as danToc,
                nk.TONGIAO as tonGiao,
                nk.NGUYENQUAN as queQuan,
                nk.NOITHUONGTRU as diaChiThuongTru,
                nk.DIACHIHIENNAY as noiOHienTai,
                nk.GHICHU as ghiChu,
                -- Lấy thêm thông tin Hộ khẩu và Vai trò để hiển thị
                'HK' + RIGHT('000' + CAST(hk.ID AS VARCHAR(10)), 3) as hoKhauId,
                tv.QUANHEVOICHUHO as vaiTro
            FROM NHANKHAU nk
            LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
            LEFT JOIN THANHVIENCUAHO tv ON nk.ID = tv.IDNHANKHAU
            LEFT JOIN HOKHAU hk ON tv.IDHOKHAU = hk.ID
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. THÊM HỘ KHẨU MỚI
app.post('/api/households', async (req, res) => {
    const { chuHo, diaChi, ngayLapSo } = req.body;
    const diaChiStr = `${diaChi.soNha}, ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.tinh}`;

    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();
        const reqT = new sql.Request(transaction);

        // Tạo Chủ Hộ
        const nkRes = await reqT
            .input('hoten', sql.NVarChar, chuHo)
            .input('ngaySinh', sql.Date, new Date())
            .input('gioitinh', sql.NVarChar, 'Không rõ')
            .query(`INSERT INTO NHANKHAU (HOTEN, NGAYSINH, GIOITINH) OUTPUT INSERTED.ID VALUES (@hoten, @ngaySinh, @gioitinh)`);
        const idChuHo = nkRes.recordset[0].ID;

        // Tạo Hộ khẩu
        const hkRes = await reqT
            .input('idChuHo', sql.Int, idChuHo)
            .input('dc', sql.NVarChar, diaChiStr)
            .input('nl', sql.Date, ngayLapSo)
            .query(`INSERT INTO HOKHAU (IDCHUHO, DIACHI, NGAYLAP) OUTPUT INSERTED.ID VALUES (@idChuHo, @dc, @nl)`);
        const idHK = hkRes.recordset[0].ID;

        // Link vào bảng Thành viên
        await reqT
            .input('idNk', sql.Int, idChuHo)
            .input('idHk', sql.Int, idHK)
            .query(`INSERT INTO THANHVIENCUAHO (IDNHANKHAU, IDHOKHAU, QUANHEVOICHUHO) VALUES (@idNk, @idHk, N'Chủ hộ')`);

        await transaction.commit();
        res.json({ success: true });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
});

// 5. XOÁ HỘ KHẨU
app.delete('/api/households/:id', async (req, res) => {
    const idInt = parseInt(req.params.id.replace('HK', ''));
    try {
        const pool = await connectDB();
        await pool.request().input('id', sql.Int, idInt).query(`
            DELETE FROM THANHVIENCUAHO WHERE IDHOKHAU = @id;
            DELETE FROM HOKHAU WHERE ID = @id;
        `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. THÊM / CẬP NHẬT NHÂN KHẨU (API Mới cho chức năng sửa/thêm thành viên)
app.post('/api/residents', async (req, res) => {
    const data = req.body;
    // Xử lý logic Thêm hoặc Sửa tại đây (Tùy vào data.id có null không)
    // Code demo đơn giản:
    try {
        const pool = await connectDB();
        // Nếu là thêm mới vào hộ
        if (!data.id) {
            const result = await pool.request()
                .input('hoten', sql.NVarChar, data.ten)
                .input('ngaysinh', sql.Date, data.ngaySinh)
                .input('gioitinh', sql.NVarChar, data.gioiTinh)
                .input('cccd', sql.VarChar, data.cccd || null)
                .input('nghe', sql.NVarChar, data.nghe)
                .input('que', sql.NVarChar, data.queQuan)
                .input('tt', sql.NVarChar, data.diaChiThuongTru)
                .query(`INSERT INTO NHANKHAU (HOTEN, NGAYSINH, GIOITINH, SOCCCD, NGHENGHIEP, NGUYENQUAN, NOITHUONGTRU) 
                        OUTPUT INSERTED.ID VALUES (@hoten, @ngaysinh, @gioitinh, @cccd, @nghe, @que, @tt)`);

            const newId = result.recordset[0].ID;
            // Link vào hộ khẩu
            if (data.hoKhauId) {
                const hkIdInt = parseInt(data.hoKhauId.replace('HK', ''));
                await pool.request()
                    .input('idNk', sql.Int, newId)
                    .input('idHk', sql.Int, hkIdInt)
                    .input('qh', sql.NVarChar, data.vaiTro)
                    .query(`INSERT INTO THANHVIENCUAHO (IDNHANKHAU, IDHOKHAU, QUANHEVOICHUHO) VALUES (@idNk, @idHk, @qh)`);
            }
        } else {
            // Logic Update (Cần parse ID string 'NK001' -> 1)
            const idInt = parseInt(data.id.replace('NK', ''));
            await pool.request()
                .input('id', sql.Int, idInt)
                .input('hoten', sql.NVarChar, data.ten)
                // ... map các trường khác
                .query(`UPDATE NHANKHAU SET HOTEN = @hoten WHERE ID = @id`);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. TẠM TRÚ & TẠM VẮNG (Giữ nguyên logic cũ)
app.get('/api/temp-residents', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                tt.ID, 
                'TT' + RIGHT('000' + CAST(tt.ID AS VARCHAR(10)), 3) as id,
                nk.HOTEN as ten,
                FORMAT(nk.NGAYSINH, 'yyyy-MM-dd') as ngaySinh, 
                nk.GIOITINH as gioiTinh, 
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                nk.NGUYENQUAN as queQuan, 
                nk.NOITHUONGTRU as diaChiThuongTru, 
                tt.NOIOHIENTAI AS noiTamTru,
                FORMAT(tt.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                DATEDIFF(day, tt.TUNGAY, tt.DENNGAY) as thoiHanNgay
            FROM TAMTRU tt 
            JOIN NHANKHAU nk ON tt.IDNHANKHAU = nk.ID
            LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD

        `);
        const data = result.recordset.map(item => ({
            ...item,
            thoiHanTamTru: item.thoiHanNgay ? Math.floor(item.thoiHanNgay / 30) + " tháng" : "N/A"
        }));
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/absent-residents', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                tv.ID, 
                'TV' + RIGHT('000' + CAST(tv.ID AS VARCHAR(10)), 3) as id, 
                nk.HOTEN as ten,
                FORMAT(nk.NGAYSINH, 'yyyy-MM-dd') as ngaySinh, 
                nk.GIOITINH as gioiTinh, 
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                (SELECT TOP 1 'HK' + RIGHT('000' + CAST(IDHOKHAU AS VARCHAR(10)), 3) 
                FROM THANHVIENCUAHO WHERE IDNHANKHAU = nk.ID) as hoKhau,
                nk.NOITHUONGTRU as diaChiCu,
                tv.NOITAMTRU as noiChuyenDen, 
                FORMAT(tv.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                DATEDIFF(day, tv.TUNGAY, tv.DENNGAY) as thoiHanNgay
                FROM TAMVANG as tv 
                JOIN NHANKHAU nk ON tv.IDNHANKHAU = nk.ID
                LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
        `);
        const data = result.recordset.map(item => ({
            ...item,
            thoiHanTamVang: item.thoiHanNgay ? Math.floor(item.thoiHanNgay / 30) + " tháng" : "N/A"
        }));
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});


app.post('/api/temp-residents', async (req, res) => {
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();
        const reqT = new sql.Request(transaction);
        let nkId = null;

        // B1: Xử lý thông tin Nhân khẩu (Nếu có ID thì update, không thì tạo mới)
        if (data.id && data.id.startsWith('TT')) {
            // Trường hợp sửa: Lấy ID nhân khẩu từ bảng TAMTRU cũ để update
            const oldRec = await new sql.Request().query(`SELECT IDNHANKHAU FROM TAMTRU WHERE ID = ${data.id.replace('TT', '')}`);
            if (oldRec.recordset.length > 0) {
                nkId = oldRec.recordset[0].IDNHANKHAU;
                // Update Nhân khẩu
                await reqT
                    .input('idNk', sql.Int, nkId)
                    .input('hoten', sql.NVarChar, data.ten)
                    .input('ns', sql.Date, data.ngaySinh)
                    .input('gt', sql.NVarChar, data.gioiTinh)
                    .input('cccd', sql.VarChar, data.cccd)
                    .input('que', sql.NVarChar, data.queQuan)
                    .query(`UPDATE NHANKHAU SET HOTEN=@hoten, NGAYSINH=@ns, GIOITINH=@gt, SOCCCD=@cccd, NGUYENQUAN=@que WHERE ID=@idNk`);
            }
        }

        if (!nkId) {
            // Trường hợp thêm mới: Insert Nhân khẩu
            const nkRes = await reqT
                .input('newHoTen', sql.NVarChar, data.ten)
                .input('newNs', sql.Date, data.ngaySinh)
                .input('newGt', sql.NVarChar, data.gioiTinh)
                .input('newCccd', sql.VarChar, data.cccd)
                .input('newQue', sql.NVarChar, data.queQuan)
                .input('newTt', sql.NVarChar, data.diaChiThuongTru) // Địa chỉ thường trú (ở quê)
                .query(`INSERT INTO NHANKHAU (HOTEN, NGAYSINH, GIOITINH, SOCCCD, NGUYENQUAN, NOITHUONGTRU) 
                        OUTPUT INSERTED.ID VALUES (@newHoTen, @newNs, @newGt, @newCccd, @newQue, @newTt)`);
            nkId = nkRes.recordset[0].ID;
        }

        // B1.5: Xử lý bảng CANCUOCCONGDAN (nếu có thông tin CCCD)
        if (data.cccd) {
            // Kiểm tra xem CCCD đã tồn tại chưa
            const ccCheck = await reqT
                .input('checkCccd', sql.VarChar, data.cccd)
                .query(`SELECT SOCCCD FROM CANCUOCCONGDAN WHERE SOCCCD = @checkCccd`);

            if (ccCheck.recordset.length > 0) {
                // Update nếu có ngày cấp và nơi cấp
                if (data.cccdNgayCap || data.cccdNoiCap) {
                    await reqT
                        .input('cccdUpd', sql.VarChar, data.cccd)
                        .input('ngayCap', sql.Date, data.cccdNgayCap || null)
                        .input('noiCap', sql.NVarChar, data.cccdNoiCap || null)
                        .query(`UPDATE CANCUOCCONGDAN SET NGAYCAP=@ngayCap, NOICAP=@noiCap WHERE SOCCCD=@cccdUpd`);
                }
            } else {
                // Insert mới
                await reqT
                    .input('newCccdSo', sql.VarChar, data.cccd)
                    .input('newNgayCap', sql.Date, data.cccdNgayCap || new Date())
                    .input('newNoiCap', sql.NVarChar, data.cccdNoiCap || 'Chưa cập nhật')
                    .query(`INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP) VALUES (@newCccdSo, @newNgayCap, @newNoiCap)`);
            }
        }

        // B2: Xử lý bảng TAMTRU
        if (data.id && data.id.startsWith('TT')) {
            // Update Tạm trú
            const ttId = parseInt(data.id.replace('TT', ''));
            await reqT
                .input('ttId', sql.Int, ttId)
                .input('noiTamTru', sql.NVarChar, data.noiTamTru)
                .input('ngayDk', sql.Date, data.ngayDangKy)
                .input('thoiHan', sql.Date, data.denNgay) // Lưu ý: Database của bạn dùng DENNGAY (Date), cần tính toán từ thời hạn
                .query(`UPDATE TAMTRU SET NOIOHIENTAI=@noiTamTru, TUNGAY=@ngayDk, DENNGAY=@thoiHan WHERE ID=@ttId`);
        } else {
            // Insert Tạm trú
            await reqT
                .input('newNkId', sql.Int, nkId)
                .input('newNoiTamTru', sql.NVarChar, data.noiTamTru)
                .input('newNgayDk', sql.Date, data.ngayDangKy)
                // Giả sử hạn mặc định 6 tháng nếu không chọn
                .query(`INSERT INTO TAMTRU (IDNHANKHAU, NOIOHIENTAI, TUNGAY) VALUES (@newNkId, @newNoiTamTru, @newNgayDk)`);
        }

        await transaction.commit();
        res.json({ success: true });
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/temp-residents/:id', async (req, res) => {
    try {
        const pool = await connectDB();
        const id = parseInt(req.params.id.replace('TT', ''));
        // Xóa trong bảng TAMTRU (Không xóa nhân khẩu để lưu hồ sơ)
        await pool.request().query(`DELETE FROM TAMTRU WHERE ID = ${id}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. THÊM / CẬP NHẬT TẠM VẮNG
// Logic: Tạm vắng là người có hộ khẩu đi nơi khác -> Đã có Nhân khẩu
app.post('/api/absent-residents', async (req, res) => {
    const data = req.body;
    try {
        const pool = await connectDB();

        // Cần tìm ID nhân khẩu thật dựa trên mã hiển thị (NK001 -> 1) hoặc tên/cccd
        let nkId = null;
        if (data.nhanKhauId && data.nhanKhauId.startsWith('NK')) {
            nkId = parseInt(data.nhanKhauId.replace('NK', ''));
        }

        if (!nkId) return res.status(400).json({ success: false, message: "Cần chọn nhân khẩu chính xác" });

        if (data.id && data.id.startsWith('TV')) {
            // Update
            const tvId = parseInt(data.id.replace('TV', ''));
            await pool.request()
                .input('id', sql.Int, tvId)
                .input('noiDen', sql.NVarChar, data.noiChuyenDen)
                .input('ngayDi', sql.Date, data.ngayDangKy)
                .query(`UPDATE TAMVANG SET NOITAMTRU=@noiDen, TUNGAY=@ngayDi WHERE ID=@id`);
        } else {
            // Insert
            await pool.request()
                .input('nkId', sql.Int, nkId)
                .input('noiDen', sql.NVarChar, data.noiChuyenDen)
                .input('ngayDi', sql.Date, data.ngayDangKy)
                .query(`INSERT INTO TAMVANG (IDNHANKHAU, NOITAMTRU, TUNGAY) VALUES (@nkId, @noiDen, @ngayDi)`);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/absent-residents/:id', async (req, res) => {
    try {
        const pool = await connectDB();
        const id = parseInt(req.params.id.replace('TV', ''));
        await pool.request().query(`DELETE FROM TAMVANG WHERE ID = ${id}`);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
});