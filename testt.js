const { query } = require("mssql");

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
    const result = await reqT.request()
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
        await reqT.request()
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
        await reqT.request()
        .input("idDot", sql.Int, result.recordset[0].ID)
        .query(`
            INSERT INTO THUONGHOCTAP (ID_DOT, ID_HOCSINH)
            SELECT 
                @idDot,
                hs.IDNHANKHAU
            FROM HOCSINH hs
            `)
    }
    await transaction.commit();
    res.json({ success: true , message: "Tạo đợt thưởng mới thành công"});
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