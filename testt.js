const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123', // <--- Nhập đúng mật khẩu bạn vừa đổi ở Bước 3
    server: 'localhost\\SQLEXPRESS',
    database: 'QLNhanKhau',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function test() {
    try {
        await sql.connect(config);
        console.log("✅ KẾT NỐI THÀNH CÔNG! (Tài khoản/Mật khẩu đúng)");
    } catch (err) {
        console.log("❌ VẪN LỖI: " + err.message);
    }
}

test();