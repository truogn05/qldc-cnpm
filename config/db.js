const sql = require('mssql');

const config = {
    user: 'sa',             // Tên đăng nhập SQL Server
    password: '123',        // Mật khẩu SQL Server
    server: 'localhost\\SQLEXPRESS',    // Server address
    database: 'QLNK_TEMP', // Tên Database bạn đã tạo
    options: {
        encrypt: false, 
        trustServerCertificate: true // Bỏ qua lỗi SSL khi chạy local
    }
};

async function connectDB() {
    try {
        let pool = await sql.connect(config);
        console.log("✅ Đã kết nối thành công tới SQL Server!");
        return pool;
    } catch (err) {
        console.log("❌ Lỗi kết nối CSDL:", err);
    }
}

module.exports = { connectDB, sql };