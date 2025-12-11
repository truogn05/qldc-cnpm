// ===== API SERVICE: Cầu nối Frontend - Backend =====
const ApiService = {
  // --- HỘ KHẨU ---
  getHouseholds: async () => {
    try {
      const res = await fetch('/api/households');
      if (!res.ok) throw new Error('Lỗi server');
      return await res.json();
    } catch (e) { console.error(e); return []; }
  },

  saveHousehold: async (data) => {
    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  },

  deleteHousehold: async (id) => {
    try {
      const res = await fetch(`/api/households/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false }; }
  },

  // --- NHÂN KHẨU (Thêm mới/Sửa thành viên) ---
  saveResident: async (data) => {
    try {
      const res = await fetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      console.warn("API lưu nhân khẩu chưa có, log dữ liệu:", data);
      return { success: true };
    }
  },

  deleteResident: async (id) => {
    try {
      const res = await fetch(`/api/residents/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false }; }
  },

  // --- TẠM TRÚ / TẠM VẮNG ---
  getTempResidents: async () => {
    try {
      const res = await fetch('/api/temp-residents');
      return await res.json();
    } catch (e) { return []; }
  },

  saveTempResident: async (data) => {
    try {
      const res = await fetch('/api/temp-residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false }; }
  },

  deleteTempResident: async (id) => {
    try {
      const res = await fetch(`/api/temp-residents/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false }; }
  },

  getAbsentResidents: async () => {
    try {
      const res = await fetch('/api/absent-residents');
      return await res.json();
    } catch (e) { return []; }
  },

  saveAbsentResident: async (data) => {
    try {
      const res = await fetch('/api/absent-residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false }; }
  },

  deleteAbsentResident: async (id) => {
    try {
      const res = await fetch(`/api/absent-residents/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false }; }
  }
};

// ===== BIẾN TOÀN CỤC =====
let households = [];
let residents = [];
let tempResidents = [];
let absentResidents = [];
let rewards = [];
let currentSection = 'households';
let isDetailDirty = false;
let currentDraggedItem = null;

// ===== DOM ELEMENTS =====
const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const logoutBtn = document.getElementById("logoutBtn");

const mainHeader = document.getElementById("mainHeader");
const headerTitle = document.getElementById("headerTitle");
const headerActions = document.getElementById("headerActions");
const detailView = document.getElementById("detailView");
const detailViewTitle = document.getElementById("detailViewTitle");
const detailViewContent = document.getElementById("detailViewContent");
const detailViewBackBtn = document.getElementById("detailViewBackBtn");
const brandLogo = document.getElementById("brandLogo");

const confirmModal = document.getElementById("confirmModal");
const confirmModalMessage = document.getElementById("confirmModalMessage");
let confirmModalConfirm = document.getElementById("confirmModalConfirm");
const confirmModalCancel = document.getElementById("confirmModalCancel");


// ===== KHỞI TẠO DỮ LIỆU =====
async function loadData() {
  try {
    const [hkData, ttData, tvData] = await Promise.all([
      ApiService.getHouseholds(),
      ApiService.getTempResidents(),
      ApiService.getAbsentResidents()
    ]);

    households = hkData || [];
    tempResidents = ttData || [];
    absentResidents = tvData || [];
    rewards = [{ id: "R001", loai: "Trung thu 2025", giaTri: "300.000đ", chiTiet: [] }];

    flattenResidents();
    navigateTo(currentSection);
  } catch (err) {
    alert("Không thể tải dữ liệu từ Server!");
    console.error(err);
  }
}

function flattenResidents() {
  residents = [];
  if (!households || !Array.isArray(households)) return;

  households.forEach(hk => {
    if (hk.nhanKhau && Array.isArray(hk.nhanKhau)) {
      hk.nhanKhau.forEach(nk => {
        residents.push({
          ...nk,
          stt: residents.length + 1,
          hoKhauId: hk.id,
          chuHo: hk.chuHo
        });
      });
    }
  });
}

// ===== XÁC THỰC =====
passwordInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    loginBtn.click();
  }
});

loginBtn.onclick = async () => {
  const u = usernameInput.value.trim();
  const p = passwordInput.value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();

    if (data.success) {
      loginPage.style.display = "none";
      app.style.display = "block";
      loadData();
    } else {
      errorMsg.textContent = data.message || "Đăng nhập thất bại";
    }
  } catch (e) {
    errorMsg.textContent = "Lỗi kết nối server";
  }
};
logoutBtn.onclick = () => location.reload();


// ===== ĐIỀU HƯỚNG =====
brandLogo.onclick = () => {
  navigateTo('households');
  resetMenu();
  document.querySelector(".nav-item[data-section='households']").classList.add("active");
};

document.querySelectorAll(".nav-item").forEach(it => {
  it.onclick = () => {
    const sectionId = it.dataset.section;
    if (it.id === "residenceMain") {
      document.getElementById("residenceSub").classList.toggle("show");
      return;
    }

    resetMenu();
    it.classList.add("active");

    if (it.closest("#residenceSub")) {
      document.getElementById("residenceSub").classList.add("show");
      document.getElementById("residenceMain").classList.add("active");
    }

    if (sectionId) navigateTo(sectionId);
  };
});

function resetMenu() {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("residenceSub").classList.remove("show");
  document.getElementById("residenceMain").classList.remove("active");
}

function navigateTo(sectionId) {
  if (isDetailDirty) {
    showConfirmModal("Dữ liệu chưa lưu. Rời đi?", () => { isDetailDirty = false; forceNavigateTo(sectionId); });
    return;
  }
  forceNavigateTo(sectionId);
}

function forceNavigateTo(sectionId) {
  hideDetailView();
  currentSection = sectionId;
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const activeSection = document.getElementById(sectionId);
  if (activeSection) activeSection.classList.add("active");
  updateHeader(sectionId);

  switch (sectionId) {
    case 'households': renderHouseholds(); break;
    case 'residents': renderResidents(); break;
    case 'residence_temp': renderTemp(); break;
    case 'residence_absent': renderAbsent(); break;
    case 'stats': updateStats('gender'); break;
    case 'rewards': renderRewards(); break;
  }
}

function updateHeader(sectionId) {
  let title = "";
  let actionsHtml = "";
  if (sectionId === 'households') {
    title = "Quản lý hộ khẩu";
    actionsHtml = `<input type="text" id="searchHousehold" class="search-bar" placeholder="Tìm kiếm..."><button class="btn primary" id="addHouseholdBtn">Thêm hộ khẩu</button>`;
  } else if (sectionId === 'residents') {
    title = "Quản lý nhân khẩu";
    actionsHtml = `<input type="text" id="searchResident" class="search-bar" placeholder="Tìm kiếm...">`;
  } else if (sectionId === 'residence_temp') {
    title = "Quản lý tạm trú";
    actionsHtml = `<input type="text" id="searchTemp" class="search-bar" placeholder="Tìm kiếm..."> <button class="btn primary" id="addTempBtn">Đăng ký tạm trú</button>`;
  } else if (sectionId === 'residence_absent') {
    title = "Quản lý tạm vắng";
    actionsHtml = `<input type="text" id="searchAbsent" class="search-bar" placeholder="Tìm kiếm..."> `;//<button class="btn primary" id="addAbsentBtn">Thêm tạm vắng</button>
  } else if (sectionId === 'rewards') {
    title = "Quản lý phần thưởng";
    actionsHtml = `<button class="btn primary" id="addRewardBtn">Thêm phần thưởng</button>`;
  } else if (sectionId === 'stats') {
    title = "Thống kê dân cư";
  }

  headerTitle.textContent = title;
  headerActions.innerHTML = actionsHtml;

  attachHeaderEvents(sectionId);
}

function attachHeaderEvents(sectionId) {
  if (sectionId === 'households') {
    document.getElementById("addHouseholdBtn").onclick = () => showHouseholdForm();
    document.getElementById("searchHousehold").oninput = (e) => {
      const k = e.target.value.toLowerCase();
      renderHouseholds(households.filter(h => h.chuHo.toLowerCase().startsWith(k.toLowerCase()) ));
    };
  }
  if (sectionId === 'residents') {
    document.getElementById("searchResident").oninput = (e) => {
      const k = e.target.value.toLowerCase();
      const filteredPermanent = residents.filter(r => r.ten.toLowerCase().startsWith(k.toLowerCase()) );
      renderResidents(filteredPermanent);
    };
  }
  if (sectionId === 'residence_temp') {
    document.getElementById("addTempBtn").onclick = () => showTempForm();
    document.getElementById("searchTemp").oninput = (e) => {
      const k = e.target.value.toLowerCase();
      const filteredTemp  = tempResidents.filter(t => t.ten.toLowerCase().startsWith(k.toLowerCase()) );
      renderTemp(filteredTemp);
    };
  }
  if (sectionId === 'residence_absent') {
    // document.getElementById("addAbsentBtn").onclick = () => showAbsentForm();
    document.getElementById("searchAbsent").oninput = (e) => {
      const k = e.target.value.toLowerCase();
      const filteredAbsent = absentResidents.filter(t => t.ten.toLowerCase().startsWith(k.toLowerCase()));
      renderAbsent(filteredAbsent);
    };
  }
}


// ===== 1. LOGIC HỘ KHẨU =====
function renderHouseholds(list = households) {
  const tb = document.querySelector("#householdTable tbody");
  tb.innerHTML = "";
  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Không có dữ liệu</td></tr>";
    return;
  }
  list.forEach((h, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${h.id}</td>
      <td>${h.chuHo}</td>
      <td>${h.nhanKhau ? h.nhanKhau.length : 0}</td>
      <td >
        <button class='btn small primary' onclick='showHouseholdBookDetail("${h.id}")'>Chi tiết</button>
        <button class='btn small success' onclick='showHouseholdForm("${h.id}")'>Sửa</button>
        <button class='btn small' style="background-color: #f39c12; color: white;" onclick='showSplitHouseholdForm("${h.id}")'>Tách hộ</button>
        <button class='btn small danger' onclick='deleteHousehold("${h.id}")'>Xóa</button>
      </td>`;
    tb.appendChild(tr);
  });
}

function showHouseholdBookDetail(id) {
  const h = households.find(x => x.id === id);
  if (!h) return;

  const membersHtml = (h.nhanKhau || []).map(nk => `
    <div class="book-member-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <h4>${nk.ten} (${nk.vaiTro})</h4>
        <div>
          <button class="btn small success" onclick="showResidentForm('${h.id}', '${nk.id}')">Sửa</button>
          <button class="btn small danger" onclick="showMoveResidentForm('${h.id}', '${nk.id}')">Chuyển/Xóa</button>
        </div>
      </div>
      <div class="info-vertical-list">
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(nk.ngaySinh)}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${nk.gioiTinh}</span></div>

        <div class="info-item-row"><label>Nơi sinh</label><span>${nk.noiSinh|| 'N/A'}</span></div>
        <div class="info-item-row"><label>Nguyên quán</label><span>${nk.queQuan|| 'N/A'}</span></div>

        <div class="info-item-row"><label>CCCD</label><span>${nk.cccd || 'N/A'}</span></div>

        <div class="info-item-row"><label>Ngày cấp CCCD</label><span>${formatDate(nk.cccdNgayCap) || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nơi cấp CCCD</label><span>${nk.cccdNoiCap || 'N/A'}</span></div>

        <div class="info-item-row"><label>Dân tộc</label><span>${nk.danToc || 'N/A'}</span></div>
        <div class="info-item-row"><label>Tôn giáo</label><span>${nk.tonGiao || 'N/A'}</span></div>

        <div class="info-item-row"><label>Quốc tịch</label><span>${nk.quocTich || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${nk.nghe || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nơi làm việc</label><span>${nk.noiLamViec || 'N/A'}</span></div>
        <div class="info-item-row"><label>Địa chỉ thường trú trước khi chuyển đến</label><span>${nk.diaChiTruoc || 'Mới sinh'}</span></div>
        <div class="info-item-row"><label>Ngày đăng kí thường chú</label><span>${nk.ngayDangKyTT || ( formatDate(nk.ngaySinh)> h.ngayLapSo ? nk.ngaySinh : h.ngayLapSo)}</span></div>
        
        <div class="info-item-row full-width"><label>Ghi chú</label><span>${nk.ghiChu || 'Không có'}</span></div>
      </div>
    </div>
  `).join('');

  const contentHtml = `
    <h3 class="detail-name-title" style="text-align: center; border: none; margin-bottom: 5px;">SỔ HỘ KHẨU</h3>
    <h3 class="book-title" style="text-align: center; margin-top: 0; padding-top: 0;">Số: ${h.id}</h3>
    
    <div class="book-section">
      <h3>Thông tin chung</h3>
      <div class="info-vertical-list">
        <div class="info-item-row"><label>Chủ hộ</label><span>${h.chuHo}</span></div>
        <div class="info-item-row"><label>Ngày lập sổ</label><span>${formatDate(h.ngayLapSo)}</span></div>
        <div class="info-item-row"><label>Số nhà</label><span>${h.diaChi.soNha}</span></div>
        <div class="info-item-row"><label>Đường/Phố</label><span>${h.diaChi.duong}</span></div>
        <div class="info-item-row"><label>Phường/Xã</label><span>${h.diaChi.phuong}</span></div>
        <div class="info-item-row"><label>Quận/Huyện</label><span>${h.diaChi.quan}</span></div>
        <div class="info-item-row full-width"><label>Tỉnh/Thành phố</label><span>${h.diaChi.tinh}</span></div>
      </div>
    </div>
    
    <div class="book-section">
      <h3>Thành viên trong hộ</h3>
      <div class="book-members-list">${membersHtml || '<p>Chưa có thành viên.</p>'}</div>
    </div>
    
    <div class="form-actions">
      <button class="btn success" onclick='showHouseholdForm("${h.id}")'>Chỉnh sửa thông tin hộ</button>
      <button class="btn primary" onclick='showResidentForm("${h.id}", null)'>Thêm nhân khẩu mới</button>
    </div>
  `;
  showDetailView(`Sổ hộ khẩu: ${h.id}`, contentHtml);
}

function showHouseholdForm(id = null) {
  const isEdit = id !== null;
  const h = isEdit ? households.find(x => x.id === id) : {  diaChi: {} };
  const ch = isEdit ? residents.find(x => x.ten === h.chuHo) : null;
  const title = isEdit ? "Chỉnh sửa thông tin hộ khẩu" : "Thêm hộ khẩu mới";

  const contentHtml = `
    <div class="form-group"><label>Tên chủ hộ:</label><input type="text" id="formChuHo" value="${h.chuHo || ''}"></div>
    <div class="form-group"><label>Số CCCD của chủ hộ</label><input type="text" id="formCCCD" value="${ ch?.cccd || ''}"></div>
    <div class="form-grid-2">
      <div class="form-group"><label>Ngày lập sổ:</label><input type="date" id="formNgayLapSo" value="${h.ngayLapSo || ''}"></div>
      <div class="form-group"><label>Số nhà:</label><input type="text" id="formSoNha" value="${h.diaChi.soNha || ''}"></div>
    </div>
    <div class="form-group"><label>Đường/Phố:</label><input type="text" id="formDuong" value="${h.diaChi.duong || ''}"></div>
    <div class="form-grid-3">
      <div class="form-group"><label>Phường/Xã:</label><input type="text" id="formPhuong" value="${h.diaChi.phuong || ''}"></div>
      <div class="form-group"><label>Quận/Huyện:</label><input type="text" id="formQuan" value="${h.diaChi.quan || ''}"></div>
      <div class="form-group"><label>Tỉnh/TP:</label><input type="text" id="formTinh" value="${h.diaChi.tinh || ''}"></div>
    </div>
    <div class="form-actions">
        <button class="btn success" onclick="saveHousehold('${id}')">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `;
  showDetailView(title, contentHtml, true);
}

async function saveHousehold(id) {
  const data = {
    id: id !== 'null' ? id : null,
    chuHo: document.getElementById("formChuHo").value,
    cccdChuHo: document.getElementById("formCCCD").value,
    ngayLapSo: document.getElementById("formNgayLapSo").value,
    diaChi: {
      soNha: document.getElementById("formSoNha").value,
      duong: document.getElementById("formDuong").value,
      phuong: document.getElementById("formPhuong").value,
      quan: document.getElementById("formQuan").value,
      tinh: document.getElementById("formTinh").value
    }
  };

  if (!data.chuHo) return alert("Nhập tên chủ hộ!");

  const res = await ApiService.saveHousehold(data);
  if (res.success) {
    alert("Lưu thành công!");
    loadData();
    hideDetailView();
  } else {
    alert("Có lỗi xảy ra: " + (res.message || ""));
  }
}

async function deleteHousehold(id) {
  if (confirm(`Xóa hộ khẩu ${id}? Tất cả nhân khẩu sẽ bị xóa!`)) {
    const res = await ApiService.deleteHousehold(id);
    if (res.success) {
      alert("Đã xóa!");
      loadData();
    } else {
      alert("Lỗi khi xóa!");
    }
  }
}

// TÁCH HỘ KHẨU (Logic UI phức tạp)
function showSplitHouseholdForm(hkId) {
  const hk = households.find(h => h.id === hkId);
  if (!hk) return;
  if (!hk.nhanKhau || hk.nhanKhau.length < 2) return alert("Hộ phải có ít nhất 2 người để tách.");

  let membersHk1 = [...hk.nhanKhau];
  let membersHk2 = [];

  const updateUI = () => {
    document.getElementById('hk1_members').innerHTML = membersHk1.map(m => `<div class="member-item" onclick="moveMemberToNew('${m.id}')">${m.ten} (${m.vaiTro}) -></div>`).join('');
    document.getElementById('hk2_members').innerHTML = membersHk2.map(m => `<div class="member-item" onclick="moveMemberToOld('${m.id}')"><- ${m.ten} (${m.vaiTro})</div>`).join('');
  };

  window.moveMemberToNew = (id) => {
    const idx = membersHk1.findIndex(m => m.id === id);
    if (idx > -1) { membersHk2.push(membersHk1[idx]); membersHk1.splice(idx, 1); updateUI(); }
  };
  window.moveMemberToOld = (id) => {
    const idx = membersHk2.findIndex(m => m.id === id);
    if (idx > -1) { membersHk1.push(membersHk2[idx]); membersHk2.splice(idx, 1); updateUI(); }
  };

  const contentHtml = `
    <div class="split-household-container">
      <div class="split-column">
        <h4>Hộ cũ (${hk.id})</h4>
        <div class="member-list" id="hk1_members"></div>
      </div>
      <div class="split-column">
        <h4>Hộ mới</h4>
        <div class="split-column-header"><input type="text" id="hk2_chuho" placeholder="Tên chủ hộ mới"></div>
        <div class="member-list" id="hk2_members" style="border-color: #2ecc71;"></div>
      </div>
    </div>
    <div class="form-actions">
      <button class="btn success" onclick="saveSplitHousehold('${hk.id}')">Lưu tách hộ</button>
      <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `;
  showDetailView(`Tách hộ khẩu: ${hk.id}`, contentHtml, true);
  updateUI();
}

async function saveSplitHousehold(oldId) {
  const newOwner = document.getElementById("hk2_chuho").value;
  if (!newOwner) return alert("Nhập tên chủ hộ mới!");

  const data = {
    chuHo: newOwner,
    ngayLapSo: new Date().toISOString().split('T')[0],
    diaChi: households.find(h => h.id === oldId).diaChi
  };

  const res = await ApiService.saveHousehold(data);
  if (res.success) {
    alert("Đã tách hộ mới thành công!");
    loadData();
    hideDetailView();
  } else {
    alert("Lỗi tách hộ!");
  }
}


// ===== 2. LOGIC NHÂN KHẨU =====
function renderResidents(list = residents) {
  const tb = document.querySelector("#residentTable tbody");
  tb.innerHTML = "";
  

  if (list.length === 0) {
    tb.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Không có dữ liệu</td></tr>";
    return;
  }

  list.forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${p.ten}</td>
        <td>${formatDate(p.ngaySinh)}</td>
        <td>${p.gioiTinh}</td>
        <td>${p.ghiChu!= "Chủ hộ" && p.ghiChu!= null ? p.ghiChu : ''}</td>
        <td>
          <button class='btn small primary' onclick='showResidentDetail("${p.id}")'>Chi tiết</button>
        </td>
    `;
    tb.appendChild(tr);
  });
}

// CẬP NHẬT: Trang chi tiết nhân khẩu đầy đủ thông tin
function showResidentDetail(id) {
  let r = residents.find(x => x.id === id);
  let isTemp = false;
  if (!r) {
    r = tempResidents.find(x => x.id === id);
    isTemp = true;
  }

  if (!r) return;
  
  const contentHtml = `
    <h3 class="detail-name-title">${r.ten}</h3>
    <div class="info-vertical-list">
        <!-- Hàng 1 -->
        <div class="info-item-row"><label>Họ và tên</label><span>${r.ten}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${r.gioiTinh}</span></div>
        
        <!-- Hàng 2 -->
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(r.ngaySinh)}</span></div>
        <div class="info-item-row"><label>Quê quán</label><span>${r.queQuan || 'N/A'}</span></div>

        
        
        <!-- Hàng 3 -->
        <div class="info-item-row full-width"><label>Số CCCD</label><span>${r.cccd || 'N/A'}</span></div>
        <div class="info-item-row"><label>Ngày cấp CCCD</label><span>${formatDate(r.cccdNgayCap) || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nơi cấp CCCD</label><span>${r.cccdNoiCap || 'N/A'}</span></div>

        <!-- Hàng 4 -->
        <div class="info-item-row"><label>Dân tộc</label><span>${r.danToc || 'N/A'}</span></div>
        <div class="info-item-row"><label>Tôn giáo</label><span>${r.tonGiao || 'N/A'}</span></div>
        
        <!-- Hàng 5 -->
        <div class="info-item-row"><label>Quốc tịch</label><span>${r.quocTich || 'Việt Nam'}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${r.nghe || 'N/A'}</span></div>
        
        <!-- Hàng 6 -->
        <div class="info-item-row"><label>Số điện thoại</label><span>${r.sdt || 'N/A'}</span></div>
        <div class="info-item-row"><label>Email</label><span>${r.email || 'N/A'}</span></div>

        <!-- Hàng 7 -->
        <div class="info-item-row full-width"><label>Địa chỉ thường trú</label><span>${r.diaChiThuongTru || 'N/A'}</span></div>
        
        <!-- Hàng 8 -->
        <div class="info-item-row full-width"><label>Nơi ở hiện tại</label><span>${r.noiOHienTai || 'N/A'}</span></div>
        
        ${isTemp ? `<div class="info-item-row full-width"><label>Đang tạm trú tại</label><span>${r.noiTamTru}</span></div>` : ''}
    </div>
    <div class="form-actions">
        ${!isTemp ? `<button class="btn success" onclick='showResidentForm( "${r.id}")'>Chỉnh sửa</button>` : ''}
    </div>
    `;
  showDetailView("Chi tiết nhân khẩu", contentHtml);
}

function showResidentForm( nkId = null) {
  const isEdit = nkId !== null;//có nkid thì là edit
  let r = {};
  if (isEdit) r = residents.find(x => x.id === nkId) || {};

  const contentHtml = `
    <h4>Thông tin cơ bản</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="nk_ten" value="${r.ten || ''}"></div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="nk_ns" value="${r.ngaySinh || ''}"></div>
        <div class="form-group"><label>Giới tính:<span style="color:red">*</span></label><select id="nk_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
        <div class="form-group"><label>Số điện thoại:<span style="color:red">*</span></label><input id="nk_sdt" value="${r.sdt || ''}"></div>
        <div class="form-group"><label>Email:</label><input type="email" id="nk_email" value="${r.email || ''}"></div>
        <div class="form-group"><label>Nơi sinh:<span style="color:red">*</span></label><input id="nk_noisinh" value="${r.noiSinh || ''}"></div>
        <div class="form-group"><label>Số CCCD:<span style="color:red">*</span></label><input id="nk_cccd" value="${r.cccd || ''}"></div>
    </div>
    <div class="form-grid-2">
        <div class="form-group"><label>Ngày cấp:<span style="color:red">*</span></label><input type="date" id="nk_cccd_nc" value="${r.cccdNgayCap || ''}"></div>
        <div class="form-group full-width"><label>Nơi cấp:<span style="color:red">*</span></label><input id="nk_cccd_noicap" value="${r.cccdNoiCap || ''}"></div>
        <div class="form-group"><label>Dân tộc:<span style="color:red">*</span></label><input id="nk_dantoc" value="${r.danToc || 'Kinh'}"></div>
        <div class="form-group"><label>Tôn giáo:<span style="color:red">*</span></label><input id="nk_tongiao" value="${r.tonGiao || 'Không'}"></div>
        <div class="form-group"><label>Quốc tịch:<span style="color:red">*</span></label><input id="nk_quoctich" value="${r.quocTich || 'Việt Nam'}"></div>
        <div class="form-group"><label>Nguyên quán:<span style="color:red">*</span></label><input id="nk_que" value="${r.queQuan || ''}"></div>
    </div>
    
    
    <div class="form-grid-2">
        <div class="form-group"><label>Trình độ học vấn:<span style="color:red">*</span></label><input id="nk_hocvan" value="${r.trinhDoHocVan || ''}"></div>
        <div class="form-group"><label>Nghề nghiệp:<span style="color:red">*</span></label><input id="nk_nghe" value="${r.nghe || ''}"></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="nk_noilamviec" value="${r.noiLamViec || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Địa chỉ</h4>
    <div class="form-group full-width"><label>Địa chỉ thường trú:<span style="color:red">*</span></label><input id="nk_dctt" value="${r.diaChiThuongTru || ''}"  ${r.diaChiThuongTru ? 'readonly class="readonly-field"' : ''}></div>
    <div class="form-group full-width"><label>Nơi ở hiện tại:<span style="color:red">*</span></label><input id="nk_noht" value="${r.noiOHienTai || ''}"  ${r.noiOHienTai ? 'readonly class="readonly-field"' : ''}></div>
    
    <div class="form-actions">
      <button class="btn success" onclick="saveResident('${nkId}')">Lưu</button>
      <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
    `;
  showDetailView(isEdit ? "Sửa thông tin nhân khẩu" : "Thêm nhân khẩu", contentHtml, true);
  if (r.gioiTinh) document.getElementById('nk_gt').value = r.gioiTinh;
}

async function saveResident( nkId) {
  const data = {
    id:               nkId !== 'null' ? nkId : null,
    ten:              document.getElementById('nk_ten').value.trim(),
    ngaySinh:         document.getElementById('nk_ns').value,
    gioiTinh:         document.getElementById('nk_gt').value,
    sdt:              document.getElementById('nk_sdt').value.trim(),
    email:            document.getElementById('nk_email').value.trim(),
    noiSinh:          document.getElementById('nk_noisinh').value.trim(),
    cccd:             document.getElementById('nk_cccd').value.trim(),
    cccdNgayCap:      document.getElementById('nk_cccd_nc').value,
    cccdNoiCap:       document.getElementById('nk_cccd_noicap').value.trim(),
    danToc:           document.getElementById('nk_dantoc').value.trim(),
    tonGiao:          document.getElementById('nk_tongiao').value.trim(),
    quocTich:         document.getElementById('nk_quoctich').value.trim(),
    queQuan:          document.getElementById('nk_que').value.trim(),
    trinhDoHocVan:    document.getElementById('nk_hocvan').value.trim(),
    nghe:             document.getElementById('nk_nghe').value.trim(),
    noiLamViec:       document.getElementById('nk_noilamviec').value.trim(),
    diaChiThuongTru:  document.getElementById('nk_dctt').value.trim(),
    noiOHienTai:      document.getElementById('nk_noht').value.trim()
  };
  const requiredFields = [
    { field: data.ten, name: 'Họ tên' },
    { field: data.ngaySinh, name: 'Ngày sinh' },
    { field: data.gioiTinh, name: 'Giới tính' },
    { field: data.sdt, name: 'Số điện thoại' },
    { field: data.noiSinh, name: 'Nơi sinh' },
    { field: data.cccd, name: 'Số CCCD' },
    { field: data.cccdNgayCap, name: 'Ngày cấp CCCD' },
    { field: data.cccdNoiCap, name: 'Nơi cấp CCCD' },
    { field: data.danToc, name: 'Dân tộc' },
    { field: data.tonGiao, name: 'Tôn giáo' },
    { field: data.quocTich, name: 'Quốc tịch' },
    { field: data.queQuan, name: 'Nguyên quán' },
    { field: data.trinhDoHocVan, name: 'Trình độ học vấn' },
    { field: data.nghe, name: 'Nghề nghiệp' },
    { field: data.diaChiThuongTru, name: 'Địa chỉ thường trú' },
    { field: data.noiOHienTai, name: 'Nơi ở hiện tại' },    
  ];

  const missingFields = requiredFields.filter(f => !f.field).map(f => f.name);

  if (missingFields.length > 0) {
    alert("Vui lòng điền đầy đủ các trường bắt buộc (*):\n");
    return;
  }

  const res = await ApiService.saveResident(data);
  if (res.success) {
    alert("Lưu nhân khẩu thành công!");
    loadData();
    hideDetailView();
  } else {
    alert("Lỗi khi lưu nhân khẩu!");
  }
}

// CHUYỂN ĐI / KHAI TỬ
function showMoveResidentForm(hkId, nkId) {
  const r = residents.find(x => x.id === nkId);
  const contentHtml = `
    <h3>Chuyển đi / Khai tử: ${r.ten}</h3>
    <div class="form-group">
        <label>Loại:</label>
        <select id="moveType">
            <option value="chuyenDi">Chuyển đi</option>
            <option value="quaDoi">Qua đời</option>
        </select>
    </div>
    <div class="form-group"><label>Ngày:</label><input type="date" id="moveDate"></div>
    <div class="form-group"><label>Ghi chú/Nơi đến:</label><input type="text" id="moveNote"></div>
    <div class="form-actions"><button class="btn danger" onclick="saveMoveResident('${nkId}')">Xác nhận</button></div>
    `;
  showDetailView("Thay đổi trạng thái", contentHtml, true);
}

async function saveMoveResident(nkId) {
  const note = document.getElementById('moveNote').value;
  const type = document.getElementById('moveType').value;
  const date = document.getElementById('moveDate').value;

  const r = residents.find(x => x.id === nkId);
  if (r) {
    const newData = { ...r, ghiChu: `${type === 'quaDoi' ? 'Mất' : 'Chuyển'} ngày ${date}. ${note}` };
    await ApiService.saveResident(newData);
    loadData();
    hideDetailView();
  }
}


// ===== 3. TẠM TRÚ / TẠM VẮNG =====
function renderTemp(list = tempResidents) {
  const tb = document.querySelector("#tempTable tbody");
  tb.innerHTML = "";
  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Không có dữ liệu</td></tr>";
    return;
  }
  list.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.ten}</td><td>${formatDate(t.ngaySinh)}</td><td>${t.gioiTinh}</td><td>${t.queQuan}</td><td style="text-align:right">${t.thoiHanTamTru}</td>
    <td>
        <button class='btn small primary' onclick="showTempDetail('${t.id}')">Chi tiết</button>
        <button class='btn small success' onclick="showTempForm('${t.id}')">Sửa</button>
        <button class='btn small danger' onclick="deleteTemp('${t.id}')">Xóa</button>
    </td>`;
    tb.appendChild(tr);
  });
}

// Hàm xem chi tiết tạm trú (đầy đủ thông tin)
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
        <div class="info-item-row"><label>Số CCCD</label><span>${t.cccd}</span></div>
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

// Cập nhật: Form tạm trú hỗ trợ chỉnh sửa
function showTempForm(id = null) {
  const isEdit = id !== null;
  const t = isEdit ? tempResidents.find(x => x.id === id) : {};

  const contentHtml = `
    <h4>Thông tin cơ bản</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="tmp_ten" value="${t.ten || ''}"></div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="tmp_ns" value="${t.ngaySinh || ''}"></div>
        <div class="form-group"><label>Giới tính:<span style="color:red">*</span></label><select id="tmp_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
        <div class="form-group"><label>Số điện thoại:<span style="color:red">*</span></label><input id="tmp_sdt" value="${t.sdt || ''}"></div>
        <div class="form-group"><label>Email:</label><input type="email" id="tmp_email" value="${t.email || ''}"></div>
        <div class="form-group"><label>Nơi sinh:<span style="color:red">*</span></label><input id="tmp_noisinh" value="${t.noiSinh || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Giấy tờ tùy thân</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Số CCCD:<span style="color:red">*</span></label><input id="tmp_cccd" value="${t.cccd || ''}"></div>
        <div class="form-group"><label>Ngày cấp:<span style="color:red">*</span></label><input type="date" id="tmp_cccd_nc" value="${t.cccdNgayCap || ''}"></div>
        <div class="form-group full-width"><label>Nơi cấp:<span style="color:red">*</span></label><input id="tmp_cccd_noicap" value="${t.cccdNoiCap || ''}"></div>
    </div>
    
    
    <div class="form-grid-2">
        <div class="form-group"><label>Dân tộc:<span style="color:red">*</span></label><input id="tmp_dantoc" value="${t.danToc || 'Kinh'}"></div>
        <div class="form-group"><label>Tôn giáo:<span style="color:red">*</span></label><input id="tmp_tongiao" value="${t.tonGiao || 'Không'}"></div>
        <div class="form-group"><label>Quốc tịch:<span style="color:red">*</span></label><input id="tmp_quoctich" value="${t.quocTich || 'Việt Nam'}"></div>
        <div class="form-group"><label>Nguyên quán:<span style="color:red">*</span></label><input id="tmp_que" value="${t.queQuan || ''}"></div>
    </div>
    
    
    <div class="form-grid-2">
        <div class="form-group"><label>Trình độ học vấn:<span style="color:red">*</span></label><input id="tmp_hocvan" value="${t.trinhDoHocVan || ''}"></div>
        <div class="form-group"><label>Nghề nghiệp:<span style="color:red">*</span></label><input id="tmp_nghe" value="${t.nghe || ''}"></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="tmp_noilamviec" value="${t.noiLamViec || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Địa chỉ</h4>
    <div class="form-grid-2">
        <div class="form-group full-width"><label>Địa chỉ thường trú:<span style="color:red">*</span></label><input id="tmp_tt" value="${t.diaChiThuongTru || ''}"></div>
        <div class="form-group full-width"><label>Nơi tạm trú:<span style="color:red">*</span></label><input id="tmp_noio" value="${t.noiTamTru || ''}"></div>
    </div>
    
    <h4 style="margin-top: 20px;">Thông tin tạm trú</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Ngày đăng ký:<span style="color:red">*</span></label><input type="date" id="tmp_ngaydk" value="${t.ngayDangKy || ''}"></div>
        <div class="form-group"><label>Đến ngày:    <span style="color:red">*</span></label><input type="date" id="tmp_th" value="${t.denNgay || ''}" ></div>
    </div>
    
    <div class="form-actions">
        <button class="btn success" onclick="saveTemp('${id}')">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
    `;
  showDetailView(isEdit ? "Sửa thông tin tạm trú" : "Đăng ký tạm trú", contentHtml, true);
  if (t.gioiTinh) document.getElementById('tmp_gt').value = t.gioiTinh;
}

async function saveTemp(id) {
  const data = {
    id:               id !== 'null' ? id : null,
    ten:              document.getElementById('tmp_ten').value.trim(),
    ngaySinh:         document.getElementById('tmp_ns').value,
    gioiTinh:         document.getElementById('tmp_gt').value,
    sdt:              document.getElementById('tmp_sdt').value.trim(),
    email:            document.getElementById('tmp_email').value.trim(),
    noiSinh:          document.getElementById('tmp_noisinh').value.trim(),
    cccd:             document.getElementById('tmp_cccd').value.trim(),
    cccdNgayCap:      document.getElementById('tmp_cccd_nc').value,
    cccdNoiCap:       document.getElementById('tmp_cccd_noicap').value.trim(),
    danToc:           document.getElementById('tmp_dantoc').value.trim(),
    tonGiao:          document.getElementById('tmp_tongiao').value.trim(),
    quocTich:         document.getElementById('tmp_quoctich').value.trim(),
    queQuan:          document.getElementById('tmp_que').value.trim(),
    trinhDoHocVan:    document.getElementById('tmp_hocvan').value.trim(),
    nghe:             document.getElementById('tmp_nghe').value.trim(),
    noiLamViec:       document.getElementById('tmp_noilamviec').value.trim(),
    diaChiThuongTru:  document.getElementById('tmp_tt').value.trim(),
    noiTamTru:        document.getElementById('tmp_noio').value.trim(),
    ngayDangKy:       document.getElementById('tmp_ngaydk').value || new Date().toISOString().split('T')[0],
    denNgay:          document.getElementById('tmp_th').value
  };

  // Validate all required fields (all except email and noiLamViec)
  const requiredFields = [
    { field: data.ten, name: 'Họ tên' },
    { field: data.ngaySinh, name: 'Ngày sinh' },
    { field: data.gioiTinh, name: 'Giới tính' },
    { field: data.sdt, name: 'Số điện thoại' },
    { field: data.noiSinh, name: 'Nơi sinh' },
    { field: data.cccd, name: 'Số CCCD' },
    { field: data.cccdNgayCap, name: 'Ngày cấp CCCD' },
    { field: data.cccdNoiCap, name: 'Nơi cấp CCCD' },
    { field: data.danToc, name: 'Dân tộc' },
    { field: data.tonGiao, name: 'Tôn giáo' },
    { field: data.quocTich, name: 'Quốc tịch' },
    { field: data.queQuan, name: 'Nguyên quán' },
    { field: data.trinhDoHocVan, name: 'Trình độ học vấn' },
    { field: data.nghe, name: 'Nghề nghiệp' },
    { field: data.diaChiThuongTru, name: 'Địa chỉ thường trú' },
    { field: data.noiTamTru, name: 'Nơi tạm trú' },
    { field: data.ngayDangKy, name: 'Ngày đăng ký' },
    { field: data.denNgay, name: 'Đến ngày' }
  ];

  const missingFields = requiredFields.filter(f => !f.field).map(f => f.name);

  if (missingFields.length > 0) {
    alert("Vui lòng điền đầy đủ các trường bắt buộc (*):\n");
    return;
  }

  await ApiService.saveTempResident(data);
  loadData();
  hideDetailView();
}

async function deleteTemp(id) {
  if (confirm("Xóa tạm trú?")) {
    await ApiService.deleteTempResident(id);
    loadData();
  }
}

function renderAbsent(list = absentResidents) {
  const tb = document.querySelector("#absentTable tbody");
  tb.innerHTML = "";
  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Không có dữ liệu</td></tr>";
    return;
  }
  list.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.ten}</td><td>${formatDate(t.ngaySinh)}</td><td>${t.gioiTinh}</td><td>${t.cccd}</td><td>${t.noiChuyenDen}</td>
    <td>
        <button class='btn small primary' onclick="showAbsentDetail('${t.id}')">Chi tiết</button>
        <button class='btn small success' onclick="showAbsentForm('${t.id}')">Sửa</button>
        <button class='btn small danger' onclick="deleteAbsent('${t.id}')">Xóa</button>
    </td>`;
    tb.appendChild(tr);
  });
}

// Hàm xem chi tiết tạm vắng (có nút sửa)
function showAbsentDetail(id) {
  const t = absentResidents.find(x => x.id === id);
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
        <div class="info-item-row full-width" style="border-top: 2px solid #e74c3c; margin-top: 10px; padding-top: 10px;"><label><strong>Nơi chuyển đến</strong></label><span><strong>${t.noiChuyenDen}</strong></span></div>
        <div class="info-item-row"><label>Ngày đăng ký</label><span>${formatDate(t.ngayDangKy)}</span></div>
        <div class="info-item-row"><label>Thời hạn</label><span>${t.thoiHanTamVang || 'N/A'}</span></div>
    </div>
    <div class="form-actions"><button class="btn success" onclick="showAbsentForm('${t.id}')">Chỉnh sửa</button></div>
    `;
  showDetailView("Chi tiết tạm vắng", contentHtml);
}
function showAbsentForm(id = null) {
  const isEdit = id !== 'null' && id !== null;
  const t = isEdit ? absentResidents.find(x => x.id === id) : {};

  // Form HTML (Common part)
  const formHtml = `
    <!-- Hidden input để lưu ID nhân khẩu đã chọn -->
    <input type="hidden" id="abs_selected_id" value="${t.nhanKhauId || ''}">
    
    <!-- Div bao quanh form, ban đầu ẩn nếu là thêm mới -->
    <div id="abs_resident_info" style="display: ${isEdit ? 'block' : 'none'};">
      <div class="resident-info-display">
        <h4>Thông tin người đăng ký</h4>
        <div class="info-grid">
          <div class="info-field"><label>Họ tên:</label> <span id="info_ten">${t.ten || ''}</span></div>
          <div class="info-field"><label>Ngày sinh:</label> <span id="info_ns">${formatDate(t.ngaySinh) || ''}</span></div>
          <div class="info-field"><label>Giới tính:</label> <span id="info_gt">${t.gioiTinh || ''}</span></div>
          <div class="info-field"><label>CCCD:</label> <span id="info_cccd">${t.cccd || ''}</span></div>
          <div class="info-field"><label>Số điện thoại:</label> <span id="info_sdt">${t.sdt || 'N/A'}</span></div>
          <div class="info-field"><label>Hộ khẩu:</label> <span id="info_hk">${t.hoKhau || 'N/A'}</span></div>
        </div>
      </div>
      
      <div class="section-divider">
        <h4 style="color: #e74c3c; margin-top: 0;">Thông tin tạm vắng</h4>
      </div>
      
      <div class="form-grid-2">
        <div class="form-group">
          <label>Ngày đăng ký:<span style="color:red">*</span></label>
          <input type="date" id="abs_ngay" value="${t.ngayDangKy || new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>Thời hạn tạm vắng:<span style="color:red">*</span></label>
          <input type="text" id="abs_th" value="${t.thoiHanTamVang || ''}" placeholder="VD: 2 năm, 6 tháng">
        </div>
      </div>
      
      <div class="form-group">
        <label>Nơi chuyển đến:<span style="color:red">*</span></label>
        <input type="text" id="abs_den" value="${t.noiChuyenDen || ''}" placeholder="Nhập địa chỉ nơi chuyển đến">
      </div>
      
      <div class="form-group">
        <label>Lý do:</label>
        <input type="text" id="abs_lydo" value="${t.lyDo || ''}">
      </div>
      
      <div class="form-actions">
        <button class="btn success" onclick="saveAbsent('${id}')">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
      </div>
    </div>
  `;

  // Search Part
  const searchHtml = `
    <h4>Tìm kiếm nhân khẩu</h4>
    <div class="form-group" style="position: relative;">
      <label>Tìm theo tên:<span style="color:red">*</span></label>
      <input type="text" id="abs_search" placeholder="Nhập tên người cần đăng ký tạm vắng..." 
             oninput="searchResidentsForAbsence(this.value)" autocomplete="off">
      <div id="abs_search_results" class="search-results"></div>
    </div>
  `;

  // TERNARY OPERATOR: Split content based on isEdit
  const contentHtml = isEdit ? formHtml : (searchHtml + formHtml);

  showDetailView(isEdit ? "Sửa thông tin tạm vắng" : "Đăng ký tạm vắng", contentHtml, true);
}

// Hàm tìm kiếm nhân khẩu cho form tạm vắng (Sửa logic lọc)
function searchResidentsForAbsence(query) {
  const searchResults = document.getElementById('abs_search_results');

  if (!query || query.trim().length < 1) { // Cho phép tìm từ 1 ký tự để dễ test
    searchResults.style.display = 'none';
    return;
  }

  const lowerQuery = query.toLowerCase().trim();

  // Tìm trong cả residents (Thường trú - chưa chuyển đi/mất) và tempResidents
  // Lọc bỏ những người đã có ghi chú "Đã qua đời" hoặc "Chuyển đi"
  const availableResidents = residents.filter(r => !r.ghiChu || (!r.ghiChu.includes('qua đời') && !r.ghiChu.includes('Chuyển đi')));
  
  const allPeople = [
    ...availableResidents.map(r => ({ ...r, source: 'resident' })),
    ...tempResidents.map(t => ({ ...t, source: 'temp' }))
  ];

  const matches = allPeople.filter(p =>
    p.ten.toLowerCase().includes(lowerQuery)
  ).slice(0, 10); // Giới hạn 10 kết quả

  if (matches.length === 0) {
    searchResults.innerHTML = '<div class="search-result-item" style="color: #999;">Không tìm thấy kết quả</div>';
    searchResults.style.display = 'block';
    return;
  }

  searchResults.innerHTML = matches.map(person => `
    <div class="search-result-item" onclick="selectResidentForAbsence('${person.id}', '${person.source}')">
      <strong>${person.ten}</strong> - ${person.cccd || 'Chưa có CCCD'} 
      <br><small style="color: #666;">Ngày sinh: ${formatDate(person.ngaySinh)} | ${person.source === 'temp' ? 'Tạm trú' : 'Thường trú'}</small>
    </div>
  `).join('');

  searchResults.style.display = 'block';
}

// Hàm chọn nhân khẩu từ kết quả tìm kiếm
function selectResidentForAbsence(personId, source) {
  const person = source === 'temp'
    ? tempResidents.find(t => t.id === personId)
    : residents.find(r => r.id === personId);

  if (!person) return;

  // Ẩn kết quả tìm kiếm
  document.getElementById('abs_search_results').style.display = 'none';
  // Hiển thị tên người được chọn vào ô tìm kiếm
  document.getElementById('abs_search').value = person.ten;

  // Điền ID vào hidden input
  // Ưu tiên lấy realId (ID trong DB) nếu có, nếu không thì lấy id chuỗi (NK...)
  document.getElementById('abs_selected_id').value = person.realId || personId;

  // Điền thông tin hiển thị
  document.getElementById('info_ten').textContent = person.ten;
  document.getElementById('info_ns').textContent = formatDate(person.ngaySinh);
  document.getElementById('info_gt').textContent = person.gioiTinh;
  document.getElementById('info_cccd').textContent = person.cccd || 'N/A';
  document.getElementById('info_sdt').textContent = person.sdt || 'N/A';
  document.getElementById('info_hk').textContent = person.hoKhauId || 'N/A';

  // Hiển thị phần form nhập liệu bên dưới (quan trọng)
  document.getElementById('abs_resident_info').style.display = 'block';
  
  // Set ngày đăng ký mặc định là hôm nay
  if(!document.getElementById('abs_ngay').value) {
      document.getElementById('abs_ngay').value = new Date().toISOString().split('T')[0];
  }
}

async function saveAbsent(id) {
  const selectedId = document.getElementById('abs_selected_id').value;

  if (!selectedId) {
    alert('Vui lòng tìm và chọn một người để đăng ký tạm vắng!');
    return;
  }

  const data = {
    id: id !== 'null' ? id : null,
    nhanKhauId: selectedId,
    ngayDangKy: document.getElementById('abs_ngay').value || new Date().toISOString().split('T')[0],
    thoiHanTamVang: document.getElementById('abs_th').value.trim(),
    noiChuyenDen: document.getElementById('abs_den').value.trim()
  };

  // Validate required fields
  if (!data.ngayDangKy || !data.thoiHanTamVang || !data.noiChuyenDen) {
    alert('Vui lòng điền đầy đủ các trường bắt buộc (*)!');
    return;
  }

  await ApiService.saveAbsentResident(data);
  loadData();
  hideDetailView();
}

async function deleteAbsent(id) {
  if (confirm("Xóa tạm vắng?")) {
    await ApiService.deleteAbsentResident(id);
    loadData();
  }
}

function renderRewards() {
  const tb = document.querySelector("#rewardTable tbody");
  tb.innerHTML = "";
  rewards.forEach(r => {
    tb.innerHTML += `<tr><td>${r.id}</td><td>${r.loai}</td><td>${r.giaTri}</td><td>-</td><td><button class="btn small">Sửa</button></td></tr>`;
  });
}


// ===== THỐNG KÊ (Yêu cầu của bạn) =====
function calculateAge(dobString) {
  if (!dobString) return -1;
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

function updateStats(filterType = 'gender') {
  document.querySelectorAll('.stats-filters .btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick') === `updateStats('${filterType}')`) {
      btn.classList.add('active');
    }
  });

  let stats = {};
  let labels = [];
  let data = [];

  const totalHouseholds = households.length;
  // Chỉ đếm nhân khẩu đang thường trú (không có ghi chú đặc biệt)
  const totalResidents = residents.filter(r => !r.ghiChu || r.ghiChu === "Chủ hộ").length;
  const totalTemp = tempResidents.length;
  const totalAbsent = absentResidents.length;

  const summaryHtml = `<p><b>Tổng số hộ khẩu:</b> ${totalHouseholds} | <b>Tổng số nhân khẩu (đang thường trú):</b> ${totalResidents} | <b>Tổng số tạm trú:</b> ${totalTemp} | <b>Tổng số tạm vắng:</b> ${totalAbsent}</p>`;

  if (filterType === 'gender') {
    stats = {
      "Nam": residents.filter(r => r.gioiTinh === "Nam" && (!r.ghiChu || r.ghiChu === "Chủ hộ")).length,
      "Nữ": residents.filter(r => r.gioiTinh === "Nữ" && (!r.ghiChu || r.ghiChu === "Chủ hộ")).length,
    };
    labels = Object.keys(stats);
    data = Object.values(stats);
  }
  else if (filterType === 'ageGroup') {
    stats = {
      "Mầm non (0-2)": 0,
      "Mẫu giáo (3-5)": 0,
      "Cấp 1 (6-10)": 0,
      "Cấp 2 (11-14)": 0,
      "Cấp 3 (15-17)": 0,
      "Lao động (18-60)": 0,
      "Nghỉ hưu (>60)": 0
    };
    residents.forEach(r => {
      const age = calculateAge(r.ngaySinh);
      if (age < 0 || r.ghiChu) return;
      if (age >= 0 && age <= 2) stats["Mầm non (0-2)"]++;
      else if (age >= 3 && age <= 5) stats["Mẫu giáo (3-5)"]++;
      else if (age >= 6 && age <= 10) stats["Cấp 1 (6-10)"]++;
      else if (age >= 11 && age <= 14) stats["Cấp 2 (11-14)"]++;
      else if (age >= 15 && age <= 17) stats["Cấp 3 (15-17)"]++;
      else if (age >= 18 && age <= 60) stats["Lao động (18-60)"]++;
      else if (age > 60) stats["Nghỉ hưu (>60)"]++;
    });
    labels = Object.keys(stats);
    data = Object.values(stats);
  }
  else if (filterType === 'residence') {
    stats = {
      "Thường trú": totalResidents,
      "Tạm trú": totalTemp,
      "Tạm vắng": totalAbsent,
    };
    labels = Object.keys(stats);
    data = Object.values(stats);
  }

  document.getElementById("statsSummary").innerHTML = summaryHtml;

  const chart = document.getElementById("chart");
  const chartLabels = document.getElementById("chartLabels");
  chart.innerHTML = "";
  chartLabels.innerHTML = "";

  const maxVal = Math.max(...data, 1);

  data.forEach((val, index) => {
    const barHeight = (val / maxVal) * 100;
    chart.innerHTML += `
      <div class='bar' style='height:${barHeight}%'>
        <span>${val}</span>
      </div>`;
    chartLabels.innerHTML += `<div class='bar-label'>${labels[index]}</div>`;
  });
}


// ===== HELPER FUNCTIONS =====
function showDetailView(title, contentHtml, isForm = false) {
  detailViewTitle.textContent = title;
  detailViewContent.innerHTML = contentHtml;
  detailView.style.display = "flex";
  isDetailDirty = false;
  if (isForm) {
    detailViewContent.querySelectorAll("input, select").forEach(i => i.oninput = () => isDetailDirty = true);
  }
}
function hideDetailView() { detailView.style.display = "none"; isDetailDirty = false; }
function cancelForm() {
  if (isDetailDirty) showConfirmModal("Hủy bỏ thay đổi?", () => hideDetailView());
  else hideDetailView();
}
function showConfirmModal(msg, cb) {
  confirmModalMessage.textContent = msg;
  confirmModal.style.display = "flex";
  confirmModalConfirm.onclick = () => { confirmModal.style.display = "none"; cb(); };
  confirmModalCancel.onclick = () => confirmModal.style.display = "none";
}
detailViewBackBtn.onclick = cancelForm;

function formatDate(dateString) {
  if (!dateString || dateString === "N/A") return "N/A";
  try {
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      if (day && month && year) return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch (e) { return dateString; }
}
function formatDiaChi(diaChiObj) {
  if (!diaChiObj) return "";
  return [diaChiObj.soNha, diaChiObj.duong, diaChiObj.phuong, diaChiObj.quan, diaChiObj.tinh].filter(Boolean).join(', ');
}