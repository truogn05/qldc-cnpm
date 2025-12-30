const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { connectDB, sql } = require('./config/db');
const { error } = require('console');

const app = express();
const PORT = 3000;

// Session configuration
app.use(session({
    secret: 'quan-ly-dan-cu-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    }
}));

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// === MIDDLEWARE: Authentication ===
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 1) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    next();
}

function requireCitizen(req, res, next) {
    if (!req.session.user || req.session.user.role !== 2) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    next();
}

// === HELPER: Parse địa chỉ ===
function parseDiaChi(diaChiStr) {
    if (!diaChiStr) return { soNha: "", ngo: "", duong: "", phuong: "", quan: "", tinh: "" };
    const parts = diaChiStr.split(',').map(s => s.trim());
    return {
        soNha: parts[0] || "",
        ngo: parts[1] || "",
        duong: parts[2] || "",
        phuong: parts[3] || "",
        quan: parts[4] || "",
        tinh: parts[5] || ""
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
            .query('SELECT * FROM USERS WHERE USERNAME = @u');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // Compare password (plain text for now, should use bcrypt in production)
            if (user.PASSWD === password) {
                let nkId = null;

                // If role 2 (citizen), get nkId from NHANKHAU
                if (user.ROLE === 2 && user.CCCD) {
                    const nkResult = await pool.request()
                        .input('cccd', sql.VarChar, user.CCCD)
                        .query('SELECT ID FROM NHANKHAU WHERE SOCCCD = @cccd');

                    if (nkResult.recordset.length > 0) {
                        nkId = nkResult.recordset[0].ID;
                    }
                }

                // Store user in session
                req.session.user = {
                    id: user.ID,
                    username: user.USERNAME,
                    role: user.ROLE,
                    cccd: user.CCCD,
                    nkId: nkId
                };

                res.json({
                    success: true,
                    user: {
                        id: user.ID,
                        username: user.USERNAME,
                        role: user.ROLE,
                        cccd: user.CCCD,
                        nkId: nkId
                    }
                });
            } else {
                res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ĐĂNG KÝ (Dành cho công dân)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await connectDB();

        // Validate CCCD exists
        const cccdCheck = await pool.request()
            .input('cccd', sql.VarChar, username)
            .query('SELECT SOCCCD FROM CANCUOCCONGDAN WHERE SOCCCD = @cccd');

        if (cccdCheck.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Số CCCD không tồn tại trong hệ thống'
            });
        }

        // Check if username already taken
        const userCheck = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT ID FROM USERS WHERE USERNAME = @username');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tài khoản đã tồn tại'
            });
        }

        // Create new citizen user
        await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .input('cccd', sql.VarChar, username)
            .query(`
                INSERT INTO USERS (USERNAME, PASSWD, ROLE, CCCD)
                VALUES (@username, @password, 2, @cccd)
            `);

        res.json({
            success: true,
            message: 'Đăng ký thành công! Vui lòng đăng nhập.'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            message: 'Đăng ký thất bại'
        });
    }
});

// 3. ĐĂNG XUẤT
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
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
                hk.IDCHUHO as idCH,
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
                nk.ID as nkID,
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
                FORMAT(tv.NGAYDKTHUONGTRU, 'yyyy-MM-dd') as ngayDKTT,
                nk.GHICHU as ghiChu
            FROM THANHVIENCUAHO tv
            JOIN NHANKHAU nk ON tv.IDNHANKHAU = nk.ID
            LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
            ORDER BY 
                CASE 
                WHEN tv.QUANHEVOICHUHO = N'Chủ hộ' THEN 0 
                WHEN tv.QUANHEVOICHUHO IN (N'Vợ', N'Chổng') THEN 1
                ELSE 2
            END,
            nk.ID;
        `);

        const households = hkRes.recordset.map(hk => ({
            id: hk.maHoKhau,
            realId: hk.ID,
            chuHo: hk.chuHo,
            idCH: hk.idCH,
            diaChi: parseDiaChi(hk.diaChiFull),
            diaChiFull: hk.diaChiFull,
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
app.get('/api/history/households/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const pool = await connectDB();

        // Lấy thông tin Hộ Khẩu
        const lsHK = await pool
            .request()
            .input('id', sql.Int, id)
            .query(`
                        SELECT 
                            THONGTIN AS tt,
                            FORMAT(NGAYTHAYDOI, 'yyyy-MM-dd') AS ngay
                        FROM LICHSUHOKHAU
                        WHERE IDHOKHAU = @id
                        ORDER BY ID DESC
                        `)
        res.json(lsHK.recordset);
    }
    catch (e) {
        console.error("lỗi khi get history", e.message);
        res.status(500).json({ error: e.message });
    }
});
app.post('/api/history/households', async (req, res) => {
    const data = req.body;
    try {
        const pool = await connectDB();

        // Lấy thông tin Hộ Khẩu
        await pool
            .request()
            .input('id', sql.Int, data.id)
            .input('tt', sql.NVarChar, data.tt)
            .query(`
                        INSERT INTO LICHSUHOKHAU (IDHOKHAU, NGAYTHAYDOI, THONGTIN)
                        VALUES (@id, GETDATE(), @tt)

                        `)
        res.json({ success: true });
    }
    catch (e) {
        console.error("lỗi khi lưu history", e.message);
        res.status(500).json({ error: e.message });
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
                    nk.ID as nkID,
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
    //const id = parseInt(req.params.id);
    const data = req.body;
    //const diaChiStr = `${diaChi.soNha}, ${diaChi.ngo}, ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.tinh}`;
    diaChi = data.household;
    const diaChiStr = [
        diaChi?.soNha,
        diaChi?.ngo,
        diaChi?.toDanPho,
        diaChi?.phuongXa,
        diaChi?.quanHuyen,
        diaChi?.tinhTP
    ].filter(Boolean).join(', ');
    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();

        const chuHo = data.chuHo;
        const reqT = new sql.Request(transaction);
        const result = await reqT
            .input('diaChi', sql.NVarChar, diaChiStr)
            .input('ngayLap', sql.Date, new Date())
            //----- TT CHỦ HỘ
            .input("hoTen", sql.NVarChar, chuHo.hoTen)
            .input("ngaySinh", sql.Date, chuHo.ngaySinh)
            .input("gioiTinh", sql.NVarChar, chuHo.gioiTinh)
            .input("sdt", sql.NVarChar, chuHo.sdt)
            .input("email", sql.NVarChar, chuHo.email)
            .input("noiSinh", sql.NVarChar, chuHo.noiSinh)
            .input("cccd", sql.NVarChar, chuHo.cccd)
            .input("cccdNgayCap", sql.Date, chuHo.cccdNgayCap)
            .input("cccdNoiCap", sql.NVarChar, chuHo.cccdNoiCap)
            .input("danToc", sql.NVarChar, chuHo.danToc)
            .input("tonGiao", sql.NVarChar, chuHo.tonGiao)
            .input("quocTich", sql.NVarChar, chuHo.quocTich)
            .input("nguyenQuan", sql.NVarChar, chuHo.nguyenQuan)
            .input("hocVan", sql.NVarChar, chuHo.hocVan)
            .input("ngheNghiep", sql.NVarChar, chuHo.ngheNghiep)
            .input("noiLamViec", sql.NVarChar, chuHo.noiLamViec)
            .input("diaChiTruoc", sql.NVarChar, chuHo.diaChiTruoc)
            .query(`
                DECLARE @tblHK TABLE (ID INT);
                DECLARE @tblCH TABLE (ID INT);

                

                -- 2. CCCD
                IF NOT EXISTS (SELECT 1 FROM CANCUOCCONGDAN WHERE SOCCCD = @cccd)
                BEGIN
                INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP)
                VALUES (@cccd, @cccdNgayCap, @cccdNoiCap);
                END
                ELSE
                BEGIN
                    THROW 50001, N'Vui lòng kiểm tra lại thông tin CCCD', 1;
                END
                -- 3. NHÂN KHẨU
                INSERT INTO NHANKHAU (
                HOTEN, NGAYSINH, GIOITINH, SODIENTHOAI, EMAIL, NOISINH,
                SOCCCD, DANTOC, TONGIAO, QUOCTICH, NGUYENQUAN,
                TRINHDOHOCVAN, NGHENGHIEP, NOILAMVIEC,
                NOITHUONGTRU, DIACHIHIENNAY
                )
                OUTPUT INSERTED.ID INTO @tblCH
                VALUES (
                @hoTen, @ngaySinh, @gioiTinh, @sdt, @email, @noiSinh,
                @cccd, @danToc, @tonGiao, @quocTich, @nguyenQuan,
                @hocVan, @ngheNghiep, @noiLamViec,
                @diaChi, @diaChi
                );

                DECLARE @idCH INT = (SELECT TOP 1 ID FROM @tblCH);

                -- 1. HỘ KHẨU
                INSERT INTO HOKHAU (IDCHUHO, DIACHI, NGAYLAP)
                OUTPUT INSERTED.ID INTO @tblHK
                VALUES (@idCH, @diaChi, @ngayLap);

                DECLARE @idHK INT = (SELECT TOP 1 ID FROM @tblHK);

                -- 4. LIÊN KẾT HỘ
                INSERT INTO THANHVIENCUAHO (
                IDNHANKHAU, IDHOKHAU, QUANHEVOICHUHO, DIACHITRUOCKHICHUYENDEN
                )
                VALUES (@idCH, @idHK, N'Chủ hộ', @diaChiTruoc);

                SELECT @idHK AS idHK;
                `)

        await transaction.commit();
        res.json({ hkId: result.recordset[0].idHK, success: true, message: "Tạo hộ khẩu mới thành công!" });
    } catch (err) {
        console.error("lỗi khi add household ", err)
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, error: err.message, message: "Tạo hộ khẩu mới không thành công!" });
    }
});
//tách hộ
app.post('/api/households/split', async (req, res) => {
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();

        const newHK = data.HoKhauMoi;
        /* =======================
           TVP: danh sách thành viên
        ======================= */
        const tvp = new sql.Table("dbo.ThanhVienType");
        tvp.columns.add("IDNHANKHAU", sql.Int);
        tvp.columns.add("QUANHEVOICHUHO", sql.NVarChar(50));

        newHK.thanhVien.forEach(tv => {
            tvp.rows.add(tv.id, tv.vaiTro);
        });

        //throw new Error();
        const reqT = new sql.Request(transaction);

        const result = await reqT
            // ---- hộ khẩu cũ
            .input('oldHkId', sql.Int, data.idHoKhauCu)

            // ---- hộ khẩu mới
            .input('diaChi', sql.NVarChar, data.diaChi)
            .input('ngayLap', sql.Date, new Date())
            .input('idCHMoi', sql.Int, newHK.idChuHo)

            // ---- TVP thành viên
            .input('thanhVien', tvp)
            .execute('dbo.SplitHousehold');

        await transaction.commit();

        res.json({
            success: true,
            newHkId: result.recordset[0].newHkId,
            message: "Tách hộ khẩu thành công!"
        });

    } catch (err) {
        await transaction.rollback();
        console.error("Lỗi khi split household:", err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: "Tách hộ khẩu không thành công!"
        });
    }
});


//sửa tt hk
app.put('/api/households/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { chuHo, diaChi, ngayLapSo } = req.body;
    //const diaChiStr = `${diaChi.soNha}, ${diaChi.ngo}, ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.tinh}`;
    const diaChiStr = [
        diaChi?.soNha,
        diaChi?.ngo,
        diaChi?.duong,
        diaChi?.phuong,
        diaChi?.quan,
        diaChi?.tinh
    ].filter(Boolean).join(', ');
    //const isEdit = id!==null;
    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();
        const check = await new sql.Request(transaction)
            .input('id', sql.Int, id)
            .query(`SELECT DIACHI FROM HOKHAU WHERE ID = @id`);

        if (check.recordset[0]?.DIACHI === diaChiStr) {
            return res.status(400).json({
                success: false,
                message: "Địa chỉ chưa thay đổi",
                type: 1
            });
        }
        const reqT = new sql.Request(transaction);
        await reqT
            .input('diaChi', sql.NVarChar, diaChiStr)
            .input('id', sql.Int, id)
            .query(`
                UPDATE HOKHAU
                SET DIACHI = @diaChi
                WHERE ID = @id;

                UPDATE nk
                SET 
                    nk.NOITHUONGTRU = @diaChi,
                    nk.DIACHIHIENNAY = 
                        CASE 
                            WHEN nk.DIACHIHIENNAY = nk.NOITHUONGTRU 
                            THEN @diaChi
                            ELSE nk.DIACHIHIENNAY
                        END
                FROM NHANKHAU nk
                INNER JOIN THANHVIENCUAHO tv
                    ON nk.ID = tv.IDNHANKHAU
                WHERE tv.IDHOKHAU = @id;
                `)

        await transaction.commit();
        res.json({ success: true, message: "Sửa thông tin hộ khẩu thành công!" });
    } catch (err) {
        console.error("lỗi khi put household id", err)
        //if (transaction) await transaction.rollback();

        res.status(500).json({ success: false, error: err.message, message: "Sửa hộ khẩu mới không thành công!", type: 0 });
    }
});

//thay đổi chủ hộ
app.put('/api/households/owner/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();

        const tvp = new sql.Table("dbo.ThanhVienType");
        tvp.columns.add("IDNHANKHAU", sql.Int);
        tvp.columns.add("QUANHEVOICHUHO", sql.NVarChar(50));

        data.tv.forEach(tv => {
            tvp.rows.add(tv.id, tv.vaiTro);
        });
        const reqT = new sql.Request(transaction);
        await reqT

            .input('idHK', sql.Int, data.idHK)
            .input('newOwnerId', sql.Int, data.newOwnerId)
            .input('thanhVien', tvp)
            .execute('dbo.changeOwner');

        await transaction.commit();
        res.json({ success: true, message: "Thay đổi chủ hộ khẩu thành công!" });
    } catch (err) {
        console.error("lỗi khi đổi chủ hộ", err)
        //if (transaction) await transaction.rollback();
        res.status(500).json({ error: err.message, message: "Đổi chủ hộ không thành công!" });
    }
});

//thêm nhân khẩu mới vào hộ khẩu
app.post('/api/households/resident', async (req, res) => {
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();
        const reqT = new sql.Request(transaction);
        await reqT
            .input("hoTen", sql.NVarChar, data.hoTen)
            .input("ngaySinh", sql.Date, data.ngaySinh)
            .input("gioiTinh", sql.NVarChar, data.gioiTinh)
            .input("sdt", sql.VarChar, data.sdt || null)
            .input("email", sql.VarChar, data.email || null)
            .input("noiSinh", sql.NVarChar, data.noiSinh)

            .input("danToc", sql.NVarChar, data.danToc)
            .input("tonGiao", sql.NVarChar, data.tonGiao)
            .input("quocTich", sql.NVarChar, data.quocTich)
            .input("nguyenQuan", sql.NVarChar, data.nguyenQuan)

            .input("hocVan", sql.NVarChar, data.hocVan || null)
            .input("ngheNghiep", sql.NVarChar, data.ngheNghiep || null)
            .input("noiLamViec", sql.NVarChar, data.noiLamViec || null)

            .input("noiOHienTai", sql.NVarChar, data.noiOHienTai)
            .input("quanHeChuHo", sql.NVarChar, data.quanHeChuHo)

            // ====== CCCD ======
            .input("cccd", sql.VarChar, data.cccd === 'Mới sinh' ? null : data.cccd)
            .input("cccdNgayCap", sql.Date, data.cccdNgayCap || null)
            .input("cccdNoiCap", sql.NVarChar, data.cccdNoiCap || null)

            // ====== HỘ KHẨU ======
            .input("idHoKhau", sql.Int, data.idHoKhau)

            .query(`
                DECLARE @IDNHANKHAU INT;

                IF @cccd IS NOT NULL AND EXISTS (
                    SELECT 1 FROM CANCUOCCONGDAN WHERE SOCCCD = @cccd
                )
                    THROW 50001, N'Số CCCD này đã tồn tại', 1;

                IF @cccd IS NOT NULL
                BEGIN
                    INSERT INTO CANCUOCCONGDAN (
                        SOCCCD,
                        NGAYCAP,
                        NOICAP
                    )
                    VALUES (
                        @cccd,
                        @cccdNgayCap,
                        @cccdNoiCap
                    );
                END
                DECLARE @diaChiTT NVARCHAR(255) = (SELECT DIACHI FROM HOKHAU WHERE ID = @idHoKhau);
                INSERT INTO NHANKHAU ( HOTEN, NGAYSINH, GIOITINH, SODIENTHOAI, EMAIL, NOISINH, DANTOC, TONGIAO, QUOCTICH, NGUYENQUAN, TRINHDOHOCVAN, NGHENGHIEP, NOILAMVIEC, DIACHIHIENNAY, SOCCCD )
                VALUES ( @hoTen, @ngaySinh, @gioiTinh, @sdt, @email, @noiSinh, @danToc, @tonGiao, @quocTich, @nguyenQuan, @hocVan, @ngheNghiep, @noiLamViec, @diaChiTT, @cccd );

                SET @IDNHANKHAU = SCOPE_IDENTITY();

                INSERT INTO THANHVIENCUAHO ( IDHOKHAU, IDNHANKHAU, QUANHEVOICHUHO, DIACHITRUOCKHICHUYENDEN)
                VALUES ( @idHoKhau, @IDNHANKHAU, @quanHeChuHo, @noiOHienTai );
                `)



        await transaction.commit();
        res.json({ success: true, message: "Thêm nhân khẩu mới thành công!" });

    }
    catch (err) {
        console.error("lỗi khi thêm nhân khẩu ", err)
        if (transaction) await transaction.rollback();
        res.status(500).json({ success: false, error: err.message, message: "Thêm nhân khẩu mới không thành công!" });

    }

});
app.delete('/api/households/:id', async (req, res) => {
    const idInt = parseInt(req.params.id);
    try {
        const pool = await connectDB();
        await pool.request()
            .input('id', sql.Int, idInt).query(`
                UPDATE NHANKHAU
                SET GHICHU = N'Đã chuyển đi'
                WHERE ID IN (SELECT IDNHANKHAU FROM THANHVIENCUAHO WHERE IDHOKHAU = @id)

                DELETE FROM THANHVIENCUAHO WHERE IDHOKHAU = @id;
                DELETE FROM HOKHAU WHERE ID = @id;
            `);
        res.json({ success: true });
    } catch (err) {

        console.error("Lỗi API xoá hộ khẩu: ", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, message: "Xoá hộ khẩu không thành công!" });
    }
});

app.delete('/api/residents/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();
        const reqT = new sql.Request(transaction);

        await reqT
            .input('id', sql.Int, id)
            .query(`
                -- 1. Kiểm tra có phải chủ hộ không
                IF EXISTS (
                    SELECT 1
                    FROM HOKHAU
                    WHERE IDCHUHO = @id
                )
                BEGIN
                    THROW 50002, N'Không thể xoá: Nhân khẩu là chủ hộ', 1;
                END

                -- 2. Xoá đăng ký thường trú (liên kết hộ)
                DELETE FROM THANHVIENCUAHO
                WHERE IDNHANKHAU = @id;
            `);

        await transaction.commit();

        res.json({
            success: true,
            message: "Đã xoá đăng ký thường trú của nhân khẩu"
        });

    } catch (err) {
        await transaction.rollback();
        //console.error("Lỗi API xoá đăng ký thường trú:", err);
        res.status(500).json({
            success: false,
            error: err.message,
            message: err.message
        });
    }
});

// 6. THÊM / CẬP NHẬT NHÂN KHẨU (API Mới cho chức năng sửa/thêm thành viên)
app.post('/api/residents', async (req, res) => {
    const data = req.body;
    // Xử lý logic Thêm hoặc Sửa tại đây (Tùy vào data.id có null không)
    // Code demo đơn giản:
    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();
        const pool = new sql.Request(transaction);
        //const pool = await connectDB();
        // Nếu là thêm mới 
        if (!data.id) {//nếu id == null -> chưa có -> thêm
            const result = await pool
                //.input('hk', sql.Int, data.hk)//hộ khẩu
                .input('hoten', sql.NVarChar, data.ten)
                .input('ngaysinh', sql.Date, data.ngaySinh)
                .input('gioitinh', sql.NVarChar, data.gioiTinh)
                .input('sdt', sql.NVarChar, data.sdt)
                .input('email', sql.NVarChar, data.email)
                .input('noisinh', sql.NVarChar, data.noiSinh)
                .input('cccd', sql.NVarChar, data.cccd)
                .input('cccd_nc', sql.Date, data.cccdNgayCap)
                .input('cccd_noicap', sql.NVarChar, data.cccdNoiCap)
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
                    INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP) VALUES
                        (@cccd, @cccd_nc, @cccd_noicap);

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

                    DECLARE @idNhanKhau INT;
                    SET @idNhanKhau = SCOPE_IDENTITY();

                    IF (@hk IS NOT NULL)
                    BEGIN
                        INSERT INTO THANHVIENCUAHO (IDNHANKHAU, IDHOKHAU, QUANHEVOICHUHO, DIACHITRUOCKHICHUYENDEN)
                        VALUES
                            (@idNhanKhau, @hk, )
                    END
                    
                    COMMIT TRANSACTION;
                    `);



        } else {
            //đã có id -> TH sửa thông tin
            await pool
                .input('id', sql.Int, data.id)
                .input('hoten', sql.NVarChar, data.ten)
                .input('ngaysinh', sql.Date, data.ngaySinh)
                .input('gioitinh', sql.NVarChar, data.gioiTinh)
                .input('sdt', sql.NVarChar, data.sdt)
                .input('email', sql.NVarChar, data.email)
                .input('noisinh', sql.NVarChar, data.noiSinh)
                .input('cccd', sql.NVarChar, data.cccd)
                .input('cccd_nc', sql.Date, data.cccdNgayCap)
                .input('cccd_noicap', sql.NVarChar, data.cccdNoiCap)
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
                    SELECT 
                        @oldCCCD = SOCCCD 
                    FROM NHANKHAU 
                    WHERE 
                        ID = @id;
                    
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
        await transaction.commit();
        res.json({ success: true, message: data.id ? "Đã sửa thông tin nhân khẩu" : "Thêm mới nhân khẩu thành công" });
    } catch (err) {

        console.error("Lỗi API post resident:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, message: data.id ? "Lỗi khi sửa thông tin nhân khẩu" : "Lỗi khi thêm mới nhân khẩu" });
    }
});
app.post('/api/death', async (req, res) => {
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();
        const pool = new sql.Request(transaction);
        await pool
            .input('id', sql.Int, data.id)
            .input('ngayMat', sql.Date, data.ngayQuaDoi)
            .input('noiMat', sql.NVarChar, data.noiQuaDoi)
            .input('lyDo', sql.NVarChar, data.lyDo)
            .query(`
                DELETE FROM TAMVANG WHERE IDNHANKHAU = @id;

                UPDATE NHANKHAU
                SET 
                    GHICHU = N'' 
                WHERE 
                    ID = @id;

                UPDATE NHANKHAU
                SET DIACHIHIENNAY = NOITHUONGTRU 
                WHERE ID = @id

                INSERT INTO KHAITU (IDNGUOIMAT, NGAYMAT, NOIMAT, LYDOMAT)
                VALUES (@id, @ngayMat, @noiMat, @lyDo)
                UPDATE NHANKHAU
                SET GHICHU = N'Đã qua đời'
                WHERE ID = @id
                `)
        await transaction.commit();
        res.json({
            success: true,
            message: "Khai tử thành công"
        })
    }
    catch (e) {
        console.error("Lỗi API post death:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, message: "Lỗi khi cập nhật thông tin khai tử!" });
    }
});

app.get('/api/death/:id', async (req, res) => {
    const id = req.params.id;


    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    FORMAT(NGAYMAT, 'yyyy-MM-dd') as ngayMat,
                    LYDOMAT as lyDo,
                    NOIMAT as noiMat
                FROM KHAITU
                WHERE IDNGUOIMAT = @id
                `)

        res.json({
            success: true,
            ...result.recordset[0]
            //message: "Khai tử thành công"
        })
    }
    catch (e) {
        console.error("Lỗi API get death:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, message: "Lỗi khi Lấy thông tin khai tử từ server" });
    }
});
// 7. TẠM TRÚ & TẠM VẮNG (Giữ nguyên logic cũ)
app.get('/api/temp-residents', async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                tt.ID as ttID, 
                tt.IDNHANKHAU as nkID,
                'TT' + RIGHT('000' + CAST(tt.IDNHANKHAU AS VARCHAR(10)), 3) as id,
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
                DATEDIFF(day, tt.TUNGAY, tt.DENNGAY) as thoiHanNgay,
                tt.LYDO AS lyDo
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
                tv.ID as tvID, 
                tv.IDNHANKHAU as nkID,
                'TV' + RIGHT('000' + CAST(tv.IDNHANKHAU AS VARCHAR(10)), 3) as id, 
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
                nk.NOITHUONGTRU as diaChiThuongTru,
                tv.NOITAMTRU as noiChuyenDen, 
                nk.NGUYENQUAN as queQuan,
                FORMAT(tv.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                FORMAT(tv.DENNGAY, 'yyyy-MM-dd') as denNgay,
                DATEDIFF(day, tv.TUNGAY, tv.DENNGAY) as thoiHanNgay,
                tv.LYDO AS lyDo
            FROM TAMVANG as tv 
            JOIN NHANKHAU nk ON tv.IDNHANKHAU = nk.ID
            LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
        `);
        const data = result.recordset.map(item => ({
            ...item,
            thoiHanTamVang: item.thoiHanNgay ? Math.floor(item.thoiHanNgay / 30) + " tháng" : "N/A"
        }));
        res.json(data);
    } catch (err) {

        console.error("Lỗi API get Tạm vắng:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/temp-residents', async (req, res) => {
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();
        const reqT = new sql.Request(transaction);
        const id = data.id;
        const isEdit = data.isEdit;

        const cccdCheck = await new sql.Request(transaction)
            .input('cccd', sql.VarChar, data.cccd)
            .query(`SELECT SOCCCD FROM CANCUOCCONGDAN WHERE SOCCCD = @cccd`);
        if (!isEdit) {
            //TH thêm tạm trú
            const checkReq = new sql.Request(transaction);
            const duplicateUser = await checkReq
                .input('checkCccd', sql.VarChar, data.cccd)
                .query(`
                    SELECT 1 
                    FROM NHANKHAU
                    WHERE SOCCCD = @checkCccd 
                    `)
            if (duplicateUser.recordset.length > 0) {//trùng
                // => không thể sửa cccd của A trùng với B
                // //bị trùng cccd nên không thêm được tạm trú
                throw new Error(`Số CCCD ${data.cccd} đã thuộc về người khác. Vui lòng kiểm tra lại thông tin`);
            }
            //không trùng thì thêm 
            const nkRes = await reqT
                .input('Ten', sql.NVarChar, data.ten)
                .input('Ns', sql.Date, data.ngaySinh)
                .input('Gt', sql.NVarChar, data.gioiTinh)
                .input('Sdt', sql.VarChar, data.sdt || null)
                .input('Email', sql.VarChar, data.email || null)
                .input('Noisinh', sql.NVarChar, data.noiSinh || null)
                //cccd mới === cũ nên không cần sửa cccd
                .input('cccd', sql.VarChar, data.cccd || null) // Update số CCCD mới vào đây
                .input('ngayCap', sql.Date, data.cccdNgayCap || null)
                .input('noiCap', sql.NVarChar, data.cccdNoiCap || null)
                .input('Que', sql.NVarChar, data.queQuan || null)
                .input('Dantoc', sql.NVarChar, data.danToc || null)
                .input('Tongiao', sql.NVarChar, data.tonGiao || null)
                .input('Quoctich', sql.NVarChar, data.quocTich || null)
                .input('Hocvan', sql.NVarChar, data.trinhDoHocVan || null)
                .input('Nghe', sql.NVarChar, data.nghe || null)
                .input('Noilamviec', sql.NVarChar, data.noiLamViec || null)
                .input('DCTT', sql.NVarChar, data.diaChiThuongTru || null)
                .input('NoiTT', sql.NVarChar, data.noiTamTru || null)
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 FROM CANCUOCCONGDAN WHERE SOCCCD = @cccd
                        )
                    BEGIN
                        INSERT INTO CANCUOCCONGDAN 
                            (SOCCCD, NGAYCAP, NOICAP) 
                        VALUES 
                            (@cccd, @ngayCap, @noiCap)
                    END

                    INSERT INTO NHANKHAU (
                        HOTEN, NGAYSINH, GIOITINH, SOCCCD, SODIENTHOAI, EMAIL, NOISINH, NGUYENQUAN, DANTOC, TONGIAO, QUOCTICH, TRINHDOHOCVAN, NGHENGHIEP, NOILAMVIEC, NOITHUONGTRU, DIACHIHIENNAY
                    )
                    OUTPUT INSERTED.ID
                    VALUES 
                        ( @Ten, @Ns, @Gt, @cccd, @Sdt, @Email, @Noisinh, @Que, @Dantoc, @Tongiao, @Quoctich, @Hocvan, @Nghe, @Noilamviec, @DCTT, @NoiTT );

                    `);
            await reqT
                .input('id', sql.Int, nkRes.recordset[0].ID)
                //.input('NoiTT', sql.NVarChar, data.noiTamTru || null)
                .input('ngayDK', sql.Date, data.ngayDangKy)
                .input('denNgay', sql.Date, data.denNgay)
                .input('lyDo', sql.NVarChar, data.lyDo || '')
                .query(`
                        INSERT INTO TAMTRU (
                            IDNHANKHAU, TUNGAY, DENNGAY, LYDO, NOIOHIENTAI
                        )
                        VALUES (
                            @id, @ngayDK, @denNgay, @lyDo, @NoiTT
                        );
                        `)

        }
        else {//TH sửa tạm trú
            const cccdOld = await new sql.Request(transaction)
                .input('id', sql.Int, data.id)
                .query(`SELECT SOCCCD FROM NHANKHAU WHERE ID = @id`);
            // lưu lại cccd hiện tại của người đó
            const CCCDOLD = cccdOld.recordset[0].SOCCCD;


            if (CCCDOLD !== data.cccd) {//nếu cccd mới != cccd cũ -> sửa cccd  => phải kiểm tra xem liệu có bị trùng với cccd của ai không

                //kiểm tra xem số CCCD mới có trùng với ai khác không
                const checkReq = new sql.Request(transaction);
                const duplicateUser = await checkReq
                    .input('checkCccd', sql.VarChar, data.cccd)
                    .input('id', sql.Int, data.id)
                    .query(`
                        SELECT ID 
                        FROM NHANKHAU
                        WHERE SOCCCD = @checkCccd AND ID <> @id
                        `)
                if (duplicateUser.recordset.length > 0) {//trùng
                    // => không thể sửa cccd của A trùng với B
                    throw new Error(`Số CCCD ${data.cccd} đã thuộc về người khác. Không thể gán trùng!. vui lòng kiểm tra lại thông tin`);
                }

                //nếu không trùng tức là đổi số cccd -> thêm cccd mới -> sửa thành cccd mới cho A và xoá cccd cũ đi
                await new sql.Request(transaction)
                    // .input('cccd', sql.VarChar, data.cccd)
                    .input('Id', sql.Int, data.id)
                    .input('Ten', sql.NVarChar, data.ten)
                    .input('Ns', sql.Date, data.ngaySinh)
                    .input('Gt', sql.NVarChar, data.gioiTinh)
                    .input('Sdt', sql.VarChar, data.sdt || null)
                    .input('Email', sql.VarChar, data.email || null)
                    .input('Noisinh', sql.NVarChar, data.noiSinh || null)
                    //cccd mới === cũ nên không cần sửa cccd
                    .input('cccd', sql.VarChar, data.cccd || null) // Update số CCCD mới vào đây
                    .input('ngayCap', sql.Date, data.cccdNgayCap || null)
                    .input('noiCap', sql.NVarChar, data.cccdNoiCap || null)
                    .input('Que', sql.NVarChar, data.queQuan || null)
                    .input('Dantoc', sql.NVarChar, data.danToc || null)
                    .input('Tongiao', sql.NVarChar, data.tonGiao || null)
                    .input('Quoctich', sql.NVarChar, data.quocTich || null)
                    .input('Hocvan', sql.NVarChar, data.trinhDoHocVan || null)
                    .input('Nghe', sql.NVarChar, data.nghe || null)
                    .input('Noilamviec', sql.NVarChar, data.noiLamViec || null)
                    .input('DCTT', sql.NVarChar, data.diaChiThuongTru || null)
                    .input('NoiTT', sql.NVarChar, data.noiTamTru || null)
                    .input('ngayDK', sql.Date, data.ngayDangKy)
                    .input('denNgay', sql.Date, data.denNgay)
                    .input('lyDo', sql.NVarChar, data.lyDo || '')
                    .input('cccdCu', sql.VarChar, CCCDOLD)
                    .query(`
                        

                        INSERT INTO CANCUOCCONGDAN (SOCCCD, NGAYCAP, NOICAP) VALUES (@cccd, @ngayCap, @noiCap)

                        UPDATE NHANKHAU
                        SET
                            HOTEN=@Ten, 
                            NGAYSINH=@Ns, 
                            GIOITINH=@Gt, 
                            SODIENTHOAI=@Sdt, 
                            EMAIL=@Email, 
                            SOCANCUOCCONGDAN = @cccd,
                            NOISINH=@Noisinh, 
                            NGUYENQUAN=@Que, 
                            DANTOC=@Dantoc, 
                            TONGIAO=@Tongiao, 
                            QUOCTICH=@Quoctich, 
                            TRINHDOHOCVAN=@Hocvan, 
                            NGHENGHIEP=@Nghe, 
                            NOILAMVIEC=@Noilamviec, 
                            NOITHUONGTRU=@DCTT,
                            DIACHIHIENNAY=@NoiTT
                        WHERE ID=@Id
                        
                        UPDATE TAMTRU
                        SET
                            TUNGAY = @ngayDK,
                            DENNGAY = @denNgay,
                            LYDO = @lyDo,
                            NOIOHIENTAI = @NoiTT
                        WHERE IDNHANKHAU = @Id

                        DELETE FROM CANCUOCCONGDAN
                        WHERE SOCCCD = @CCCDOLD AND NOT EXISTS ( SELECT 1 FROM NHANKHAU WHERE SOCCCD = @CCCDOLD )

                        `);

            }
            else {//CCCD mới === cũ  -> chỉ sửa thông tin về cccd
                //
                await new sql.Request(transaction)
                    // .input('cccd', sql.VarChar, data.cccd)
                    .input('Id', sql.Int, data.id)
                    .input('Ten', sql.NVarChar, data.ten)
                    .input('Ns', sql.Date, data.ngaySinh)
                    .input('Gt', sql.NVarChar, data.gioiTinh)
                    .input('Sdt', sql.VarChar, data.sdt || null)
                    .input('Email', sql.VarChar, data.email || null)
                    .input('Noisinh', sql.NVarChar, data.noiSinh || null)
                    //cccd mới === cũ nên không cần sửa cccd
                    //.input('uCccd', sql.VarChar, data.cccd || null) // Update số CCCD mới vào đây
                    .input('cccd', sql.VarChar, data.cccd || null)
                    .input('ngayCap', sql.Date, data.cccdNgayCap || null)
                    .input('noiCap', sql.NVarChar, data.cccdNoiCap || null)
                    .input('Que', sql.NVarChar, data.queQuan || null)
                    .input('Dantoc', sql.NVarChar, data.danToc || null)
                    .input('Tongiao', sql.NVarChar, data.tonGiao || null)
                    .input('Quoctich', sql.NVarChar, data.quocTich || null)
                    .input('Hocvan', sql.NVarChar, data.trinhDoHocVan || null)
                    .input('Nghe', sql.NVarChar, data.nghe || null)
                    .input('Noilamviec', sql.NVarChar, data.noiLamViec || null)
                    .input('DCTT', sql.NVarChar, data.diaChiThuongTru || null)
                    .input('NoiTT', sql.NVarChar, data.noiTamTru || null)
                    .input('ngayDK', sql.Date, data.ngayDangKy)
                    .input('denNgay', sql.Date, data.denNgay)
                    .input('lyDo', sql.NVarChar, data.lyDo || '')
                    .query(`
                        
                        UPDATE CANCUOCCONGDAN 
                        SET 
                            NGAYCAP=@ngayCap, 
                            NOICAP=@noiCap 
                        WHERE SOCCCD=@cccd
                        

                        UPDATE NHANKHAU
                        SET
                            HOTEN=@Ten, 
                            NGAYSINH=@Ns, 
                            GIOITINH=@Gt, 
                            SODIENTHOAI=@Sdt, 
                            EMAIL=@Email, 
                            NOISINH=@Noisinh, 
                            NGUYENQUAN=@Que, 
                            DANTOC=@Dantoc, 
                            TONGIAO=@Tongiao, 
                            QUOCTICH=@Quoctich, 
                            TRINHDOHOCVAN=@Hocvan, 
                            NGHENGHIEP=@Nghe, 
                            NOILAMVIEC=@Noilamviec, 
                            NOITHUONGTRU=@DCTT,
                            DIACHIHIENNAY=@NoiTT
                        WHERE ID=@Id
                        
                        UPDATE TAMTRU
                        SET
                            TUNGAY = @ngayDK,
                            DENNGAY = @denNgay,
                            LYDO = @lyDo,
                            NOIOHIENTAI = @NoiTT
                        WHERE IDNHANKHAU = @Id
                        
                        `);
            }
        }
        await transaction.commit();
        res.json({ success: true, message: isEdit ? "Sửa thông tin người tạm trú thành công!" : "Thêm tạm trú thành công" });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi API Tạm trú:", err);
        // Trả về lỗi rõ ràng để Frontend hiển thị alert
        res.status(500).json({ success: false, message: "Thông tin chưa lưu thành công" });
    }
});

// 9. THÊM / CẬP NHẬT TẠM VẮNG
// Logic: Tạm vắng là người có hộ khẩu đi nơi khác -> Đã có Nhân khẩu
app.post('/api/absent-residents', async (req, res) => {
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());
    try {
        await transaction.begin();
        const pool = new sql.Request(transaction);
        //const pool = await connectDB();
        // Lấy ID nhân khẩu thực từ frontend
        let nkId = null;
        if (data.isEdit) {
            //nkId = parseInt(data.id.replace('TV', ''));
            await pool
                .input('id', sql.Int, data.id)
                .input('ngayDK', sql.Date, data.ngayDangKy)
                .input('denNgay', sql.Date, data.denNgay)
                .input('noiChuyenDen', sql.NVarChar, data.noiChuyenDen)
                .input('lyDo', sql.NVarChar, data.lyDo)
                .query(`
                    UPDATE TAMVANG
                    SET
                        TUNGAY = @ngayDK,
                        DENNGAY = @denNgay,
                        NOITAMTRU = @noiChuyenDen,
                        LYDO = @lyDo
                    WHERE
                        IDNHANKHAU = @id;

                    UPDATE NHANKHAU
                    SET 
                        GHICHU = N'Tạm vắng',
                        DIACHIHIENNAY = @noiChuyenDen
                    WHERE 
                        ID = @id;
                    `)

            res.json({ success: true, message: "Đã sửa thông tin tạm vắng" });
        }
        else {
            await pool
                .input('id', sql.Int, data.id)
                .input('ngayDK', sql.Date, data.ngayDangKy)
                .input('denNgay', sql.Date, data.denNgay)
                .input('noiChuyenDen', sql.NVarChar, data.noiChuyenDen)
                .input('lyDo', sql.NVarChar, data.lyDo)
                .query(`
                    

                    INSERT INTO TAMVANG (IDNHANKHAU, NOITAMTRU, TUNGAY, DENNGAY, LYDO)
                    VALUES
                        (@id, @noiChuyenDen, @ngayDK, @denNgay, @lyDo);
                    UPDATE NHANKHAU
                    SET 
                        GHICHU = N'Tạm vắng',
                        DIACHIHIENNAY = @noiChuyenDen
                    WHERE 
                        ID = @id;
                    
                    
                    `)

            res.json({ success: true, message: data.isEdit ? "Đã sửa thông tin tạm vắng!" : "Đã thêm tạm vắng!" });
        }

        await transaction.commit();
        //if (!nkId) return res.status(400).json({ success: false, message: "lỗi không thấy nhân khẩu" });

        //return res.json({ success: true });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi API Tạm vắng:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ success: false, message: isEdit ? "Lỗi khi lưu thông tin tạm vắng" : "Lỗi khi thêm thông tin tạm vắng" });
    }
});

app.put('/api/temp-residents/:id', async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    try {
        const pool = await connectDB();

        // Xóa trong bảng TAMTRU (Không xóa nhân khẩu để lưu hồ sơ)
        await pool.request()
            .input('id', sql.Int, id)
            .input('ngayDK', sql.Date, data.ngayDangKy)
            .input('denNgay', sql.Date, data.denNgay)
            .input('noiTT', sql.NVarChar, data.noiTamTru)
            .input('lyDo', sql.NVarChar, data.lyDo)
            .query(`
                    UPDATE TAMTRU
                    SET
                        TUNGAY = @ngayDK,
                        DENNGAY = @denNgay,
                        LYDO = @lyDo,
                        NOIOHIENTAI = @noiTT
                    WHERE IDNHANKHAU = @id
                    UPDATE NHANKHAU
                    SET DIACHIHIENNAY = @noiTT
                    WHERE ID = @id
                    `);
        res.json({ success: true, message: "Đã thay đổi thông tin tạm trú" });
    } catch (err) {

        console.error("Lỗi API xoá Tạm trú:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ success: false, message: "Thay đổi thông tin tạm trú không thành công" });
    }
});
app.delete('/api/temp-residents/:id', async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    try {
        const pool = await connectDB();

        // Xóa trong bảng TAMTRU (Không xóa nhân khẩu để lưu hồ sơ)
        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                    DELETE FROM TAMTRU WHERE IDNHANKHAU = @id;
                    DELETE FROM NHANKHAU WHERE ID = @id
                    `);
        res.json({ success: true, message: "Đã xoá thông tin tạm trú" });
    } catch (err) {

        console.error("Lỗi API xoá Tạm trú:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ success: false, message: "Xoá thông tin tạm trú không thành công" });
    }
});

app.delete('/api/absent-residents/:id', async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    try {
        const pool = await connectDB();

        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM TAMVANG WHERE IDNHANKHAU = @id;

                UPDATE NHANKHAU
                SET 
                    GHICHU = N'' 
                WHERE 
                    ID = @id;

                UPDATE NHANKHAU
                SET DIACHIHIENNAY = NOITHUONGTRU 
                WHERE ID = @id
                `);
        //console.log("Đã xoá tạm vắng thành công ");
        res.json({ success: true, message: "Đã xoá thông tin tạm vắng" });
    } catch (err) {

        console.error("Lỗi API xoá Tạm vắng:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ success: false, message: "Xoá thông tin tạm vắng không thành công" });
    }
});


app.get("/api/rewards", async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool
            .request()
            .query(`
                            SELECT 
                                d.ID as id,
                                d.TEN_DOT AS ten,
                                d.LOAI AS loai,
                                t.DON_GIA as donGia,
                                FORMAT(d.NGAYTAO, 'yyyy-MM-dd') AS ngayTao ,
                                ISNULL(SUM(t.TONG_TIEN), 0) AS tongGT,
                                d.GHI_CHU as ghiChu
                            FROM DOTTHUONG d
                            LEFT JOIN (
                                SELECT ID_DOT, TONG_TIEN, DON_GIA FROM THUONGLE
                                UNION ALL
                                SELECT ID_DOT, TONG_TIEN, DON_GIA FROM THUONGHOCTAP
                            ) t ON d.ID = t.ID_DOT
                            GROUP BY d.ID, d.TEN_DOT, d.LOAI, t.DON_GIA, d.NGAYTAO, d.GHI_CHU
                            ORDER BY d.NGAYTAO DESC
                            `
            );
        const data = result.recordset
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// app.post("/api/rewards", async (req, res) => {
//   const { tenDot, loai, ngayTao, ghiChu } = req.body;

//   if (!tenDot || !loai) {
//     return res.json({ success: false, message: "Thiếu dữ liệu" });
//   }

//   try {
//     const pool = await connectDB();

//     const result = await pool.request()
//       .input("ten", sql.NVarChar, tenDot)
//       .input("loai", sql.NVarChar, loai)
//       .input("ngayTao", sql.NVarChar, ngayTao)
//       .input("ghichu", sql.NVarChar, ghiChu || null)
//       .query(`
//         INSERT INTO DOTTHUONG (TEN_DOT, LOAI, NGAYTAO, GHI_CHU)
//         OUTPUT INSERTED.ID
//         VALUES (@ten, @loai,@ngayTao, @ghichu)
//       `);

//     res.json({ id: result.recordset[0].ID, success: true , message: "Tạo đợt thưởng mới thành công"});
//   } catch (err) {
//     console.error(err);
//     res.json({ success: false });
//   }
// });
app.put("/api/rewards", async (req, res) => {
    const data = req.body;

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("id", sql.Int, data.id)
            .input("ten", sql.NVarChar, data.ten)
            .input("donGia", sql.Int, data.donGia)
            .query(`
            UPDATE DOTTHUONG
            SET
                TEN_DOT = @ten
            WHERE ID = @id

            UPDATE THUONGLE
            SET 
                DON_GIA =@donGia
            WHERE ID_DOT = @id

            UPDATE THUONGHOCTAP
            SET 
                DON_GIA =@donGia
            WHERE ID_DOT = @id

        `);

        res.json({ success: true, message: "Thay đổi thông tin thành công" });
    }
    catch (e) {
        res.json({ success: false });
    }
});
app.post("/api/rewards", async (req, res) => {
    //const { tenDot, loai, ngayTao, ghiChu } = req.body;
    const data = req.body;
    const transaction = new sql.Transaction(await connectDB());
    if (!data.tenDot || !data.loai) {

        return res.json({ success: false, message: "Thiếu dữ liệu" });
    }
    if (data.loai == "LE" && !data.donGia) return res.json({ success: false, message: "Thiếu dữ liệu" });

    try {
        //const pool = await connectDB();
        await transaction.begin();
        const reqT = new sql.Request(transaction);
        const result = await reqT
            .input("ten", sql.NVarChar, data.tenDot)
            .input("loai", sql.NVarChar, data.loai)
            .input("ngayTao", sql.NVarChar, data.ngayTao)
            .input("ghichu", sql.NVarChar, data.ghiChu || null)
            .query(`
        INSERT INTO DOTTHUONG (TEN_DOT, LOAI, NGAYTAO, GHI_CHU)
        OUTPUT INSERTED.ID
        VALUES (@ten, @loai,@ngayTao, @ghichu)
      `);
        if (data.loai == "LE") {
            await reqT
                .input("idDot", sql.Int, result.recordset[0].ID)
                .input("donGia", sql.Int, data.donGia)
                .query(`
            INSERT INTO THUONGLE (ID_DOT, ID_HOKHAU, SO_PHAN_QUA, DON_GIA)

            SELECT 
                @idDot AS idDot,
                HK.IDHOKHAU,
                COUNT(*) AS soPhanQua,
                @donGia
            FROM NHANKHAU NK
            JOIN THANHVIENCUAHO AS HK ON NK.ID = HK.IDNHANKHAU
            WHERE DATEDIFF(YEAR, NK.NGAYSINH, GETDATE()) <= 18
            GROUP BY HK.IDHOKHAU
            
        `);
        }
        else {
            await reqT
                .input("idDot", sql.Int, result.recordset[0].ID)
                .query(`
            INSERT INTO THUONGHOCTAP (ID_DOT, ID_HOCSINH)
            SELECT 
                @idDot,
                hs.ID
            FROM HOCSINH hs
            `)
        }
        await transaction.commit();
        res.json({ success: true, message: "Tạo đợt thưởng mới thành công" });
    } catch (err) {
        console.error(err);
        if (transaction) await transaction.rollback();
        res.json({ success: false });
    }
});

app.post("/api/rewards/:id/generate-le", async (req, res) => {
    const idDot = req.params.id;
    const DON_GIA = 50000; // có thể chỉnh

    try {
        const pool = await connectDB();

        // Xóa nếu đã sinh trước đó (tránh trùng)
        await pool.request()
            .input("idDot", sql.Int, idDot)
            .query(`DELETE FROM THUONGLE WHERE ID_DOT = @idDot`);

        // Sinh mới theo hộ
        await pool.request()
            .input("idDot", sql.Int, idDot)
            .input("donGia", sql.Int, DON_GIA)
            .query(`
        INSERT INTO THUONGLE (ID_DOT, ID_HOKHAU, SO_PHAN_QUA, DON_GIA)

        SELECT 
            @idDot AS idDot,
            HK.IDHOKHAU,
            COUNT(*) AS soPhanQua,
            @donGia
        FROM NHANKHAU NK
        JOIN THANHVIENCUAHO AS HK ON NK.ID = HK.IDNHANKHAU
        WHERE DATEDIFF(YEAR, NK.NGAYSINH, GETDATE()) <= 18
        GROUP BY HK.IDHOKHAU
        
      `);

        res.json({ success: true, message: "Đã tạo danh sách thưởng lễ" });
    } catch (err) {
        console.error("Lỗi khi tạo data cho thưởng lễ", err);
        res.json({ success: false });
    }
});

app.get("/api/rewards/:id/students", async (req, res) => {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
      SELECT 
        hs.ID AS id,
        n.HOTEN as ten, 
        hs.TRUONG as truong,
      FROM HOCSINH hs
      JOIN NHANKHAU n ON hs.IDNHANKHAU = n.ID
      WHERE DATEDIFF(YEAR, n.NGAYSINH, GETDATE()) <= 18
      ORDER BY n.HOTEN
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});


app.get("/api/rewards/:id/students", async (req, res) => {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
      SELECT 
        hs.ID AS idHS,
        n.HOTEN AS ten,
        hs.TRUONGHOC AS truongHoc,
      FROM HOCSINH hs
      JOIN NHANKHAU n ON hs.ID_NHANKHAU = n.ID
      --WHERE DATEDIFF(YEAR, n.NGAYSINH, GETDATE()) <= 18
      ORDER BY n.HOTEN
    `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.json([]);
    }
});

app.get("/api/rewards/:id/total-le", async (req, res) => {
    const idDot = req.params.id;

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("idDot", sql.Int, idDot)
            .query(`
        SELECT 
            ISNULL(SUM(TONG_TIEN), 0) AS tongTien,
            ISNULL(COUNT(DISTINCT ID_HOKHAU), 0) AS tongHo,
            ISNULL(SUM(SO_PHAN_QUA), 0) AS tongNg

        FROM THUONGLE
        WHERE ID_DOT = @idDot
      `);
        const total = result.recordset[0];
        res.json({
            success: true,
            tongTien: total.tongTien,
            tongHo: total.tongHo,
            tongNg: total.tongNg
        });
    } catch (err) {
        console.error("Lỗi khi tính tổng thưởng lễ", err);
        res.json({ success: false });
    }
});

app.get("/api/rewards/:id/total-hoctap", async (req, res) => {
    const idDot = req.params.id;

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("idDot", sql.Int, idDot)
            .query(`
        SELECT 
            ISNULL(SUM(TONG_TIEN), 0) AS tongTien,
            ISNULL(COUNT(DISTINCT ID_HOCSINH), 0) AS tongHS,
            ISNULL(SUM(SO_VO), 0) AS tongVo,
            ISNULL(SUM(CASE WHEN THANH_TICH = N'GIOI' THEN 1 ELSE 0 END), 0) AS soHS_Gioi,
            ISNULL(SUM(CASE WHEN THANH_TICH = N'KHA' THEN 1 ELSE 0 END), 0) AS soHS_Kha,
            ISNULL(SUM(CASE WHEN THANH_TICH = N'TB' THEN 1 ELSE 0 END), 0) AS soHS_TrungBinh

        FROM THUONGHOCTAP
        WHERE ID_DOT = @idDot
      `);
        const s = result.recordset[0];
        res.json({
            success: true,
            tongTien: s.tongTien,
            tongHS: s.tongHS,
            tongVo: s.tongVo,
            soHS_Gioi: s.soHS_Gioi,
            soHS_Kha: s.soHS_Kha,
            soHS_TrungBinh: s.soHS_TrungBinh
        });
    } catch (err) {
        console.error("Lỗi khi tính tổng thưởng học tập", err);
        res.json({ success: false, message: "Lỗi khi tính tổng thưởng học tập" });
    }
});

app.get("/api/rewards/:id/detail-le", async (req, res) => {
    const idDot = req.params.id;

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("idDot", sql.Int, idDot)
            .query(`
        SELECT 
            NK.HOTEN AS ten,
            TL.SO_PHAN_QUA AS soPhanQua,
            TL.TONG_TIEN AS tien

        FROM THUONGLE TL
        JOIN HOKHAU HK ON TL.ID_HOKHAU = HK.ID
        JOIN NHANKHAU NK ON NK.ID = HK.IDCHUHO
        WHERE TL.ID_DOT = @idDot
      `);
        const details = result.recordset;

        res.json(details);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách thưởng lễ", err);
        res.json({ success: false, message: "Lỗi khi lấy danh sách thưởng lễ" });
    }
});

app.get("/api/rewards/:id/detail-hoctap", async (req, res) => {
    const idDot = req.params.id;

    try {
        const pool = await connectDB();

        const result = await pool.request()
            .input("idDot", sql.Int, idDot)
            .query(`
        SELECT 
            HS.ID as id,
            NK.HOTEN AS ten,
            HS.TRUONGHOC AS truong,
            HS.LOP AS lop,
            THT.THANH_TICH as tt,
            THT.SO_VO as soVo

        FROM THUONGHOCTAP THT
        JOIN HOCSINH HS ON THT.ID_HOCSINH = HS.ID
        JOIN NHANKHAU NK ON NK.ID = HS.IDNHANKHAU
        WHERE THT.ID_DOT = @idDot
        order by 
            CAST(
                LEFT(HS.LOP, PATINDEX('%[^0-9]%', HS.LOP + 'X') - 1)
                AS INT
            ) ASC,
            HS.LOP ASC
      `);
        const details = result.recordset;

        res.json(details);
    } catch (err) {
        console.error("Lỗi khi lấy danh sách thưởng học tập", err);
        res.json({ success: false, message: "Lỗi khi lấy danh sách thưởng học tập" });
    }
});

app.delete('/api/reward/:id', async (req, res) => {
    const data = req.body;
    const id = req.params.id;
    try {
        const pool = await connectDB();

        // Xóa trong bảng TAMTRU (Không xóa nhân khẩu để lưu hồ sơ)
        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                    DELETE FROM THUONGLE WHERE ID_DOT = @id
                    DELETE FROM THUONGHOCTAP WHERE ID_DOT = @id
                    
                    DELETE FROM DOTTHUONG WHERE ID = @id

                    
                    `);
        res.json({ success: true, message: "Đã xoá đợt thưởng này" });
    } catch (err) {

        console.error("Lỗi API xoá Tạm trú:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ success: false, message: "Xoá đợt thưởng không thành công" });
    }
});

app.post('/api/rewards/:id/changeThanhTich', async (req, res) => {
    const data = req.body;
    const idDot = req.params.id;
    try {
        const pool = await connectDB();
        let soVo = 0; // Mặc định là TB hoặc khác
        if (data.value === "GIOI") {
            soVo = 10;
        } else if (data.value === "KHA") {
            soVo = 7;
        } else if (data.value === "TB") {
            soVo = 5;
        }
        // Xóa trong bảng TAMTRU (Không xóa nhân khẩu để lưu hồ sơ)
        await pool.request()
            .input('idDot', sql.Int, idDot)
            .input('idHS', sql.Int, data.id)
            .input('value', sql.NVarChar, data.value)
            .input('soVo', sql.Int, soVo)
            .query(`
                    UPDATE THUONGHOCTAP
                    SET
                        THANH_TICH = @value,
                        SO_VO = @soVo
                    WHERE ID_DOT = @idDot AND ID_HOCSINH = @idHS

                    `);
        res.json({ success: true, message: "Cập nhật thành công" });
        //console.log("Cập nhật thành công");
    } catch (err) {

        console.error("Lỗi API changeTT:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ success: false, message: "Thay đổi thành tích không thành công" });
    }
});
// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================= CITIZEN & REQUEST MANAGEMENT APIs =================

// Get citizen's personal information
app.get('/api/citizen/info', requireAuth, async (req, res) => {
    try {
        const cccd = req.session.user.cccd;
        const pool = await connectDB();

        // Get resident information
        const residentRes = await pool.request()
            .input('cccd', sql.VarChar, cccd)
            .query(`
                SELECT 
                    nk.ID as nkID,
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
                    nk.DIACHIHIENNAY as noiOHienTai,
                    nk.GHICHU as ghiChu,
                    nk.DIACHIHIENNAY as noiChuyenDen,
                    FORMAT(tv.TUNGAY, 'yyyy-MM-dd') as ngayDangKy,
                    FORMAT(tv.DENNGAY, 'yyyy-MM-dd') as denNgay,
                    DATEDIFF(day, tv.TUNGAY, tv.DENNGAY) as thoiHanNgay,
                    tv.LYDO AS lyDo
                FROM NHANKHAU nk
                LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
                LEFT JOIN TAMVANG tv ON tv.IDNHANKHAU = nk.ID
                WHERE nk.SOCCCD = @cccd
            `);

        if (residentRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin cá nhân' });
        }

        const resident = residentRes.recordset[0];
        resident.thoiHanTamVang = resident.thoiHanNgay ? Math.floor(resident.thoiHanNgay / 30) + " tháng" : "N/A";
        // Get household information
        const householdRes = await pool.request()
            .input('nkId', sql.Int, resident.nkID)
            .query(`
                SELECT 
                    hk.ID as realId,
                    'HK' + RIGHT('000' + CAST(hk.ID AS VARCHAR(10)), 3) as id,
                    hk.IDCHUHO as idCH,
                    hk.DIACHI as diaChiFull,
                    FORMAT(hk.NGAYLAP, 'yyyy-MM-dd') as ngayLapSo,
                    chuho.HOTEN as chuHo,
                    tv.QUANHEVOICHUHO as vaiTro
                FROM THANHVIENCUAHO tv
                JOIN HOKHAU hk ON tv.IDHOKHAU = hk.ID
                LEFT JOIN NHANKHAU chuho ON hk.IDCHUHO = chuho.ID
                WHERE tv.IDNHANKHAU = @nkId
            `);

        let household = null;
        let members = [];

        if (householdRes.recordset.length > 0) {
            const hkData = householdRes.recordset[0];
            household = {
                id: hkData.id,
                realId: hkData.realId,
                chuHo: hkData.chuHo,
                idCH: hkData.idCH,
                diaChi: parseDiaChi(hkData.diaChiFull),
                diaChiFull: hkData.diaChiFull,
                ngayLapSo: hkData.ngayLapSo,
                vaiTro: hkData.vaiTro
            };

            // Get all household members
            const membersRes = await pool.request()
                .input('hkId', sql.Int, hkData.realId)
                .query(`
                    SELECT 
                        tv.IDHOKHAU,
                        nk.ID as nkID,
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
                        FORMAT(tv.NGAYDKTHUONGTRU, 'yyyy-MM-dd') as ngayDKTT,
                        nk.GHICHU as ghiChu,
                        tv.QUANHEVOICHUHO as vaiTro
                    FROM THANHVIENCUAHO tv
                    JOIN NHANKHAU nk ON tv.IDNHANKHAU = nk.ID
                    LEFT JOIN CANCUOCCONGDAN cc ON nk.SOCCCD = cc.SOCCCD
                    WHERE tv.IDHOKHAU = @hkId
                    ORDER BY 
                        CASE 
                            WHEN tv.QUANHEVOICHUHO = N'Chủ hộ' THEN 0 
                            WHEN tv.QUANHEVOICHUHO IN (N'Vợ', N'Chồng') THEN 1
                            ELSE 2
                        END,
                        nk.ID
                `);

            members = membersRes.recordset;
        }

        res.json({
            success: true,
            resident: resident,
            household: household,
            members: members
        });
    } catch (err) {
        console.error('Error getting citizen info:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get citizen's own requests
app.get('/api/requests', requireAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const pool = await connectDB();

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    d.ID as id,
                    d.ACTION_KEY as actionKey,
                    d.ACTION_NAME as actionName,
                    d.STATUS as status,
                    d.PAYLOAD as payload,
                    FORMAT(d.CREATED_DATE, 'yyyy-MM-dd HH:mm') as createdDate,
                    FORMAT(d.PROCESSED_DATE, 'yyyy-MM-dd HH:mm') as processedDate,
                    d.REJECT_REASON as rejectReason,
                    nk.HOTEN as targetPerson,
                    admin.USERNAME as processedBy
                FROM DONXIN d
                LEFT JOIN NHANKHAU nk ON d.NK_ID = nk.ID
                LEFT JOIN USERS admin ON d.PROCESSED_BY = admin.ID
                WHERE d.USER_ID = @userId
                ORDER BY d.CREATED_DATE DESC
            `);

        res.json({ success: true, requests: result.recordset });
    } catch (err) {
        console.error('Error getting requests:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all requests (admin only)
app.get('/api/requests/admin', requireAdmin, async (req, res) => {
    try {
        const { actionKey, status } = req.query;
        const pool = await connectDB();

        let query = `
            SELECT 
                d.ID as id,
                d.ACTION_KEY as actionKey,
                d.ACTION_NAME as actionName,
                d.STATUS as status,
                d.PAYLOAD as payload,
                FORMAT(d.CREATED_DATE, 'yyyy-MM-dd HH:mm') as createdDate,
                FORMAT(d.PROCESSED_DATE, 'yyyy-MM-dd HH:mm') as processedDate,
                d.REJECT_REASON as rejectReason,
                citizen.USERNAME as citizenCCCD,
                citizenInfo.HOTEN as citizenName,
                nk.HOTEN as targetPerson,
                admin.USERNAME as processedBy
            FROM DONXIN d
            JOIN USERS citizen ON d.USER_ID = citizen.ID
            LEFT JOIN NHANKHAU citizenInfo ON citizen.CCCD = citizenInfo.SOCCCD
            LEFT JOIN NHANKHAU nk ON d.NK_ID = nk.ID
            LEFT JOIN USERS admin ON d.PROCESSED_BY = admin.ID
            WHERE 1=1
        `;

        const request = pool.request();

        if (actionKey) {
            query += ` AND d.ACTION_KEY = @actionKey`;
            request.input('actionKey', sql.NVarChar, actionKey);
        }

        if (status) {
            query += ` AND d.STATUS = @status`;
            request.input('status', sql.NVarChar, status);
        }

        query += ` ORDER BY d.CREATED_DATE DESC`;

        const result = await request.query(query);
        res.json({ success: true, requests: result.recordset });
    } catch (err) {
        console.error('Error getting admin requests:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Submit a new request (citizen only)
app.post('/api/requests', requireAuth, async (req, res) => {
    try {
        const { actionKey, actionName, nkId, payload } = req.body;
        const userId = req.session.user.id;
        const userNkId = req.session.user.nkId;

        const pool = await connectDB();
        // console.log(userId);
        // console.log(userNkId);
        // Verify citizen owns the target person (self or household member)
        // if (nkId !== userNkId) {
        //     const verifyRes = await pool.request()
        //         .input('userNkId', sql.Int, userNkId)
        //         .input('targetNkId', sql.Int, nkId)
        //         .query(`
        //             SELECT 1
        //             FROM THANHVIENCUAHO tv1
        //             INNER JOIN THANHVIENCUAHO tv2 ON tv1.IDHOKHAU = tv2.IDHOKHAU
        //             WHERE tv1.IDNHANKHAU = @userNkId AND tv2.IDNHANKHAU = @targetNkId
        //         `);

        //     if (verifyRes.recordset.length === 0) {
        //         return res.status(403).json({
        //             success: false,
        //             message: 'Bạn không có quyền tạo yêu cầu cho người này'
        //         });
        //     }
        // }

        // Create new request
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('nkId', sql.Int, nkId)
            .input('actionKey', sql.NVarChar, actionKey)
            .input('actionName', sql.NVarChar, actionName)
            .input('payload', sql.NVarChar, JSON.stringify(payload))
            .query(`
                INSERT INTO DONXIN (USER_ID, NK_ID, ACTION_KEY, ACTION_NAME, PAYLOAD)
                VALUES (@userId, @nkId, @actionKey, @actionName, @payload)
            `);

        res.json({ success: true, message: 'Gửi yêu cầu thành công' });
    } catch (err) {
        console.error('Error creating request:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});
const ACTION_HANDLERS = {
    'saveTemp': async (transaction, nkId, payload) => {
        await new sql.Request(transaction)
            .input('nkId', sql.Int, nkId)
            .input('noiTT', sql.NVarChar, payload.noiTamTru)
            .input('tuNgay', sql.Date, payload.ngayDangKy)
            .input('denNgay', sql.Date, payload.denNgay)
            .input('lyDo', sql.NVarChar, payload.lyDo)
            .query('INSERT INTO TAMTRU (IDNHANKHAU, NOIOHIENTAI, TUNGAY, DENNGAY, LYDO) VALUES (@nkId, @noiTT, @tuNgay, @denNgay, @lyDo)');
    },
    'saveTamVang': async (transaction, nkId, payload) => {
        await new sql.Request(transaction)
            .input('nkId', sql.Int, nkId)
            .input('noiTT', sql.NVarChar, payload.noiChuyenDen)
            .input('tuNgay', sql.Date, payload.ngayDangKy)
            .input('denNgay', sql.Date, payload.denNgay)
            .input('lyDo', sql.NVarChar, payload.lyDo)
            .query('INSERT INTO TAMVANG (IDNHANKHAU, NOITAMTRU, TUNGAY, DENNGAY, LYDO) VALUES (@nkId, @noiTT, @tuNgay, @denNgay, @lyDo)');
    },
    'removeThuongTru': async (transaction, nkId, payload) => {
        await new sql.Request(transaction)
            .input('nkId', sql.Int, nkId)
            .query('DELETE FROM THANHVIENCUAHO WHERE IDNHANKHAU = @nkId');
    },
    'removeTamTru': async (transaction, nkId, payload) => {
        await new sql.Request(transaction)
            .input('nkId', sql.Int, nkId)
            .query('DELETE FROM TAMTRU WHERE IDNHANKHAU = @nkId');
    },
    'removeTamVang': async (transaction, nkId, payload) => {
        await new sql.Request(transaction)
            .input('nkId', sql.Int, nkId)
            .query('DELETE FROM TAMVANG WHERE IDNHANKHAU = @nkId');
    }
};
// Approve a request (admin only)
app.put('/api/requests/:id/approve', requireAdmin, async (req, res) => {
    const requestId = parseInt(req.params.id);
    const adminId = req.session.user.id;

    const transaction = new sql.Transaction(await connectDB());

    try {
        await transaction.begin();

        // Get request details
        const requestRes = await new sql.Request(transaction)
            .input('id', sql.Int, requestId)
            .query('SELECT * FROM DONXIN WHERE ID = @id');

        if (requestRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        const request = requestRes.recordset[0];
        console.log(request);
        //throw error();
        const requestData = JSON.parse(request.PAYLOAD);

        // Execute business logic based on request type
        switch (request.ACTION_NAME) {
            case 'Temporary Residence':
            case 'Đăng ký tạm trú':
                // Insert into TAMTRU
                await new sql.Request(transaction)
                    .input('nkId', sql.Int, request.NK_ID)
                    .input('noiTT', sql.NVarChar, requestData.noiTamTru)
                    .input('tuNgay', sql.Date, requestData.ngayDangKy)
                    .input('denNgay', sql.Date, requestData.denNgay)
                    .input('lyDo', sql.NVarChar, requestData.lyDo)
                    .query(`
                        INSERT INTO TAMTRU (IDNHANKHAU, NOIOHIENTAI, TUNGAY, DENNGAY, LYDO)
                        VALUES (@nkId, @noiTT, @tuNgay, @denNgay,@lyDo)
                    `);
                break;

            case 'Temporary Absence':
            case 'Đăng ký tạm vắng':
                // Insert into TAMVANG
                await new sql.Request(transaction)
                    .input('nkId', sql.Int, request.NK_ID)
                    .input('noiChuyenDen', sql.NVarChar, requestData.noiChuyenDen)
                    .input('ngayDK', sql.Date, requestData.ngayDangKy)
                    .input('denNgay', sql.Date, requestData.denNgay)
                    .input('lyDo', sql.NVarChar, requestData.lyDo)
                    .query(`
                        

                            INSERT INTO TAMVANG (IDNHANKHAU, NOITAMTRU, TUNGAY, DENNGAY, LYDO)
                        VALUES
                            (@id, @noiChuyenDen, @ngayDK, @denNgay, @lyDo);
                        UPDATE NHANKHAU
                        SET 
                            GHICHU = N'Tạm vắng',
                            DIACHIHIENNAY = @noiChuyenDen
                        WHERE 
                            ID = @id;
                    `);
                break;

            case 'Remove Permanent Residence':
            case 'Xóa đăng ký thường trú':
                // Delete from THANHVIENCUAHO
                await new sql.Request(transaction)
                    .input('id', sql.Int, request.NK_ID)
                    .query(`
                        IF EXISTS (
                            SELECT 1
                            FROM HOKHAU
                            WHERE IDCHUHO = @id
                        )
                        BEGIN
                            THROW 50002, N'Không thể xoá: Nhân khẩu là chủ hộ', 1;
                        END

                        -- 2. Xoá đăng ký thường trú (liên kết hộ)
                        DELETE FROM THANHVIENCUAHO
                        WHERE IDNHANKHAU = @id;
                        `)
                //.query('DELETE FROM THANHVIENCUAHO WHERE IDNHANKHAU = @nkId');
                break;

            case 'Remove Temporary Residence':
            case 'Xóa đăng ký tạm trú':
                // Delete from TAMTRU
                await new sql.Request(transaction)
                    .input('id', sql.Int, request.NK_ID)
                    .query(`
                        DELETE FROM TAMTRU WHERE IDNHANKHAU = @id;
                        DELETE FROM NHANKHAU WHERE ID = @id
                        `)
                //.query('DELETE FROM TAMTRU WHERE IDNHANKHAU = @nkId');
                break;

            case 'Remove Temporary Absence':
            case 'Xóa đăng ký tạm vắng':
                // Delete from TAMVANG
                await new sql.Request(transaction)
                    .input('nkId', sql.Int, request.NK_ID)
                    .query(`
                        DELETE FROM TAMVANG WHERE IDNHANKHAU = @id;

                        UPDATE NHANKHAU
                        SET 
                            GHICHU = N'' 
                        WHERE 
                            ID = @id;

                        UPDATE NHANKHAU
                        SET DIACHIHIENNAY = NOITHUONGTRU 
                        WHERE ID = @id
                        `)
                    .query('DELETE FROM TAMVANG WHERE IDNHANKHAU = @nkId');
                break;

            case 'Thay đổi thông tin hộ khẩu':
            case 'changeHouseholdInfo':
                // Update household address
                const diaChi = requestData.diaChi;
                const diaChiStr = [
                    diaChi?.soNha,
                    diaChi?.ngo,
                    diaChi?.duong,
                    diaChi?.phuong,
                    diaChi?.quan,
                    diaChi?.tinh
                ].filter(Boolean).join(', ');
                //reqData = payload
                await new sql.Request(transaction)
                    .input('id', sql.Int, requestData.id)
                    .input('diaChi', sql.NVarChar, diaChiStr)
                    .query(`
                        UPDATE HOKHAU
                        SET DIACHI = @diaChi
                        WHERE ID = @id;

                        UPDATE nk
                        SET 
                            nk.NOITHUONGTRU = @diaChi,
                            nk.DIACHIHIENNAY = 
                                CASE 
                                    WHEN nk.DIACHIHIENNAY = nk.NOITHUONGTRU 
                                    THEN @diaChi
                                    ELSE nk.DIACHIHIENNAY
                                END
                        FROM NHANKHAU nk
                        INNER JOIN THANHVIENCUAHO tv
                            ON nk.ID = tv.IDNHANKHAU
                        WHERE tv.IDHOKHAU = @id;
                        `);
                break;

            case 'Đổi chủ hộ':
            case 'changeHouseholdHead':
                data = requestData;
                tvp = new sql.Table("dbo.ThanhVienType");
                tvp.columns.add("IDNHANKHAU", sql.Int);
                tvp.columns.add("QUANHEVOICHUHO", sql.NVarChar(50));

                data.tv.forEach(tv => {
                    tvp.rows.add(tv.id, tv.vaiTro);
                });
                
                await new sql.Request(transaction)
                    .input('idHK', sql.Int, data.idHK)
                    .input('newOwnerId', sql.Int, data.newOwnerId)
                    .input('thanhVien', tvp)
                    .execute('dbo.changeOwner');
                
                break;

            case 'Tách hộ':
            case 'splitHousehold':
                data = requestData;
                const newHK = data.HoKhauMoi;
                /* =======================
                TVP: danh sách thành viên
                ======================= */
                tvp = new sql.Table("dbo.ThanhVienType");
                tvp.columns.add("IDNHANKHAU", sql.Int);
                tvp.columns.add("QUANHEVOICHUHO", sql.NVarChar(50));

                newHK.thanhVien.forEach(tv => {
                    tvp.rows.add(tv.id, tv.vaiTro);
                });

                //throw new Error();
                

                await new sql.Request(transaction)
                    // ---- hộ khẩu cũ
                    .input('oldHkId', sql.Int, data.idHoKhauCu)

                    // ---- hộ khẩu mới
                    .input('diaChi', sql.NVarChar, data.diaChi)
                    .input('ngayLap', sql.Date, new Date())
                    .input('idCHMoi', sql.Int, newHK.idChuHo)

                    // ---- TVP thành viên
                    .input('thanhVien', tvp)
                    .execute('dbo.SplitHousehold');
        }

        // Update request status
        await new sql.Request(transaction)
            .input('id', sql.Int, requestId)
            .input('adminId', sql.Int, adminId)
            .query(`
                UPDATE DONXIN 
                SET 
                    STATUS = N'Approved', 
                    PROCESSED_DATE = GETDATE(), 
                    PROCESSED_BY = @adminId
                WHERE ID = @id
            `);

        await transaction.commit();
        res.json({ success: true, message: 'Đã phê duyệt yêu cầu' });
    } catch (err) {
        await transaction.rollback();
        console.error('Error approving request:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Reject a request (admin only)
app.put('/api/requests/:id/reject', requireAdmin, async (req, res) => {
    const requestId = parseInt(req.params.id);
    const adminId = req.session.user.id;
    const { rejectionReason } = req.body;

    try {
        const pool = await connectDB();

        await pool.request()
            .input('id', sql.Int, requestId)
            .input('adminId', sql.Int, adminId)
            .input('reason', sql.NVarChar, rejectionReason || '')
            .query(`
                UPDATE DONXIN 
                SET STATUS = N'Rejected', 
                    PROCESSED_DATE = GETDATE(), 
                    PROCESSED_BY = @adminId,
                    REJECT_REASON = @reason
                WHERE ID = @id
            `);

        res.json({ success: true, message: 'Đã từ chối yêu cầu' });
    } catch (err) {
        console.error('Error rejecting request:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= START SERVER =================

app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
});