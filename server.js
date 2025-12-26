const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { connectDB, sql } = require('./config/db');
const { error } = require('console');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// === HELPER: Parse địa chỉ ===
function parseDiaChi(diaChiStr) {
    if (!diaChiStr) return { soNha: "",ngo: "", duong: "", phuong: "", quan: "", tinh: "" };
    const parts = diaChiStr.split(',').map(s => s.trim());
    return {
        soNha: parts[0] || "",
        ngo: parts[1] ||"",
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
    const { id, chuHo, diaChi, ngayLapSo } = req.body;
    const diaChiStr = `${diaChi.soNha}, ${diaChi.ngo}, ${diaChi.duong}, ${diaChi.phuong}, ${diaChi.quan}, ${diaChi.tinh}`;

    const isEdit = id!==null;
    const transaction = new sql.Transaction(await connectDB());
    try {
        throw new error ;
        await transaction.begin();
        if(isEdit){
            //nếu chỉ là sửa thông tin của hộ -> update


        }
        else{
            //nếu là tạo hk => 
        }
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
        res.json({ success: true , message: "Thêm hộ khẩu mới thành công!"});
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: err.message , messsage: "Thêm hộ khẩu mới không thành công!"});
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
        
        console.error("Lỗi API xoá hộ khẩu: ", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, message: "Xoá hộ khẩu không thành công!" });
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
        res.json({ success: true , message: data.id? "Đã sửa thông tin nhân khẩu" : "Thêm mới nhân khẩu thành công"});
    } catch (err) {
        
        console.error("Lỗi API post resident:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message, message: data.id? "Lỗi khi sửa thông tin nhân khẩu" : "Lỗi khi thêm mới nhân khẩu" });
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
        res.status(500).json({ error: err.message }); }
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
        if(!isEdit){
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
                    .input('id', sql.Int,  nkRes.recordset[0].ID)
                    .input('NoiTT', sql.NVarChar, data.noiTamTru || null)
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
        else{//TH sửa tạm trú
            const cccdOld = await new sql.Request(transaction)
                .input('id', sql.Int, data.id)
                .query(`SELECT SOCCCD FROM NHANKHAU WHERE ID = @id`);
            // lưu lại cccd hiện tại của người đó
            const CCCDOLD = cccdOld.recordset[0].SOCCCD;

            
            if(CCCDOLD !== data.cccd){//nếu cccd mới != cccd cũ -> sửa cccd  => phải kiểm tra xem liệu có bị trùng với cccd của ai không
                
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
                    .input('cccdCu', sql.VarChar, CCCDOLD )
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
            else{//CCCD mới === cũ  -> chỉ sửa thông tin về cccd
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
        res.json({ success: true, message: isEdit? "Sửa thông tin tạm trú thành công!" : "Thêm tạm trú thành công" });

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
        //console.log("chạy đến đây r 1");
        // Lấy ID nhân khẩu thực từ frontend
        let nkId = null;
        if (data.isEdit) {
            // console.log("chạy đến đây r 2");
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
        else{
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
            
            res.json({ success: true, message: data.isEdit? "Đã sửa thông tin tạm vắng!": "Đã thêm tạm vắng!" });
        }
        
        await transaction.commit();
        //if (!nkId) return res.status(400).json({ success: false, message: "lỗi không thấy nhân khẩu" });

        //return res.json({ success: true });
    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Lỗi API Tạm vắng:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({success: false, message: isEdit? "Lỗi khi lưu thông tin tạm vắng": "Lỗi khi thêm thông tin tạm vắng" });
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
        res.status(500).json({success: false, message: "Xoá thông tin tạm trú không thành công" }); }
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
        console.log("Đã xoá tạm vắng thành công ");
        res.json({ success: true, message: "Đã xoá thông tin tạm vắng" });
    } catch (err) { 
        
        console.error("Lỗi API xoá Tạm vắng:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({success: false, message: "Xoá thông tin tạm vắng không thành công" }); }
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
    // console.log(data);
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

    try{
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
    catch(e){
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
  if(data.loai =="LE" && !data.donGia) return res.json({ success: false, message: "Thiếu dữ liệu" });

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
    if(data.loai=="LE"){
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
    else{
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
    //console.log(111111111);
    res.json({ success: true , message: "Tạo đợt thưởng mới thành công"});
  } catch (err) {
    console.error(err);
    //console.log(22222);
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
    console.error("Lỗi khi tính tổng thưởng lễ",err);
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
    console.error("Lỗi khi tính tổng thưởng học tập",err);
    res.json({ success: false , message: "Lỗi khi tính tổng thưởng học tập"});
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
    console.error("Lỗi khi lấy danh sách thưởng lễ",err);
    res.json({ success: false ,message: "Lỗi khi lấy danh sách thưởng lễ"});
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
    console.error("Lỗi khi lấy danh sách thưởng học tập",err);
    res.json({ success: false, message: "Lỗi khi lấy danh sách thưởng học tập"});
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
        res.status(500).json({success: false, message: "Xoá đợt thưởng không thành công" }); }
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
        res.status(500).json({success: false, message: "Thay đổi thành tích không thành công" }); }
});
// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server chạy tại http://localhost:${PORT}`);
});