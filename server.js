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

// === HELPER: Chuyển chuỗi địa chỉ thành Object ===
// DB lưu: "Số 1, Đường A, Phường B, Quận C, TP D"
// Frontend cần: { soNha: "Số 1", duong: "Đường A", ... }
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

// === API ROUTES ===

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
            res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập '});
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY TOÀN BỘ HỘ KHẨU (KÈM NHÂN KHẨU)
app.get('/api/households', async (req, res) => {
    try {
        const pool = await connectDB();
        
        // Query Hộ khẩu
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

        // Query Thành viên (Join bảng THANHVIENCUAHO)
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

        // Ghép dữ liệu (Mapping)
        const households = hkRes.recordset.map(hk => ({
            id: hk.maHoKhau,
            realId: hk.ID, // ID int dùng để gửi request update/delete
            chuHo: hk.chuHo,
            diaChi: parseDiaChi(hk.diaChiFull),
            ngayLapSo: hk.ngayLapSo,
            lichSuThayDoi: [], // Tạm thời để trống hoặc query bảng lịch sử nếu cần
            nhanKhau: tvRes.recordset
                .filter(nk => nk.IDHOKHAU === hk.ID)
                .map(nk => ({
                    ...nk,
                    hoKhauId: hk.maHoKhau
                }))
        }));

        res.json(households);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. THÊM HỘ KHẨU MỚI (Transaction)
app.post('/api/households', async (req, res) => {
    const { chuHo, diaChi, ngayLapSo } = req.body;
    const diaChiStr = `${diaChi.soNha}, ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.tinh}`;
    
    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();
        const reqT = new sql.Request(transaction);

        // B1: Tạo nhân khẩu Chủ Hộ
        const nkRes = await reqT
            .input('hoten', sql.NVarChar, chuHo)
            .input('ngaySinh', sql.Date, new Date()) // Tạm lấy ngày hiện tại
            .input('gioitinh', sql.NVarChar, 'Không rõ')
            .query(`INSERT INTO NHANKHAU (HOTEN, NGAYSINH, GIOITINH) OUTPUT INSERTED.ID VALUES (@hoten, @ngaySinh, @gioitinh)`);
        
        const idChuHo = nkRes.recordset[0].ID;

        // B2: Tạo Hộ khẩu
        const hkRes = await reqT
            .input('idChuHo', sql.Int, idChuHo)
            .input('dc', sql.NVarChar, diaChiStr)
            .input('nl', sql.Date, ngayLapSo)
            .query(`INSERT INTO HOKHAU (IDCHUHO, DIACHI, NGAYLAP) OUTPUT INSERTED.ID VALUES (@idChuHo, @dc, @nl)`);
            
        const idHK = hkRes.recordset[0].ID;

        // B3: Link vào bảng THANHVIENCUAHO
        await reqT
            .input('idNk', sql.Int, idChuHo)
            .input('idHk', sql.Int, idHK)
            .query(`INSERT INTO THANHVIENCUAHO (IDNHANKHAU, IDHOKHAU, QUANHEVOICHUHO) VALUES (@idNk, @idHk, N'Chủ hộ')`);

        await transaction.commit();
        res.json({ success: true });
    } catch (err) {
        if(transaction) await transaction.rollback();
        res.status(500).json({ error: err.message });
    }
});

// 4. XOÁ HỘ KHẨU
app.delete('/api/households/:id', async (req, res) => {
    // ID nhận vào dạng 'HK001', cần cắt lấy số 1
    const idInt = parseInt(req.params.id.replace('HK', ''));
    try {
        const pool = await connectDB();
        // Xóa khóa ngoại trước
        await pool.request().input('id', sql.Int, idInt).query(`
            DELETE FROM THANHVIENCUAHO WHERE IDHOKHAU = @id;
            DELETE FROM HOKHAU WHERE ID = @id;
        `);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. LẤY DANH SÁCH TẠM TRÚ
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
                nk.NGUYENQUAN as queQuan,
                nk.NOITHUONGTRU as diaChiThuongTru,
                tt.NOITAMTRU as noiTamTru,
                FORMAT(tt.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                DATEDIFF(day, tt.TUNGAY, tt.DENNGAY) as thoiHanNgay
            FROM TAMTRU tt
            JOIN NHANKHAU nk ON tt.IDNHANKHAU = nk.ID
        `);
        // Map thoiHanNgay sang chuỗi "X tháng" nếu cần
        const data = result.recordset.map(item => ({
            ...item,
            thoiHanTamTru: Math.floor(item.thoiHanNgay / 30) + " tháng"
        }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. LẤY DANH SÁCH TẠM VẮNG
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
                'HK' + RIGHT('000' + CAST(tv.IDNHANKHAU AS VARCHAR(10)), 3) as hoKhau, 
                nk.NOITHUONGTRU as diaChiCu,
                tv.NOITAMTRU as noiChuyenDen,
                FORMAT(tv.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                 DATEDIFF(day, tv.TUNGAY, tv.DENNGAY) as thoiHanNgay
            FROM TAMVANG tv
            JOIN NHANKHAU nk ON tv.IDNHANKHAU = nk.ID
        `);
         const data = result.recordset.map(item => ({
            ...item,
            thoiHanTamVang: Math.floor(item.thoiHanNgay / 30) + " tháng"
        }));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Chạy server
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));