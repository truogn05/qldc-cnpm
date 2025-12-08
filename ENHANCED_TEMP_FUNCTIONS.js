// ==============================================
// ENHANCED TẠM TRỚ & TẠ VẮNG FUNCTIONS
// Replace these functions in your app.js file
// ==============================================

// START: Replace showTempDetail function (around line 739-765)
function showTempDetail(id) {
    const t = tempResidents.find(x => x.id === id);
    if (!t) return;
    const contentHtml = `
    <h3 class="detail-name-title">${t.ten}</h3>
    <div class="info-vertical-list">
        <div class="info-item-row"><label>Họ và tên</label><span>${t.ten}</span></div>
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(t.ngaySinh)}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${t.gioiTinh}</span></div>
        <div class="info-item-row"><label>Số điện thoại</label><span>${t.sdt || 'N/A'}</span></div>
        <div class="info-item-row"><label>Số CCCD</label><span>${t.cccd || 'N/A'}</span></div>
        <div class="info-item-row"><label>Ngày cấp CCCD</label><span>${formatDate(t.cccdNgayCap) || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nơi cấp CCCD</label><span>${t.cccdNoiCap || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${t.nghe || 'N/A'}</span></div>
        <div class="info-item-row"><label>Dân tộc</label><span>${t.danToc || 'N/A'}</span></div>
        <div class="info-item-row"><label>Tôn giáo</label><span>${t.tonGiao || 'N/A'}</span></div>
        <div class="info-item-row"><label>Quốc tịch</label><span>${t.quocTich || 'Việt Nam'}</span></div>
        <div class="info-item-row"><label>Quê quán</label><span>${t.queQuan || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Thường trú</label><span>${t.diaChiThuongTru || 'N/A'}</span></div>
        <div class="info-item-row full-width" style="border-top: 2px solid #3498db; margin-top: 10px; padding-top: 10px;"><label><strong>Nơi tạm trú</strong></label><span><strong>${t.noiTamTru}</strong></span></div>
        <div class="info-item-row"><label>Ngày đăng ký</label><span>${formatDate(t.ngayDangKy)}</span></div>
        <div class="info-item-row"><label>Thời hạn</label><span>${t.thoiHanTamTru || 'N/A'}</span></div>
    </div>
    <div class="form-actions"><button class="btn success" onclick="showTempForm('${t.id}')">Chỉnh sửa</button></div>
    `;
    showDetailView("Chi tiết tạm trú", contentHtml);
}
// END: showTempDetail
// START: Replace showTempForm function (around line 768-790)
function showTempForm(id = null) {
    const isEdit = id !== null;
    const t = isEdit ? tempResidents.find(x => x.id === id) : {};

    const contentHtml = `
    <h4>Thông tin cơ bản</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="tmp_ten" value="${t.ten || ''}"></div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="tmp_ns" value="${t.ngaySinh || ''}"></div>
        <div class="form-group"><label>Giới tính:</label><select id="tmp_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
        <div class="form-group"><label>Số điện thoại:</label><input id="tmp_sdt" value="${t.sdt || ''}"></div>
        <div class="form-group"><label>Email:</label><input type="email" id="tmp_email" value="${t.email || ''}"></div>
        <div class="form-group"><label>Nơi sinh:</label><input id="tmp_noisinh" value="${t.noiSinh || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Giấy tờ tùy thân</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Số CCCD:<span style="color:red">*</span></label><input id="tmp_cccd" value="${t.cccd || ''}"></div>
        <div class="form-group"><label>Ngày cấp:</label><input type="date" id="tmp_cccd_nc" value="${t.cccdNgayCap || ''}"></div>
        <div class="form-group full-width"><label>Nơi cấp:</label><input id="tmp_cccd_noicap" value="${t.cccdNoiCap || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Thông tin dân tộc & tôn giáo</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Dân tộc:</label><input id="tmp_dantoc" value="${t.danToc || 'Kinh'}"></div>
        <div class="form-group"><label>Tôn giáo:</label><input id="tmp_tongiao" value="${t.tonGiao || 'Không'}"></div>
        <div class="form-group"><label>Quốc tịch:</label><input id="tmp_quoctich" value="${t.quocTich || 'Việt Nam'}"></div>
        <div class="form-group"><label>Nguyên quán:</label><input id="tmp_que" value="${t.queQuan || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Trình độ & nghề nghiệp</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Trình độ học vấn:</label><input id="tmp_hocvan" value="${t.trinhDoHocVan || ''}"></div>
        <div class="form-group"><label>Nghề nghiệp:</label><input id="tmp_nghe" value="${t.nghe || ''}"></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="tmp_noilamviec" value="${t.noiLamViec || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Địa chỉ</h4>
    <div class="form-grid-2">
        <div class="form-group full-width"><label>Thường trú:</label><input id="tmp_tt" value="${t.diaChiThuongTru || ''}"></div>
        <div class="form-group full-width"><label>Nơi tạm trú:<span style="color:red">*</span></label><input id="tmp_noio" value="${t.noiTamTru || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Thông tin tạm trú</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Ngày đăng ký:</label><input type="date" id="tmp_ngaydk" value="${t.ngayDangKy || ''}"></div>
        <div class="form-group"><label>Thời hạn:</label><input id="tmp_th" value="${t.thoiHanTamTru || ''}" placeholder="VD: 6 tháng, 1 năm"></div>
    </div>
    
    <div class="form-actions">
        <button class="btn success" onclick="saveTemp('${id}')">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
    `;
    showDetailView(isEdit ? "Sửa tạm trú" : "Thêm tạm trú", contentHtml, true);
    if(t.gioiTinh) document.getElementById('tmp_gt').value = t.gioiTinh;
}
// END: showTempForm

// START: Enhanced showAbsentDetail function (around line 838-852)
function showAbsentDetail(id) {
    const t = absentResidents.find(x => x.id === id);
    if(!t) return;
    const contentHtml = `
    <h3 class="detail-name-title">${t.ten}</h3>
    <div class="info-vertical-list">
        <div class="info-item-row"><label>Họ và tên</label><span>${t.ten}</span></div>
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(t.ngaySinh)}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${t.gioiTinh}</span></div>
        <div class="info-item-row"><label>Số điện thoại</label><span>${t.sdt || 'N/A'}</span></div>
        <div class="info-item-row"><label>Số CCCD</label><span>${t.cccd || 'N/A'}</span></div>
        <div class="info-item-row"><label>Ngày cấp CCCD</label><span>${formatDate(t.cccdNgayCap) || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nơi cấp CCCD</label><span>${t.cccdNoiCap || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${t.nghe || 'N/A'}</span></div>
        <div class="info-item-row"><label>Dân tộc</label><span>${t.danToc || 'N/A'}</span></div>
        <div class="info-item-row"><label>Tôn giáo</label><span>${t.tonGiao || 'N/A'}</span></div>
        <div class="info-item-row"><label>Quốc tịch</label><span>${t.quocTich || 'Việt Nam'}</span></div>
        <div class="info-item-row"><label>Quê quán</label><span>${t.queQuan || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Thường trú</label><span>${t.diaChiThuongTru || 'N/A'}</span></div>
        <div class="info-item-row full-width" style="border-top: 2px solid #e74c3c; margin-top: 10px; padding-top: 10px;"><label><strong>Nơi chuyển đến</strong></label><span><strong>${t.noiChuyenDen}</strong></span></div>
        <div class="info-item-row"><label>Ngày đăng ký</label><span>${formatDate(t.ngayDangKy)}</span></div>
        <div class="info-item-row"><label>Thời hạn</label><span>${t.thoiHanTamVang || 'N/A'}</span></div>
    </div>
    <div class="form-actions"><button class="btn success" onclick="showAbsentForm('${t.id}')">Chỉnh sửa</button></div>
    `;
    showDetailView("Chi tiết tạm vắng", contentHtml);
}
// END: showAbsentDetail
// NOTE: The saveTemp function is already updated in your app.js
// You only need to replace the three functions above
