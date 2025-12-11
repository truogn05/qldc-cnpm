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
                nk.NOISINH as noiSinh,
                nk.GIOITINH as gioiTinh,
                nk.SODIENTHOAI as sdt,
                nk.EMAIL as email,
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                nk.NGHENGHIEP as nghe,
                nk.NOILAMVIEC as noiLamViec,
                nk.TRINHDOHOCVAN as trinhDoHocVan,
                nk.QUOCTICH as quocTich,
                nk.DANTOC as danToc,
                nk.TONGIAO as tonGiao,
                nk.NGUYENQUAN as queQuan,
                nk.NOITHUONGTRU as diaChiThuongTru,
                tv.DIACHITRUOCKHICHUYENDEN as diaChiTruoc,
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
        const result = await pool.request()
            .query(`
                SELECT 
                    nk.ID as realId,
                    'NK' + RIGHT('000' + CAST(nk.ID AS VARCHAR(10)), 3) as id,
                    nk.HOTEN as ten,
                    FORMAT(nk.NGAYSINH, 'yyyy-MM-dd') as ngaySinh,
                    nk.NOISINH as noiSinh,
                    nk.GIOITINH as gioiTinh,
                    nk.SODIENTHOAI as sdt,
                    nk.EMAIL as email,
                    nk.SOCCCD as cccd,
                    FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                    cc.NOICAP as cccdNoiCap,
                    nk.NGHENGHIEP as nghe,
                    nk.NOILAMVIEC as noiLamViec,
                    nk.TRINHDOHOCVAN as trinhDoHocVan,
                    nk.QUOCTICH as quocTich,
                    nk.DANTOC as danToc,
                    nk.TONGIAO as tonGiao,
                    nk.NGUYENQUAN as queQuan,
                    nk.NOITHUONGTRU as diaChiThuongTru,
                    tv.DIACHITRUOCKHICHUYENDEN as diaChiTruoc,
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
        if (!data.id) {//nếu id == null -> chưa có -> thêm
            const result = await pool.request()
                .input('hoten', sql.NVarChar, data.ten)
                .input('ngaysinh', sql.Date, data.ngaySinh)
                .input('gioitinh', sql.NVarChar, data.gioiTinh)
                .input('sdt', sql.NVarChar, data.sdt)
                .input('email', sql.NVarChar, data.email)
                .input('noisinh', sql.NVarChar, data.noiSinh)
                .input('cccd', sql.NVarChar, data.cccd)
                .input('cccd_nc', sql.Date, data.cccdNgayCap)
                .input('cccd_noicap',sql.NVarChar, data.cccdNoiCap)
                .input('dantoc', sql.NVarChar, data.danToc)
                .input('tongiao', sql.NVarChar, data.tonGiao)
                .input('quoctich', sql.NVarChar, data.quocTich)
                .input('queQuan', sql.NVarChar, data.queQuan)
                .input('trinhdohocvan', sql.NVarChar, data.trinhDoHocVan)
                .input('nghe', sql.NVarChar, data.nghe)
                .input('noilamviec', sql.NVarChar, data.noiLamViec)
                .input('noiohientai', sql.NVarChar, data.noiOHienTai)
                .query(`
                    BEGIN TRANSACTION;

                    INSERT INTO NHANKHAU
                        (HOTEN, NGAYSINH, GIOITINH, SODIENTHOAI, EMAIL, NOISINH,
                        SOCCCD, CCCD_NGAYCAP, CCCD_NOICAP,
                        DANTOC, TONGIAO, QUOCTICH,
                        NGUYENQUAN, TRINHDOHOCVAN, NGHENGHIEP,
                        NOILAMVIEC, DIACHIHIENNAY)
                    VALUES
                        (@hoten, @ngaysinh, @gioitinh, @sdt, @email, @noisinh,
                        @cccd, @cccd_nc, @cccd_noicap,
                        @dantoc, @tongiao, @quoctich,
                        @queQuan, @trinhdohocvan, @nghe,
                        @noilamviec, @noiohientai);

                    INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP) VALUES
                        (@cccd, @cccd_nc, @cccd_noicap);
                    
                    COMMIT TRANSACTION;
                    `);



        } else {
            // Logic Update (Cần parse ID string 'NK001' -> 1)
            const idInt = parseInt(data.id.replace('NK', ''));
            await pool.request()
                .input('id', sql.Int, idInt)
                .input('hoten', sql.NVarChar, data.ten)
                .input('ngaysinh', sql.Date, data.ngaySinh)
                .input('gioitinh', sql.NVarChar, data.gioiTinh)
                .input('sdt', sql.NVarChar, data.sdt)
                .input('email', sql.NVarChar, data.email)
                .input('noisinh', sql.NVarChar, data.noiSinh)
                .input('cccd', sql.NVarChar, data.cccd)
                .input('cccd_nc', sql.Date, data.cccdNgayCap)
                .input('cccd_noicap',sql.NVarChar, data.cccdNoiCap)
                .input('dantoc', sql.NVarChar, data.danToc)
                .input('tongiao', sql.NVarChar, data.tonGiao)
                .input('quoctich', sql.NVarChar, data.quocTich)
                .input('queQuan', sql.NVarChar, data.queQuan)
                .input('trinhdohocvan', sql.NVarChar, data.trinhDoHocVan)
                .input('nghe', sql.NVarChar, data.nghe)
                .input('noilamviec', sql.NVarChar, data.noiLamViec)
                .input('noiohientai', sql.NVarChar, data.noiOHienTai)
                // ... map các trường khác
                .query(`
                    BEGIN TRANSACTION;

                    -- 1. Lấy CCCD cũ của nhân khẩu
                    DECLARE @oldCCCD NVARCHAR(50);
                    SELECT @oldCCCD = SOCCCD FROM NHANKHAU WHERE ID = @id;
                    
                    -- 3. Kiểm tra CCCD mới đã tồn tại hay chưa
                    IF EXISTS (SELECT 1 FROM CANCUOCCONGDAN WHERE SOCCCD = @cccd)
                    BEGIN
                        -- Update nếu đã tồn tại
                        UPDATE CANCUOCCONGDAN
                        SET 
                            NGAYCAP = @cccd_nc,
                            NOICAP = @cccd_noicap
                        WHERE SOCCCD = @cccd;
                    END
                    ELSE
                    BEGIN
                        -- Insert nếu chưa có
                        INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP)
                        VALUES (@cccd, @cccd_nc, @cccd_noicap);
                    END;

                    -- 4. Update bảng nhân khẩu
                    UPDATE NHANKHAU 
                    SET 
                        HOTEN = @hoten,
                        NGAYSINH = @ngaysinh,
                        GIOITINH = @gioitinh,
                        SODIENTHOAI = @sdt,
                        EMAIL = @email,
                        NOISINH = @noisinh,
                        DANTOC = @dantoc,
                        TONGIAO = @tongiao,
                        QUOCTICH = @quoctich,
                        NGUYENQUAN = @queQuan,
                        TRINHDOHOCVAN = @trinhdohocvan,
                        NGHENGHIEP = @nghe,
                        NOILAMVIEC = @noilamviec,
                        DIACHIHIENNAY = @noiohientai,
                        SOCCCD = @cccd
                    WHERE ID = @id;

                    -- 2. Nếu CCCD thay đổi thì xóa CCCD cũ
                    IF (@oldCCCD IS NOT NULL AND @oldCCCD <> @cccd)
                    BEGIN
                        DELETE FROM CANCUOCCONGDAN WHERE SOCCCD = @oldCCCD;
                    END;
                    COMMIT TRANSACTION;

                    `);// KIỂM TRA NẾU CCCD BỊ THAY ĐỔI THÌ PHẢI XOÁ CÁI CŨ ĐI
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Lỗi API residents:", err);
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
                nk.NOISINH as noiSinh,
                nk.SODIENTHOAI as sdt,
                nk.EMAIL as email,
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                nk.NGHENGHIEP as nghe,
                nk.NOILAMVIEC as noiLamViec,
                nk.TRINHDOHOCVAN as trinhDoHocVan,
                nk.QUOCTICH as quocTich,
                nk.DANTOC as danToc,
                nk.TONGIAO as tonGiao,
                nk.NGUYENQUAN as queQuan,
                nk.NOITHUONGTRU as diaChiThuongTru, 
                tt.NOIOHIENTAI AS noiTamTru,

                FORMAT(tt.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                FORMAT(tt.DENNGAY, 'yyyy-MM-dd') as denNgay,
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
                nk.SODIENTHOAI as sdt,
                nk.EMAIL as email,
                nk.SOCCCD as cccd,
                FORMAT(cc.NGAYCAP, 'yyyy-MM-dd') as cccdNgayCap,
                cc.NOICAP as cccdNoiCap,
                nk.NOISINH as noiSinh,
                nk.NGHENGHIEP as nghe,
                nk.NOILAMVIEC as noiLamViec,
                nk.TRINHDOHOCVAN as trinhDoHocVan,
                nk.QUOCTICH as quocTich,
                nk.DANTOC as danToc,
                nk.TONGIAO as tonGiao,
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

        // ================== B1: XỬ LÝ CCCD TRƯỚC (Tránh lỗi khóa ngoại) ==================
        if (data.cccd) {
            const ccCheck = await reqT
                .input('checkCccd', sql.VarChar, data.cccd)
                .query(`SELECT SOCCCD FROM CANCUOCCONGDAN WHERE SOCCCD = @checkCccd`);

            if (ccCheck.recordset.length > 0) {
                // Update nếu có thông tin mới
                if (data.cccdNgayCap || data.cccdNoiCap) {
                    await reqT
                        .input('cccdUpd', sql.VarChar, data.cccd)
                        .input('ngayCap', sql.Date, data.cccdNgayCap || null)
                        .input('noiCap', sql.NVarChar, data.cccdNoiCap || null)
                        .query(`UPDATE CANCUOCCONGDAN SET NGAYCAP=@ngayCap, NOICAP=@noiCap WHERE SOCCCD=@cccdUpd`);
                }
            } else {
                // Insert CCCD mới
                await reqT
                    .input('newCccdSo', sql.VarChar, data.cccd)
                    .input('newNgayCap', sql.Date, data.cccdNgayCap || new Date())
                    .input('newNoiCap', sql.NVarChar, data.cccdNoiCap || 'Chưa cập nhật')
                    .query(`INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP) VALUES (@newCccdSo, @newNgayCap, @newNoiCap)`);
            }
        }

        // ================== B2: XỬ LÝ NHÂN KHẨU ==================
        // Trường hợp 1: Sửa bản ghi Tạm trú đã có
        if (data.id && data.id !== 'null' && data.id.startsWith('TT')) {
            const ttId = parseInt(data.id.replace('TT', ''));
            const oldRec = await reqT.query(`SELECT IDNHANKHAU FROM TAMTRU WHERE ID = ${ttId}`);
            if (oldRec.recordset.length > 0) {
                nkId = oldRec.recordset[0].IDNHANKHAU;
            }
        } 
        
        // Trường hợp 2: Thêm mới Tạm trú, kiểm tra xem nhân khẩu này đã tồn tại chưa (qua CCCD)
        if (!nkId && data.cccd) {
             const nkCheck = await reqT
                .input('checkNkCccd', sql.VarChar, data.cccd)
                .query(`SELECT ID FROM NHANKHAU WHERE SOCCCD = @checkNkCccd`);
             if (nkCheck.recordset.length > 0) {
                 nkId = nkCheck.recordset[0].ID;
             }
        }

        // Thực hiện Insert hoặc Update Nhân Khẩu
        if (nkId) {
            // Update thông tin nhân khẩu
            await reqT
                .input('idNk', sql.Int, nkId)
                .input('hoten', sql.NVarChar, data.ten)
                .input('ns', sql.Date, data.ngaySinh)
                .input('gt', sql.NVarChar, data.gioiTinh)
                .input('sdt', sql.VarChar, data.sdt || null)
                .input('email', sql.VarChar, data.email || null)
                .input('noisinh', sql.NVarChar, data.noiSinh || null)
                .input('que', sql.NVarChar, data.queQuan || null)
                .input('dantoc', sql.NVarChar, data.danToc || null)
                .input('tongiao', sql.NVarChar, data.tonGiao || null)
                .input('quoctich', sql.NVarChar, data.quocTich || null)
                .input('hocvan', sql.NVarChar, data.trinhDoHocVan || null)
                .input('nghe', sql.NVarChar, data.nghe || null)
                .input('noilamviec', sql.NVarChar, data.noiLamViec || null)
                .input('tt', sql.NVarChar, data.diaChiThuongTru || null)
                .query(`
                    UPDATE NHANKHAU SET 
                        HOTEN=@hoten, 
                        NGAYSINH=@ns, 
                        GIOITINH=@gt, 
                        SODIENTHOAI=@sdt,
                        EMAIL=@email, 
                        NOISINH=@noisinh, 
                        NGUYENQUAN=@que, 
                        DANTOC=@dantoc, TONGIAO=@tongiao, QUOCTICH=@quoctich, 
                        TRINHDOHOCVAN=@hocvan, 
                        NGHENGHIEP=@nghe, 
                        NOILAMVIEC=@noilamviec, 
                        NOITHUONGTRU=@tt
                    WHERE ID=@idNk
                `);
        } else {
            // Insert Nhân khẩu mới
            const nkRes = await reqT
                .input('newHoTen', sql.NVarChar, data.ten)
                .input('newNs', sql.Date, data.ngaySinh)
                .input('newGt', sql.NVarChar, data.gioiTinh)
                .input('newSdt', sql.VarChar, data.sdt || null)
                .input('newEmail', sql.VarChar, data.email || null)
                .input('newNoisinh', sql.NVarChar, data.noiSinh || null)
                .input('newCccd', sql.VarChar, data.cccd || null)
                .input('newQue', sql.NVarChar, data.queQuan || null)
                .input('newDantoc', sql.NVarChar, data.danToc || null)
                .input('newTongiao', sql.NVarChar, data.tonGiao || null)
                .input('newQuoctich', sql.NVarChar, data.quocTich || null)
                .input('newHocvan', sql.NVarChar, data.trinhDoHocVan || null)
                .input('newNghe', sql.NVarChar, data.nghe || null)
                .input('newNoilamviec', sql.NVarChar, data.noiLamViec || null)
                .input('newTt', sql.NVarChar, data.diaChiThuongTru || null)
                .query(`
                    INSERT INTO NHANKHAU (
                        HOTEN, NGAYSINH, GIOITINH, SODIENTHOAI, EMAIL, NOISINH, 
                        SOCCCD, NGUYENQUAN, DANTOC, TONGIAO, QUOCTICH, 
                        TRINHDOHOCVAN, NGHENGHIEP, NOILAMVIEC, NOITHUONGTRU
                    ) 
                    OUTPUT INSERTED.ID 
                    VALUES (
                        @newHoTen, 
                        @newNs, 
                        @newGt, 
                        @newSdt, 
                        @newEmail,
                        @newNoisinh,
                        @newCccd, 
                        @newQue, 
                        @newDantoc, 
                        @newTongiao, 
                        @newQuoctich,
                        @newHocvan, 
                        @newNghe, 
                        @newNoilamviec, 
                        @newTt
                    )
                `);
            nkId = nkRes.recordset[0].ID;
        }

        // ================== B3: XỬ LÝ TẠM TRÚ ==================
        if (data.id && data.id !== 'null' && data.id.startsWith('TT')) {
            // Update
            const ttId = parseInt(data.id.replace('TT', ''));
            await reqT
                .input('ttId', sql.Int, ttId)
                .input('noiTamTru', sql.NVarChar, data.noiTamTru)
                .input('ngayDk', sql.Date, data.ngayDangKy)
                // Lưu ý: data.denNgay từ frontend gửi lên phải là dạng 'YYYY-MM-DD'
                .input('denNgay', sql.Date, data.denNgay || null) 
                .query(`UPDATE TAMTRU SET NOIOHIENTAI=@noiTamTru, TUNGAY=@ngayDk, DENNGAY=@denNgay WHERE ID=@ttId`);
        } else {
            // Insert
            await reqT
                .input('newNkId', sql.Int, nkId)
                .input('newNoiTamTru', sql.NVarChar, data.noiTamTru)
                .input('newNgayDk', sql.Date, data.ngayDangKy)
                .input('newDenNgay', sql.Date,  data.denNgay || null)
                .query(`INSERT INTO TAMTRU (IDNHANKHAU, NOIOHIENTAI, TUNGAY, DENNGAY) VALUES (@newNkId, @newNoiTamTru, @newNgayDk, @newDenNgay)`);
        }

        await transaction.commit();
        res.json({ success: true, message: "Lưu thành công!" });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi API Tạm trú:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, detail: err });
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

        // Lấy ID nhân khẩu thực từ frontend
        let nkId = null;
        if (data.nhanKhauId && !isNaN(data.nhanKhauId)) {
            nkId = parseInt(data.nhanKhauId);
        } else if (data.nhanKhauId && data.nhanKhauId.startsWith('NK')) {
            nkId = parseInt(data.nhanKhauId.replace('NK', ''));
        }

        if (!nkId) return res.status(400).json({ success: false, message: "Cần chọn nhân khẩu chính xác" });

        // Parse thời hạn để tính DENNGAY (optional - nếu có format "X tháng" hoặc "Y năm")
        let denNgay = null;
        if (data.thoiHanTamVang) {
            const tungay = data.ngayDangKy ? new Date(data.ngayDangKy) : new Date();
            const duration = data.thoiHanTamVang.toLowerCase();

            if (duration.includes('tháng')) {
                const months = parseInt(duration.match(/\d+/)?.[0] || 6);
                denNgay = new Date(tungay);
                denNgay.setMonth(denNgay.getMonth() + months);
            } else if (duration.includes('năm')) {
                const years = parseInt(duration.match(/\d+/)?.[0] || 1);
                denNgay = new Date(tungay);
                denNgay.setFullYear(denNgay.getFullYear() + years);
            } else {
                // Default: 6 months
                denNgay = new Date(tungay);
                denNgay.setMonth(denNgay.getMonth() + 6);
            }
        }

        if (data.id && data.id.startsWith('TV')) {
            // Update
            const tvId = parseInt(data.id.replace('TV', ''));
            await pool.request()
                .input('id', sql.Int, tvId)
                .input('noiDen', sql.NVarChar, data.noiChuyenDen)
                .input('ngayDk', sql.Date, data.ngayDangKy || new Date())
                .input('denNgay', sql.Date, denNgay)
                .query(`UPDATE TAMVANG SET 
                    NOITAMTRU=@noiDen, 
                    TUNGAY=@ngayDk,
                    DENNGAY=@denNgay
                    WHERE ID=@id`);
        } else {
            // Insert - Use GETDATE() if no registration date provided
            const insertQuery = data.ngayDangKy
                ? `INSERT INTO TAMVANG (IDNHANKHAU, NOITAMTRU, TUNGAY, DENNGAY) VALUES (@nkId, @noiDen, @ngayDk, @denNgay)`
                : `INSERT INTO TAMVANG (IDNHANKHAU, NOITAMTRU, TUNGAY, DENNGAY) VALUES (@nkId, @noiDen, GETDATE(), @denNgay)`;

            const request = pool.request()
                .input('nkId', sql.Int, nkId)
                .input('noiDen', sql.NVarChar, data.noiChuyenDen)
                .input('denNgay', sql.Date, denNgay);

            if (data.ngayDangKy) {
                request.input('ngayDk', sql.Date, data.ngayDangKy);
            }

            await request.query(insertQuery);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving absent resident:', err);
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