// ===== API SERVICE: Cầu nối Frontend - Backend =====
const ApiService = {
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
    } catch (e) { return { success: false }; }
  },

  deleteHousehold: async (id) => {
    try {
      const res = await fetch(`/api/households/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false }; }
  },

  getTempResidents: async () => {
    try {
      const res = await fetch('/api/temp-residents');
      return await res.json();
    } catch (e) { return []; }
  },

  getAbsentResidents: async () => {
    try {
      const res = await fetch('/api/absent-residents');
      return await res.json();
    } catch (e) { return []; }
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
    rewards = []; // Chưa có DB phần thưởng

    flattenResidents();
    navigateTo(currentSection);
  } catch (err) {
    alert("Không thể tải dữ liệu từ Server!");
    console.error(err);
  }
}

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
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelector(".nav-item[data-section='households']").classList.add("active");
  document.getElementById("residenceSub").classList.remove("show");
  document.getElementById("residenceMain").classList.remove("active");
};

document.querySelectorAll(".nav-item").forEach(it => {
  it.onclick = () => {
    const sectionId = it.dataset.section;
    if (it.id === "residenceMain") {
      document.getElementById("residenceSub").classList.toggle("show");
      return;
    }
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    it.classList.add("active");

    if (it.closest("#residenceSub")) {
      document.getElementById("residenceSub").classList.add("show");
      document.getElementById("residenceMain").classList.add("active");
    } else {
      document.getElementById("residenceSub").classList.remove("show");
      document.getElementById("residenceMain").classList.remove("active");
    }
    if (sectionId) navigateTo(sectionId);
  };
});

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
    case 'stats': updateStats('gender'); break; // Mặc định vào tab Giới tính
    case 'rewards': renderRewards(); break;
  }
}

function updateHeader(sectionId) {
  let title = "";
  let actionsHtml = "";
  if (sectionId === 'households') {
    title = "Quản lý hộ khẩu";
    actionsHtml = `<input type=\"text\" id=\"searchHousehold\" class=\"search-bar\" placeholder=\"Tìm kiếm...\"><button class=\"btn primary\" id=\"addHouseholdBtn\">Thêm hộ khẩu</button>`;
  } else if (sectionId === 'residents') {
    title = "Quản lý nhân khẩu";
    actionsHtml = `<input type=\"text\" id=\"searchResident\" class=\"search-bar\" placeholder=\"Tìm kiếm...\">`;
  } else if (sectionId === 'residence_temp') {
    title = "Quản lý tạm trú";
  } else if (sectionId === 'residence_absent') {
    title = "Quản lý tạm vắng";
  }

  headerTitle.textContent = title;
  headerActions.innerHTML = actionsHtml;

  if (sectionId === 'households') {
    document.getElementById("addHouseholdBtn").onclick = () => showHouseholdForm();
    document.getElementById("searchHousehold").oninput = (e) => {
      const k = e.target.value.toLowerCase();
      renderHouseholds(households.filter(h => h.chuHo.toLowerCase().includes(k) || h.id.toLowerCase().includes(k)));
    };
  }
}


// ===== THỐNG KÊ (ĐÃ CẬP NHẬT THEO LOGIC MỚI CỦA BẠN) =====

// Hàm hỗ trợ tính tuổi
function calculateAge(dobString) {
  if (!dobString) return -1;
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms); 
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

function updateStats(filterType = 'gender') {
  // Cập nhật trạng thái active cho nút filter
  document.querySelectorAll('.stats-filters .btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick') === `updateStats('${filterType}')`) {
      btn.classList.add('active');
    }
  });

  let stats = {};
  let labels = [];
  let data = [];
  let summaryHtml = "";
  
  const totalHouseholds = households.length;
  // Chỉ đếm nhân khẩu đang thường trú (không có ghi chú đặc biệt)
  const totalResidents = residents.filter(r => !r.ghiChu).length;
  const totalTemp = tempResidents.length;
  const totalAbsent = absentResidents.length; 

  summaryHtml = `<p><b>Tổng số hộ khẩu:</b> ${totalHouseholds} | <b>Tổng số nhân khẩu (đang thường trú):</b> ${totalResidents} | <b>Tổng số tạm trú:</b> ${totalTemp} | <b>Tổng số tạm vắng:</b> ${totalAbsent}</p>`;

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
      if (age < 0 || r.ghiChu) return; // Bỏ qua nếu ngày sinh không hợp lệ hoặc đã chuyển/mất
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
  
  // Vẽ biểu đồ
  const chart = document.getElementById("chart");
  const chartLabels = document.getElementById("chartLabels");
  chart.innerHTML = "";
  chartLabels.innerHTML = "";
  
  const maxVal = Math.max(...data, 1); // Tránh chia cho 0
  
  data.forEach((val, index) => {
    const barHeight = (val / maxVal) * 100;
    chart.innerHTML += `
      <div class='bar' style='height:${barHeight}%'>
        <span>${val}</span>
      </div>`;
    chartLabels.innerHTML += `<div class='bar-label'>${labels[index]}</div>`;
  });
}

// ===== CÁC HÀM RENDER & LOGIC KHÁC =====
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
            <h4>${nk.ten} (${nk.vaiTro})</h4>
            <div class="info-vertical-list">
                <div class="info-item-row"><label>Ngày sinh</label><span>${nk.ngaySinh}</span></div>
                <div class="info-item-row"><label>CCCD</label><span>${nk.cccd || 'N/A'}</span></div>
                <div class="info-item-row"><label>Nghề nghiệp</label><span>${nk.nghe || 'N/A'}</span></div>
                <div class="info-item-row full-width"><label>Thường trú</label><span>${nk.diaChiThuongTru || 'N/A'}</span></div>
            </div>
        </div>
    `).join('');

  const contentHtml = `
        <h3 class="book-title">Sổ: ${h.id}</h3>
        <div class="book-section">
            <h3>Thông tin chung</h3>
            <div class="info-vertical-list">
                <div class="info-item-row"><label>Chủ hộ</label><span>${h.chuHo}</span></div>
                <div class="info-item-row"><label>Ngày lập</label><span>${h.ngayLapSo || 'N/A'}</span></div>
                <div class="info-item-row full-width"><label>Địa chỉ</label>
                    <span>${h.diaChi.soNha}, ${h.diaChi.duong}, ${h.diaChi.phuong}, ${h.diaChi.quan}, ${h.diaChi.tinh}</span>
                </div>
            </div>
        </div>
        <div class="book-section">
             <h3>Thành viên</h3>
             <div class="book-members-list">${membersHtml || 'Trống'}</div>
        </div>
    `;
  showDetailView(`Chi tiết hộ khẩu`, contentHtml);
}

function showHouseholdForm() {
  const title = "Thêm hộ khẩu mới";
  const contentHtml = `
    <div class="form-group"><label>Tên chủ hộ:</label><input type="text" id="formChuHo"></div>
    <div class="form-grid-2">
      <div class="form-group"><label>Ngày lập sổ:</label><input type="date" id="formNgayLapSo"></div>
      <div class="form-group"><label>Số nhà:</label><input type="text" id="formSoNha"></div>
    </div>
    <div class="form-group"><label>Đường/Phố:</label><input type="text" id="formDuong"></div>
    <div class="form-grid-3">
      <div class="form-group"><label>Phường/Xã:</label><input type="text" id="formPhuong"></div>
      <div class="form-group"><label>Quận/Huyện:</label><input type="text" id="formQuan"></div>
      <div class="form-group"><label>Tỉnh/TP:</label><input type="text" id="formTinh"></div>
    </div>
    <div class="form-actions"><button class="btn success" onclick="saveHousehold()">Lưu</button><button class="btn" onclick="cancelForm()">Hủy</button></div>
  `;
  showDetailView(title, contentHtml, true);
}

async function saveHousehold() {
  const data = {
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
    alert("Thêm thành công!");
    loadData();
    hideDetailView();
  } else {
    alert("Có lỗi xảy ra (Xem console để biết thêm)!");
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

function renderResidents() {
  const tb = document.querySelector("#residentTable tbody");
  tb.innerHTML = "";
  residents.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.stt}</td><td>${r.ten}</td><td>${r.ngaySinh}</td><td>${r.gioiTinh}</td><td>${r.ghiChu || ''}</td><td><button class='btn small primary'>Chi tiết</button></td>`;
    tb.appendChild(tr);
  });
}

function renderTemp() {
  const tb = document.querySelector("#tempTable tbody");
  tb.innerHTML = "";
  tempResidents.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.ten}</td><td>${t.ngaySinh}</td><td>${t.gioiTinh}</td><td>${t.cccd}</td><td>${t.queQuan}</td><td><button class='btn small'>Chi tiết</button></td>`;
    tb.appendChild(tr);
  });
}

function renderAbsent() {
  const tb = document.querySelector("#absentTable tbody");
  tb.innerHTML = "";
  absentResidents.forEach((t, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${t.ten}</td><td>${t.ngaySinh}</td><td>${t.gioiTinh}</td><td>${t.cccd}</td><td>${t.noiChuyenDen}</td><td><button class='btn small'>Chi tiết</button></td>`;
    tb.appendChild(tr);
  });
}

function renderRewards() {
  document.querySelector("#rewardTable tbody").innerHTML = "";
}

// ===== HELPER FUNCTIONS =====
function showDetailView(title, contentHtml, isForm = false) {
  detailViewTitle.textContent = title;
  detailViewContent.innerHTML = contentHtml;
  detailView.style.display = "flex";
  isDetailDirty = false;
  if (isForm) {
    detailViewContent.querySelectorAll("input").forEach(i => i.oninput = () => isDetailDirty = true);
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