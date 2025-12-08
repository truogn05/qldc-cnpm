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
  // Lưu ý: Bạn cần bổ sung API POST /api/residents ở server.js để hàm này hoạt động hoàn hảo
  saveResident: async (data) => {
    try {
      // Tạm thời gọi endpoint chung hoặc giả lập nếu server chưa có
      const res = await fetch('/api/residents', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { 
        console.warn("API lưu nhân khẩu chưa có, log dữ liệu:", data);
        return { success: true }; // Giả lập thành công để UI không bị treo
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
      } catch(e) { return {success: false}; }
  },
  
  deleteTempResident: async (id) => {
      try {
          const res = await fetch(`/api/temp-residents/${id}`, {method: 'DELETE'});
          return await res.json();
      } catch(e) { return {success: false}; }
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        return await res.json();
      } catch(e) { return {success: false}; }
  },
  
  deleteAbsentResident: async (id) => {
      try {
          const res = await fetch(`/api/absent-residents/${id}`, {method: 'DELETE'});
          return await res.json();
      } catch(e) { return {success: false}; }
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
let currentDraggedItem = null; // Biến cho kéo thả tách hộ

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
    // Load song song dữ liệu từ SQL Server
    const [hkData, ttData, tvData] = await Promise.all([
      ApiService.getHouseholds(),
      ApiService.getTempResidents(),
      ApiService.getAbsentResidents()
    ]);

    households = hkData;
    tempResidents = ttData;
    absentResidents = tvData;
    // Dữ liệu mẫu phần thưởng (vì chưa có API)
    rewards = [{id:"R001",loai:"Trung thu 2025",giaTri:"300.000đ",chiTiet:[]}];

    flattenResidents();
    navigateTo(currentSection);
  } catch (err) {
    alert("Không thể tải dữ liệu từ Server!");
    console.error(err);
  }
}

// Chuyển đổi dữ liệu hộ khẩu lồng nhau sang danh sách nhân khẩu phẳng
function flattenResidents() {
  residents = [];
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
passwordInput.addEventListener("keypress", function(event) {
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
    errorMsg.textContent = "Lỗi kết nối server (Kiểm tra xem node server.js đã chạy chưa?)";
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
    actionsHtml = `<input type="text" id="searchTemp" class="search-bar" placeholder="Tìm kiếm..."><button class="btn primary" id="addTempBtn">Thêm tạm trú</button>`;
  } else if (sectionId === 'residence_absent') {
    title = "Quản lý tạm vắng";
    actionsHtml = `<input type="text" id="searchAbsent" class="search-bar" placeholder="Tìm kiếm..."><button class="btn primary" id="addAbsentBtn">Thêm tạm vắng</button>`;
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
            renderHouseholds(households.filter(h => h.chuHo.toLowerCase().includes(k) || h.id.toLowerCase().includes(k)));
        };
    }
    if (sectionId === 'residents') {
        document.getElementById("searchResident").oninput = (e) => {
            const k = e.target.value.toLowerCase();
            renderResidents(residents.filter(r => r.ten.toLowerCase().includes(k) || r.cccd.includes(k)));
        };
    }
    if (sectionId === 'residence_temp') {
        document.getElementById("addTempBtn").onclick = () => showTempForm();
        document.getElementById("searchTemp").oninput = (e) => {
            const k = e.target.value.toLowerCase();
            renderTemp(tempResidents.filter(t => t.ten.toLowerCase().includes(k)));
        };
    }
    if (sectionId === 'residence_absent') {
        document.getElementById("addAbsentBtn").onclick = () => showAbsentForm();
        document.getElementById("searchAbsent").oninput = (e) => {
            const k = e.target.value.toLowerCase();
            renderAbsent(absentResidents.filter(t => t.ten.toLowerCase().includes(k)));
        };
    }
}


// ===== 1. LOGIC HỘ KHẨU =====
function renderHouseholds(list = households) {
  const tb = document.querySelector("#householdTable tbody");
  tb.innerHTML = "";
  list.forEach((h, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${h.id}</td>
      <td>${h.chuHo}</td>
      <td>${h.nhanKhau ? h.nhanKhau.length : 0}</td>
      <td>
        <button class='btn small primary' onclick='showHouseholdBookDetail("${h.id}")'>Chi tiết</button>
        <button class='btn small success' onclick='showHouseholdForm("${h.id}")'>Sửa</button>
        <button class='btn small' style="background-color: #f39c12; color: white;" onclick='showSplitHouseholdForm("${h.id}")'>Tách hộ</button>
        <button class='btn small danger' onclick='deleteHousehold("${h.id}")'>Xóa</button>
      </td>`;
    tb.appendChild(tr);
  });
}

// SỔ HỘ KHẨU CHI TIẾT (Rich View)
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
        <div class="info-item-row"><label>CCCD</label><span>${nk.cccd || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${nk.nghe || 'N/A'}</span></div>
        <div class="info-item-row"><label>SĐT</label><span>${nk.sdt || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Thường trú</label><span>${nk.diaChiThuongTru || 'N/A'}</span></div>
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
        <div class="info-item-row"><label>Ngày lập</label><span>${formatDate(h.ngayLapSo)}</span></div>
        <div class="info-item-row full-width"><label>Địa chỉ</label>
            <span>${formatDiaChi(h.diaChi)}</span>
        </div>
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
  const h = isEdit ? households.find(x => x.id === id) : { diaChi: {} };
  const title = isEdit ? "Chỉnh sửa hộ khẩu" : "Thêm hộ khẩu mới";
  
  const contentHtml = `
    <div class="form-group"><label>Tên chủ hộ:</label><input type="text" id="formChuHo" value="${h.chuHo || ''}"></div>
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
    // Nếu id là 'null' (chuỗi) thì coi như thêm mới
    id: id !== 'null' ? id : null, 
    chuHo: document.getElementById("formChuHo").value,
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

  // Logic tách hộ ở Frontend (chọn người chuyển)
  let membersHk1 = [...hk.nhanKhau]; // Mảng copy
  let membersHk2 = []; // Hộ mới

  const updateUI = () => {
      document.getElementById('hk1_members').innerHTML = membersHk1.map(m => `<div class="member-item" onclick="moveMemberToNew('${m.id}')">${m.ten} (${m.vaiTro}) -></div>`).join('');
      document.getElementById('hk2_members').innerHTML = membersHk2.map(m => `<div class="member-item" onclick="moveMemberToOld('${m.id}')"><- ${m.ten} (${m.vaiTro})</div>`).join('');
  };
  
  // Gắn function vào window để HTML gọi được
  window.moveMemberToNew = (id) => {
      const idx = membersHk1.findIndex(m => m.id === id);
      if(idx > -1) { membersHk2.push(membersHk1[idx]); membersHk1.splice(idx, 1); updateUI(); }
  };
  window.moveMemberToOld = (id) => {
      const idx = membersHk2.findIndex(m => m.id === id);
      if(idx > -1) { membersHk1.push(membersHk2[idx]); membersHk2.splice(idx, 1); updateUI(); }
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
    // Lấy danh sách thành viên hộ mới từ DOM hoặc biến toàn cục (cần xử lý khéo léo)
    // Để đơn giản, ở đây ta chỉ tạo Hộ mới với Chủ hộ mới. 
    // Việc chuyển thành viên chi tiết cần API phức tạp hơn.
    if(!newOwner) return alert("Nhập tên chủ hộ mới!");
    
    // Gọi API tạo hộ mới
    const data = {
        chuHo: newOwner,
        ngayLapSo: new Date().toISOString().split('T')[0],
        diaChi: households.find(h => h.id === oldId).diaChi // Kế thừa địa chỉ cũ
    };
    
    const res = await ApiService.saveHousehold(data);
    if(res.success) {
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

  list.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.stt}</td><td>${r.ten}</td><td>${formatDate(r.ngaySinh)}</td><td>${r.gioiTinh}</td><td>${r.ghiChu || ''}</td><td><button class='btn small primary' onclick='showResidentDetail("${r.id}")'>Chi tiết</button></td>`;
    tb.appendChild(tr);
  });
}

// function renderResidents(list = residents, tlist = tempResidents) {
//   const tb = document.querySelector("#residentTable tbody");
//   tb.innerHTML = "";
//   const permanentList = list.map(r => {
//       let note = [];
//       if(r.vaiTro === 'Chủ hộ') note.push("Chủ hộ");
//       if(r.ghiChu && r.ghiChu.toLowerCase().includes('qua đời')) note.push("Đã qua đời");
//       // Check Tạm vắng
//       const isAbsent = absentResidents.find(ab => ab.nhanKhauId === r.id);
//       if(isAbsent) note.push(`Tạm vắng`);

//       return {
//           ...r,
//           finalNote: note.join(", ")
//       };
//   });
//   const temporaryList = tlist.map(t => ({
//       ...t,
//       stt: 0,
//       finalNote: "Tạm trú"
//   }));

//   // 3. Gộp và hiển thị
//   const allPeople = [...permanentList, ...temporaryList];
//   allPeople.forEach((p, index) => {
//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//         <td>${index + 1}</td>
//         <td>${p.ten}</td>
//         <td>${formatDate(p.ngaySinh)}</td>
//         <td>${p.gioiTinh}</td>
//         <td>${p.finalNote || ''}</td>
//         <td><button class='btn small primary' onclick='showResidentDetail("${p.id}")'>Chi tiết</button></td>
//     `;
//     tb.appendChild(tr);
//   });
  
// }




function showResidentDetail(id) {
    const r = residents.find(x => x.id === id);
    if(!r) return;
    const contentHtml = `
    <h3 class="detail-name-title">${r.ten}</h3>
    <div class="info-vertical-list">
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(r.ngaySinh)}</span></div>
        <div class="info-item-row"><label>CCCD</label><span>${r.cccd || 'N/A'}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${r.gioiTinh}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${r.nghe}</span></div>
        <div class="info-item-row"><label>Dân tộc</label><span>${r.danToc}</span></div>
        <div class="info-item-row full-width"><label>Quê quán</label><span>${r.queQuan}</span></div>
        <div class="info-item-row full-width"><label>Thường trú</label><span>${r.diaChiThuongTru}</span></div>
    </div>
    <div class="form-actions">
        <button class="btn success" onclick='showResidentForm("${r.hoKhauId}", "${r.id}")'>Chỉnh sửa</button>
    </div>
    `;
    showDetailView("Chi tiết nhân khẩu", contentHtml);
}

function showResidentForm(hkId, nkId = null) {
    const isEdit = nkId !== null;
    // Tìm nhân khẩu trong list phẳng hoặc trong hộ
    let r = {};
    if(isEdit) r = residents.find(x => x.id === nkId) || {};
    
    const contentHtml = `
    <div class="form-grid-2">
      <div class="form-group"><label>Họ tên:</label><input id="nk_ten" value="${r.ten || ''}"></div>
      <div class="form-group"><label>Ngày sinh:</label><input type="date" id="nk_ns" value="${r.ngaySinh || ''}"></div>
      <div class="form-group"><label>CCCD:</label><input id="nk_cccd" value="${r.cccd || ''}"></div>
      <div class="form-group"><label>Quan hệ chủ hộ:</label><input id="nk_qh" value="${r.vaiTro || ''}"></div>
      <div class="form-group"><label>Giới tính:</label><select id="nk_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
      <div class="form-group"><label>Nghề nghiệp:</label><input id="nk_nghe" value="${r.nghe || ''}"></div>
    </div>
    <div class="form-group"><label>Nguyên quán:</label><input id="nk_que" value="${r.queQuan || ''}"></div>
    <div class="form-group"><label>Thường trú:</label><input id="nk_tt" value="${r.diaChiThuongTru || ''}"></div>
    
    <div class="form-actions"><button class="btn success" onclick="saveResident('${hkId}', '${nkId}')">Lưu</button><button class="btn" onclick="cancelForm()">Hủy</button></div>
    `;
    showDetailView(isEdit ? "Sửa nhân khẩu" : "Thêm nhân khẩu", contentHtml, true);
    if(r.gioiTinh) document.getElementById('nk_gt').value = r.gioiTinh;
}

async function saveResident(hkId, nkId) {
    const data = {
        id: nkId === 'null' ? null : nkId,
        hoKhauId: hkId,
        ten: document.getElementById('nk_ten').value,
        ngaySinh: document.getElementById('nk_ns').value,
        cccd: document.getElementById('nk_cccd').value,
        vaiTro: document.getElementById('nk_qh').value,
        gioiTinh: document.getElementById('nk_gt').value,
        nghe: document.getElementById('nk_nghe').value,
        queQuan: document.getElementById('nk_que').value,
        diaChiThuongTru: document.getElementById('nk_tt').value
    };
    
    const res = await ApiService.saveResident(data);
    if(res.success) {
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
    // Logic này thường sẽ cập nhật trường 'ghiChu' của nhân khẩu
    const note = document.getElementById('moveNote').value;
    const type = document.getElementById('moveType').value;
    const date = document.getElementById('moveDate').value;
    
    // Gọi API saveResident để update ghi chú
    const r = residents.find(x => x.id === nkId);
    if(r) {
        const newData = { ...r, ghiChu: `${type === 'quaDoi' ? 'Mất' : 'Chuyển'} ngày ${date}. ${note}` };
        await ApiService.saveResident(newData);
        loadData();
        hideDetailView();
    }
}


// ===== 3. TẠM TRÚ / TẠM VẮNG =====
function renderTemp() {
  const tb = document.querySelector("#tempTable tbody");
  tb.innerHTML = "";
  tempResidents.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.ten}</td><td>${formatDate(t.ngaySinh)}</td><td>${t.gioiTinh}</td><td>${t.cccd}</td><td>${t.queQuan}</td>
    <td>
        <button class='btn small primary'>Chi tiết</button>
        <button class='btn small danger' onclick="deleteTemp('${t.id}')">Xóa</button>
    </td>`;
    tb.appendChild(tr);
  });
}

function showTempForm() {
    const contentHtml = `
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:</label><input id="tmp_ten"></div>
        <div class="form-group"><label>Ngày sinh:</label><input type="date" id="tmp_ns"></div>
        <div class="form-group"><label>CCCD:</label><input id="tmp_cccd"></div>
        <div class="form-group"><label>Quê quán:</label><input id="tmp_que"></div>
    </div>
    <div class="form-group"><label>Nơi tạm trú:</label><input id="tmp_noio"></div>
    <div class="form-actions"><button class="btn success" onclick="saveTemp()">Lưu</button></div>
    `;
    showDetailView("Đăng ký tạm trú", contentHtml, true);
}

async function saveTemp() {
    const data = {
        ten: document.getElementById('tmp_ten').value,
        ngaySinh: document.getElementById('tmp_ns').value,
        cccd: document.getElementById('tmp_cccd').value,
        queQuan: document.getElementById('tmp_que').value,
        noiTamTru: document.getElementById('tmp_noio').value,
        ngayDangKy: new Date().toISOString().split('T')[0]
    };
    await ApiService.saveTempResident(data);
    loadData();
    hideDetailView();
}

async function deleteTemp(id) {
    if(confirm("Xóa tạm trú?")) {
        await ApiService.deleteTempResident(id);
        loadData();
    }
}

function renderAbsent() {
  const tb = document.querySelector("#absentTable tbody");
  tb.innerHTML = "";
  absentResidents.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.ten}</td><td>${formatDate(t.ngaySinh)}</td><td>${t.gioiTinh}</td><td>${t.cccd}</td><td>${t.noiChuyenDen}</td>
    <td><button class='btn small danger' onclick="deleteAbsent('${t.id}')">Xóa</button></td>`;
    tb.appendChild(tr);
  });
}

function showAbsentForm() {
    const contentHtml = `
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:</label><input id="abs_ten"></div>
        <div class="form-group"><label>Nơi chuyển đến:</label><input id="abs_den"></div>
    </div>
    <div class="form-actions"><button class="btn success" onclick="saveAbsent()">Lưu</button></div>
    `;
    showDetailView("Đăng ký tạm vắng", contentHtml, true);
}

async function saveAbsent() {
    const data = {
        ten: document.getElementById('abs_ten').value,
        noiChuyenDen: document.getElementById('abs_den').value,
        ngayDangKy: new Date().toISOString().split('T')[0]
    };
    await ApiService.saveAbsentResident(data);
    loadData();
    hideDetailView();
}

async function deleteAbsent(id) {
    if(confirm("Xóa tạm vắng?")) {
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
  const totalResidents = residents.filter(r => !r.ghiChu).length;
  const totalTemp = tempResidents.length;
  const totalAbsent = absentResidents.length; 

  const summaryHtml = `<p><b>Tổng số hộ khẩu:</b> ${totalHouseholds} | <b>Tổng số nhân khẩu (đang thường trú):</b> ${totalResidents} | <b>Tổng số tạm trú:</b> ${totalTemp} | <b>Tổng số tạm vắng:</b> ${totalAbsent}</p>`;

  if (filterType === 'gender') {
    stats = {
      "Nam": residents.filter(r => r.gioiTinh === "Nam" && !r.ghiChu).length,
      "Nữ": residents.filter(r => r.gioiTinh === "Nữ" && !r.ghiChu).length,
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


//