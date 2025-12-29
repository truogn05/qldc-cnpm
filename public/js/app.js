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
  getHouseholdHistory: async (id) => {
    try {
      const res = await fetch(`/api/history/households/${id}`);
      if (!res.ok) throw new Error('Lỗi server');
      return await res.json();
    } catch (e) { console.error(e); return []; }
  },
  saveHistory: async (data) => {
    try {
      const res = await fetch('/api/history/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  },
  addHousehold: async (data) => {
    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  },
  splitHousehold: async (data) => {
    try {
      const res = await fetch('/api/households/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  },
  editHousehold: async (Data) => {
    //const id =data.id;
    const { id, ...data } = Data;
    try {
      //console.log(data);
      const res = await fetch(`/api/households/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result.message || 'Cập nhật thông tin hộ khẩu thất bại'
        };
      }

      return result;
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  },
  saveChangeOwner: async (Data) => {
    //const id =data.id;
    const { id, ...data } = Data;
    try {
      //console.log(data);
      const res = await fetch(`/api/households/owner/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: result.message || 'Thay đổi thông tin chủ hộ thất bại'
        };
      }

      return result;
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
  },

  deleteHousehold: async (id) => {
    try {
      const res = await fetch(`/api/households/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false }; }
  },
  addResident: async (data) => {
    try {
      const res = await fetch('/api/households/resident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
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
  getDeath: async (id) => {
    try {
      const res = await fetch(`/api/death/${id}`);
      if (!res.ok) throw new Error('Lỗi server');
      return await res.json();
    } catch (e) { console.error(e); return []; }
  },
  saveDeath: async (data) => {
    try {
      const res = await fetch('/api/death', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (e) {
      //console.warn("API lưu nhân khẩu chưa có, log dữ liệu:", data);
      return { success: true, message: "Lỗi khi đăng ký khai tử" };
    }
  },
  deleteResident: async (id) => {
    try {
      const res = await fetch(`/api/residents/${id}`, { method: 'DELETE' });
      return await res.json();
    } catch (e) { return { success: false, message: e.message }; }
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
  saveTempTT: async (Data) => {
    const { id, ...data } = Data;
    try {
      const res = await fetch(`/api/temp-residents/${id}`, {
        method: 'PUT',
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
  },

  getRewards: async () => {
    try {
      const res = await fetch("/api/rewards");
      return await res.json();
    }
    catch (e) { return []; }
  },
  addReward: async (data) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return await res.json();
    }
    catch (e) {

      return { success: false };
    }
  },
  saveReward: async (data) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return await res.json();
    }
    catch (e) {

      return { success: false };
    }
  },
  deleteReward: async (id) => {
    try {
      const res = await fetch(`/api/reward/${id}`, { method: 'DELETE' });
      return await res.json();
    }
    catch (e) { return { success: false }; }
  },

  getTotalLe: async (id) => {
    try {
      const res = await fetch(`/api/rewards/${id}/total-le`);
      return await res.json();
    }
    catch (e) { return []; }
  },
  getDetailLe: async (id) => {
    try {
      const res = await fetch(`/api/rewards/${id}/detail-le`);
      return await res.json();
    }
    catch (e) { return []; }
  },
  getTotalHocTap: async (id) => {
    try {
      const res = await fetch(`/api/rewards/${id}/total-hoctap`);
      return await res.json();
    }
    catch (e) { return []; }
  },
  getDetailHocTap: async (id) => {
    try {
      const res = await fetch(`/api/rewards/${id}/detail-hoctap`);
      return await res.json();
    }
    catch (e) { return []; }
  },
  changeTT: async (data) => {
    const { idDot, id, value } = data;
    try {
      const res = await fetch(`/api/rewards/${idDot}/changeThanhTich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value })
      });
      // const res = await fetch(`/api/rewards/${idDot}/changeThanhTich`);
      return await res.json();
    }
    catch (e) { return { success: false }; }
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
let login = 0;
let detailHistory = [];
let renderLai = 0;
let hide = 1;
let state = {};

// Pagination state for each section
let paginationState = {
  residents: { currentPage: 1, rowsPerPage: 50 },
  temp: { currentPage: 1, rowsPerPage: 50 },
  absent: { currentPage: 1, rowsPerPage: 50 },
  households: { currentPage: 1, rowsPerPage: 50 }
};

// Store current filtered data for each section
let currentFilteredData = {
  residents: null,
  temp: null,
  absent: null,
  households: null
};

// ===== DOM ELEMENTS =====
const loginPage = document.getElementById("loginPage");
const app = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");
const logoutBtn = document.getElementById("logoutBtn");

// Intro screen elements
const introBackground = document.getElementById("introBackground");
const introText = document.getElementById("introText");
const loginModal = document.getElementById("loginModal");
const loginBox = document.querySelector(".login-box");

// ===== INTRO SCREEN INTERACTION =====
// Click anywhere on intro screen to show login modal
loginPage.addEventListener("click", function (e) {
  // Only open modal if it's not already open
  if (!loginPage.classList.contains("modal-open")) {
    loginPage.classList.add("modal-open");
    loginPage.style.cursor = "default";
  }
  // If modal is open and click is outside login box
  else if (!loginBox.contains(e.target)) {
    // Only close if both inputs are empty
    const usernameEmpty = usernameInput.value.trim() === "";
    const passwordEmpty = passwordInput.value.trim() === "";

    if (usernameEmpty && passwordEmpty) {
      closeLoginModal();
    }
  }
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    // Chỉ xử lý khi modal đang mở
    if (loginPage.classList.contains("modal-open")) {
      closeLoginModal();
      // const usernameEmpty = usernameInput.value.trim() === "";
      // const passwordEmpty = passwordInput.value.trim() === "";

      // // Chỉ close khi chưa nhập dữ liệu
      // if (usernameEmpty && passwordEmpty) {
      //   closeLoginModal();
      // }
    }
  }
});

// Prevent click inside login box from closing the modal
loginBox.addEventListener("click", function (e) {
  e.stopPropagation();
});

// Function to close login modal and return to intro
function closeLoginModal() {
  loginPage.classList.remove("modal-open");
  loginPage.style.cursor = "pointer";
  // Clear error message when closing
  errorMsg.textContent = "";
}

const mainView = document.getElementsByClassName("main-content-area")
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

const actionModal = document.getElementById("actionModal");
const actionList = document.getElementById("actionList");

let householdHTML = '';
let residentHTML = '';
let tempHTML = '';
let absentHTML = '';
let rewardHTML = '';

// ===== KHỞI TẠO DỮ LIỆU =====
async function loadData() {
  //showLoading("Đang tải dữ liệu");
  login = 0;
  detailHistory = [];
  //console.log("loadData");
  try {
    const [hkData, ttData, tvData, rwData] = await Promise.all([
      ApiService.getHouseholds(),
      ApiService.getTempResidents(),
      ApiService.getAbsentResidents(),
      ApiService.getRewards()
    ]);
    //Saved("Tải dữ liệu thành công", 1000);
    households = hkData || [];
    tempResidents = ttData || [];
    absentResidents = tvData || [];
    rewards = rwData || [];

    flattenResidents();
    isDetailDirty = false;


    //await delay(1000);
    await forceNavigateTo(currentSection);
    //navigateTo(currentSection);



  } catch (err) {
    fireError("Không thể tải dữ liệu từ Server!");

    console.error(err);
  }
}
async function loadTemps() {
  //showLoading("Đang tải dữ liệu");
  login = 0;
  detailHistory = [];

  try {

    tempResidents = await ApiService.getTempResidents() || [];
    isDetailDirty = false;
    //await delay(1000);
    await forceNavigateTo(currentSection);

  } catch (err) {
    fireError("Không thể tải dữ liệu từ Server!");

    console.error(err);
  }
}
async function loadAbsents() {
  //showLoading("Đang tải dữ liệu");
  login = 0;
  detailHistory = [];
  try {

    absentResidents = await ApiService.getAbsentResidents() || [];

    isDetailDirty = false;
    //await delay(1000);
    await forceNavigateTo(currentSection);
    //navigateTo(currentSection);
  } catch (err) {
    fireError("Không thể tải dữ liệu từ Server!");

    console.error(err);
  }
}
async function loadRewards() {
  //showLoading("Đang tải dữ liệu");
  login = 0;
  detailHistory = [];
  try {

    rewards = await ApiService.getRewards() || [];

    isDetailDirty = false;
    //await delay(1000);
    await forceNavigateTo(currentSection);
    //navigateTo(currentSection);
  } catch (err) {
    fireError("Không thể tải dữ liệu từ Server!");

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
      console.log("đăng nhập")
      Saved("Đăng nhập thành công", 1000);
      await delay(1000);
      //showLoading("Đang tải dữ liệu")
      loginPage.style.display = "none";
      app.style.display = "block";
      showLoading();

      await loadData();
      closeLoading();
    } else {
      fireError(data.message || "Đăng nhập thất bại");
      //errorMsg.textContent = data.message || "Đăng nhập thất bại";
    }
  } catch (e) {
    fireError("Lỗi kết nối server");
    console.error(e);
    //errorMsg.textContent = "Lỗi kết nối server";
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

    if (sectionId) setTimeout(() => {
      navigateTo(sectionId);
    }, 0);
  };
});

function resetMenu() {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("residenceSub").classList.remove("show");
  document.getElementById("residenceMain").classList.remove("active");
}

async function navigateTo(sectionId) {
  if (isDetailDirty) {
    showConfirmModal("Dữ liệu chưa lưu. Rời đi?", () => { isDetailDirty = false; forceNavigateTo(sectionId); });
    return;
  }
  forceNavigateTo(sectionId);
  //mainView[0].scrollTo({ top: 0 });//, behavior: 'smooth'
}

async function forceNavigateTo(sectionId) {
  if (currentSection != sectionId) showLoading();

  //closeLoading();
  // mainView.style.display = "flex";
  // mainViewContent.scrollTop = 0;
  if (hide) {
    hideDetailView();
  }
  hide = 1;
  detailHistory = [];
  if (sectionId == currentSection && login) {

    mainView[0].scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  login = 1;

  //console.log("forceNAV")

  updateHeader(sectionId);
  // paginationState[sectionId].currentPage = 1;
  // Reset filtered data when switching sections
  if (sectionId !== currentSection) {
    currentFilteredData.residents = null;
    currentFilteredData.households = null;
    currentFilteredData.temp = null;
    currentFilteredData.absent = null;

    paginationState.households.currentPage = 1;
    paginationState.residents.currentPage = 1;
    paginationState.temp.currentPage = 1;
    paginationState.absent.currentPage = 1;

    paginationState.households.rowsPerPage = 50;
    paginationState.residents.rowsPerPage = 50;
    paginationState.temp.rowsPerPage = 50;
    paginationState.absent.rowsPerPage = 50;
  }

  currentSection = sectionId;

  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const activeSection = document.getElementById(sectionId);
  if (activeSection) activeSection.classList.add("active");
  //await delay(100);
  delayy(300);
  switch (sectionId) {
    case 'households': await renderHouseholds(); break;
    case 'residents': await renderResidents(); break;
    case 'residence_temp': await renderTemp(); break;
    case 'residence_absent': await renderAbsent(); break;
    case 'stats': await updateStats('gender'); break;
    case 'rewards': await renderRewards(); break;
  }

  console.log("render xong");
  //await delay(5000);

  //closeLoading();


  mainView[0].scrollTo({ top: 0 });

}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function delayy(ms) {
  await delay(ms);
  closeLoading();
}
// ===== PAGINATION CONTROLS =====
function updatePaginationControls(section, totalPages, totalItems = 0) {
  const sectionId = {
    'residents': 'residents',
    'temp': 'residence_temp',
    'absent': 'residence_absent',
    'households': 'households'
  }[section];

  const sectionElement = document.getElementById(sectionId);
  if (!sectionElement) return;

  let paginationDiv = sectionElement.querySelector('.pagination-controls');

  if (!paginationDiv) {
    paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-controls';
    sectionElement.appendChild(paginationDiv);
  }

  // if (totalPages <= 1) {
  //   paginationDiv.innerHTML = '';
  //   return;
  // }

  const state = paginationState[section];
  const startItem = (state.currentPage - 1) * state.rowsPerPage + 1;
  const endItem = Math.min(state.currentPage * state.rowsPerPage, totalItems);

  paginationDiv.innerHTML = `
    <div class="pagination-info">
      Hiển thị ${startItem}-${endItem} / ${totalItems}
    </div>
    <div class="pagination-buttons">
      <button class="btn small" onclick="changePage('${section}', ${state.currentPage - 1})" 
              ${state.currentPage === 1 ? 'disabled' : ''}>← Trước</button>
      <span class="page-indicator">Trang ${state.currentPage} / ${totalPages}</span>
      <button class="btn small" onclick="changePage('${section}', ${state.currentPage + 1})"
              ${state.currentPage === totalPages ? 'disabled' : ''}>Sau →</button>
    </div>
    <div class="rows-per-page">
      Hiển thị: 
      <select onchange="changeRowsPerPage('${section}', this.value)">
        <option value="25" ${state.rowsPerPage === 25 ? 'selected' : ''}>25</option>
        <option value="50" ${state.rowsPerPage === 50 ? 'selected' : ''}>50</option>
        <option value="100" ${state.rowsPerPage === 100 ? 'selected' : ''}>100</option>
        <option value="200" ${state.rowsPerPage === 200 ? 'selected' : ''}>200</option>
        <option value="500" ${state.rowsPerPage === 500 ? 'selected' : ''}>500</option>
      </select>
    </div>
  `;
}

function changePage(section, newPage) {
  paginationState[section].currentPage = newPage;

  // Use filtered data if it exists, otherwise use default
  switch (section) {
    case 'residents':
      renderResidents(currentFilteredData.residents || residents);
      break;
    case 'temp':
      renderTemp(currentFilteredData.temp || tempResidents);
      break;
    case 'absent':
      renderAbsent(currentFilteredData.absent || absentResidents);
      break;
    case 'households':
      renderHouseholds(currentFilteredData.households || households);
      break;
  }
}

function changeRowsPerPage(section, newRows) {
  paginationState[section].rowsPerPage = parseInt(newRows);
  paginationState[section].currentPage = 1; // Reset to first page
  changePage(section, 1);
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
    actionsHtml = `<button class="btn primary" id="addRewardBtn" onclick="showRewardForm()">Thêm đợt thưởng</button>`;
  } else if (sectionId === 'stats') {
    title = "Thống kê dân cư";
  }

  headerTitle.textContent = title;
  headerActions.innerHTML = actionsHtml;

  attachHeaderEvents(sectionId);
}

function attachHeaderEvents(sectionId) {
  if (sectionId === 'households') {
    document.getElementById("addHouseholdBtn").onclick = () => addHouseholdForm();
    document.getElementById("searchHousehold")
      .addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        const k = e.target.value.toLowerCase();
        paginationState.households.currentPage = 1;
        const filtered = k ? households.filter(h =>
          h.chuHo.toLowerCase().startsWith(k)
        ) : null;
        currentFilteredData.households = filtered;
        renderHouseholds(filtered || households);
      });

  }
  if (sectionId === 'residents') {
    document.getElementById("searchResident")
      .addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        const k = e.target.value.toLowerCase();
        paginationState.residents.currentPage = 1;
        const filtered = k ? residents.filter(h =>
          h.ten.toLowerCase().startsWith(k.toLowerCase())
        ) : null;
        currentFilteredData.residents = filtered;
        renderResidents(filtered || residents);
      });


  }
  if (sectionId === 'residence_temp') {
    document.getElementById("addTempBtn").onclick = () => showTempForm();

    document.getElementById("searchTemp")
      .addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        const k = e.target.value.toLowerCase();
        paginationState.temp.currentPage = 1;
        const filtered = k ? tempResidents.filter(h =>
          h.ten.toLowerCase().startsWith(k)
        ) : null;
        currentFilteredData.temp = filtered;
        renderTemp(filtered || tempResidents);
      });
  }
  if (sectionId === 'residence_absent') {

    document.getElementById("searchAbsent")
      .addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;

        const k = e.target.value.toLowerCase();
        paginationState.absent.currentPage = 1;
        const filtered = k ? absentResidents.filter(h =>
          h.ten.toLowerCase().startsWith(k)
        ) : null;
        currentFilteredData.absent = filtered;
        renderAbsent(filtered || absentResidents);
      });
  }
}


// ===== 1. LOGIC HỘ KHẨU =====
async function renderHouseholds(list = households) {
  //console.log("render househouse");

  const tb = document.querySelector("#householdTable tbody");
  const pagination = paginationState.households;

  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Không có dữ liệu</td></tr>";
    updatePaginationControls('households', 0, 0);
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(list.length / pagination.rowsPerPage);
  const startIdx = (pagination.currentPage - 1) * pagination.rowsPerPage;
  const endIdx = Math.min(startIdx + pagination.rowsPerPage, list.length);
  const pageData = list.slice(startIdx, endIdx);

  //showLoading();
  let temp = '';
  pageData.forEach((h, index) => {
    const actualIndex = startIdx + index + 1;
    temp += `
        <tr>
          <td>${actualIndex}</td>
          <td>${h.id}</td>
          <td>${h.chuHo}</td>
          <td>${h.nhanKhau ? h.nhanKhau.length : 0}</td>
          <td >
            <button class='btn small primary' onclick='showHouseholdBookDetail(${h.realId})'>Chi tiết</button>
            <button class='btn small success' onclick='showActionModalHH(${h.realId})'>Khác</button>
          </td>
        </tr>`;

    // <button class='btn small success' onclick='editHouseholdForm(${h.realId})'>Sửa</button>
    //     <button class='btn small second'  onclick='showSplitHouseholdForm(${h.realId})'>Tách hộ</button>
    //     <button class='btn small danger' onclick='deleteHousehold(${h.realId})'>Xoá</button>
    //<button class="btn small success" onclick='addResidentForm(${h.realId})'>Thêm nhân khẩu mới</button>
  });

  await delay(100);
  tb.innerHTML = temp;
  updatePaginationControls('households', totalPages, list.length);

  // await delay(100);
  // closeLoading();
  return temp;
}

async function showHouseholdBookDetail(realId) {

  const h = households.find(x => x.realId === realId);
  if (!h) {
    return;
  }
  const history = await ApiService.getHouseholdHistory(realId);
  let historyContent = '';
  if (history) {
    historyContent = (history || []).map(ls => `
      <div class="info-item-row full-width"><label style="font-size: 14px">Ngày: ${formatDate(ls.ngay)}</label><span style="font-size: 16px">${ls.tt}</span></div>
      `).join('');
  }
  const membersHtml = (h.nhanKhau || []).map(nk => `
    <div class="book-member-card">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <h4>${nk.ten} (${nk.vaiTro})</h4>
        <div>
          <button class="btn small success" onclick='showActionModalNK(${nk.nkID}, 1)'>Các thao tác</button>
        </div>
      </div>
      <div class="info-vertical-list">
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(nk.ngaySinh)}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${nk.gioiTinh}</span></div>

        <div class="info-item-row"><label>Nơi sinh</label><span>${nk.noiSinh}</span></div>
        <div class="info-item-row"><label>Nguyên quán</label><span>${nk.queQuan}</span></div>

        <div class="info-item-row"><label>CCCD</label><span>${nk.cccd || 'Mới sinh'}</span></div>

        <div class="info-item-row"><label>Ngày cấp CCCD</label><span>${formatDate(nk.cccdNgayCap) ||'N/A' }</span></div>
        <div class="info-item-row"><label>Nơi cấp CCCD</label><span>${nk.cccdNoiCap || 'N/A'}</span></div>

        <div class="info-item-row"><label>Dân tộc</label><span>${nk.danToc}</span></div>
        <div class="info-item-row"><label>Tôn giáo</label><span>${nk.tonGiao}</span></div>

        <div class="info-item-row"><label>Quốc tịch</label><span>${nk.quocTich}</span></div>
        <div class="info-item-row"><label>Nghề nghiệp</label><span>${nk.nghe || 'N/A'}</span></div>
        <div class="info-item-row"><label>Nơi làm việc</label><span>${nk.noiLamViec || 'N/A'}</span></div>
        <div class="info-item-row"><label>Địa chỉ thường trú trước khi chuyển đến</label><span>${nk.diaChiTruoc || 'Mới sinh'}</span></div>
        <div class="info-item-row"><label>Ngày đăng kí thường chú</label><span>${formatDate(nk.ngayDKTT)}</span></div>

        <div class="info-item-row full-width"><label>Địa chỉ thường trú</label><span>${nk.diaChiThuongTru || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Địa chỉ hiện nay</label><span>${nk.noiOHienTai || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Ghi chú</label><span>${nk.ghiChu || 'Không có'}</span></div>
      </div>
    </div>
  `).join('');
  // ${nk.ghiChu == 'Đã qua đời' ? '':`
  //         <button class="btn small success" onclick="showResidentForm(${nk.nkID}, ${realId})">Thay đổi thông tin</button>
  //         <button class="btn small second" onclick="showAbsentForm(${nk.nkID})">${nk.ghiChu == 'Tạm vắng' ? 'Sửa thông tin tạm vắng': 'Đăng ký tạm vắng'}</button>
  //         <button class="btn small third" onclick="declareDeathForm(${nk.nkID})">Khai tử</button>  
  //         `}
  //       <button class="btn small danger" onclick="deleteResident(${nk.nkID})">Xoá thường trú</button>  

  const contentHtml = `
    <h3 class="detail-name-title" style="text-align: center; border: none; margin-bottom: 5px;">SỔ HỘ KHẨU</h3>
    <h3 class="book-title" style="text-align: center; margin-top: 0; padding-top: 0;">Số: ${h.id}</h3>
    
    <div class="book-section">
      <h3>Thông tin chung</h3>
      <div class="info-vertical-list">
        <div class="info-item-row"><label>Chủ hộ</label><span>${h.chuHo}</span></div>
        <div class="info-item-row"><label>Ngày lập sổ</label><span>${formatDate(h.ngayLapSo)}</span></div>
        <div class="info-item-row"><label>Số nhà</label><span>${h.diaChi.soNha}</span></div>
        <div class="info-item-row"><label>Ngõ/Đường</label><span>${h.diaChi.ngo}</span></div>
        <div class="info-item-row"><label>Tổ dân Phố</label><span>${h.diaChi.duong}</span></div>
        <div class="info-item-row"><label>Phường/Xã</label><span>${h.diaChi.phuong}</span></div>
        <div class="info-item-row"><label>Quận/Huyện</label><span>${h.diaChi.quan}</span></div>
        <div class="info-item-row"><label>Tỉnh/Thành phố</label><span>${h.diaChi.tinh}</span></div>
      </div>
    </div>
    
    <div class="book-section">
      <h3>Thành viên trong hộ</h3>
      <div class="book-members-list">${membersHtml || '<p>Chưa có thành viên.</p>'}</div>
    </div>
    
    <div class="book-section">
      <h3>Lịch sử thay đổi</h3>
      <div class="book-members-list">${historyContent || '<div class="info-item-row full-width"><span style="font-size: 16px">Chưa có thông tin thay đổi</span></div>'}</div>
    </div>

    <div class="form-actions">
      <button class="btn primary" onclick='showActionModalHH(${realId}, 1)'>Thao tác</button>
      
      
    </div>
  `;

  showDetailView(`Sổ hộ khẩu: ${h.id}`, contentHtml);

  // <button class="btn success" onclick='editHouseholdForm(${h.realId})'>Thay đổi thông tin hộ khẩu</button>
  //     <button class="btn second" onclick='changeOwner(${h.realId})'>Thay đổi chủ hộ</button>
  //     <button class="btn third" onclick='showSplitHouseholdForm(${h.realId})'>Tách hộ khẩu</button>
  //     <button class="btn primary" onclick='addResidentForm(${h.realId})'>Thêm nhân khẩu mới</button>
  //     <button class='btn danger' onclick='deleteHousehold(${h.realId})'>Xoá hộ khẩu</button>
}
function addHouseholdForm() {
  const title = "Tạo hộ khẩu mới";
  // <div class="section-divider">
  //   <h4 style="color: #e74c3c; margin-top: 0; ">Thông tin cơ bản của hộ khẩu</h4>
  // </div>
  const contentHtml = `
    <h4 style="color: #e74c3c; margin-top: 0; margin-bottom:15px; font-size: 16px; text-transform: uppercase;">Thông tin cơ bản của hộ khẩu</h4>
    <div class="form-grid-2">
      <div class="form-group"><label>Số nhà:<span style="color:red">*</span></label><input type="text" id="addHHSoNha" value=""></div>
      <div class="form-group"><label>Ngõ/Đường:<span style="color:red">*</span></label><input type="text" id="addHHNgo" value=""></div>
    </div>

    <div class="form-grid-2">
      <div class="form-group"><label>Tổ dân phố:<span style="color:red">*</span></label><input type="text" id="addHHDuong" value="Tổ dân phố 7"></div>
      <div class="form-group"><label>Phường/Xã:<span style="color:red">*</span></label><input type="text" id="addHHPhuong" value="Phường La Khê"></div>
    </div>

    <div class="form-grid-2">
      <div class="form-group"><label>Quận/Huyện:<span style="color:red">*</span></label><input type="text" id="addHHQuan" value="Quận Hà Đông"></div>
      <div class="form-group"><label>Tỉnh/TP:<span style="color:red">*</span></label><input type="text" id="addHHTinh" value=" Thành phố Hà Nội"></div>
    </div>

    <div class="form-group"><label>Ngày lập sổ:</label><input type="date" id="addHHNgayLapSo" value="${new Date().toISOString().split('T')[0]}"  readonly class="readonly-field"></div>
    
    <div class="section-divider">
      <h4 style="color: #e74c3c; margin-top: 0;">Thông tin chủ hộ</h4>
    </div>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="ch_ten" value=""></div>
        <div class="form-group">
          <label>Giới tính:<span style="color:red">*</span></label>
          <select id="ch_gt">
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="ch_ns" value=""></div>
        <div class="form-group"><label>Nơi sinh:<span style="color:red">*</span></label><input id="ch_noisinh" value=""></div>
        <div class="form-group"><label>Số điện thoại:</label><input id="ch_sdt" value=""></div>
        <div class="form-group"><label>Email:</label><input type="email" id="ch_email" value=""></div>
        <div class="form-group"><label>Số CCCD:<span style="color:red">*</span></label><input id="ch_cccd" value=""></div>
    </div>
    <div class="form-grid-2">
        <div class="form-group"><label>Ngày cấp:<span style="color:red">*</span></label><input type="date" id="ch_cccd_nc" value=""></div>
        <div class="form-group full-width"><label>Nơi cấp:<span style="color:red">*</span></label><input id="ch_cccd_noicap" value=""></div>
        <div class="form-group"><label>Dân tộc:<span style="color:red">*</span></label><input id="ch_dantoc" value=""></div>
        <div class="form-group"><label>Tôn giáo:<span style="color:red">*</span></label><input id="ch_tongiao" value=""></div>
        <div class="form-group"><label>Quốc tịch:<span style="color:red">*</span></label><input id="ch_quoctich" value=""></div>
        <div class="form-group"><label>Nguyên quán:<span style="color:red">*</span></label><input id="ch_que" value=""></div>
    </div>
    
    
    <div class="form-grid-2">
        <div class="form-group"><label>Trình độ học vấn:</label><input id="ch_hocvan" value=""></div>
        <div class="form-group"><label>Nghề nghiệp:</label><input id="ch_nghe" value=""></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="ch_noilamviec" value=""></div>
    </div>
    <div class="form-group"><label>Địa chỉ hiện nay:<span style="color:red">*</span></label><input type="text" id="ch_diaChiHienNay" value="" ></div>
    <div class="form-actions">
        <button class="btn success" onclick="addHousehold()">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `

  showDetailView(title, contentHtml, true);
}

async function addHousehold() {
  const v = id => document.getElementById(id)?.value.trim();

  // danh sách field bắt buộc
  const requiredFields = [
    { id: "addHHSoNha", label: "Số nhà" },
    { id: "addHHNgo", label: "Ngõ/Đường" },
    { id: "addHHDuong", label: "Tổ dân phố" },
    { id: "addHHPhuong", label: "Phường/Xã" },
    { id: "addHHQuan", label: "Quận/Huyện" },
    { id: "addHHTinh", label: "Tỉnh/TP" },

    { id: "ch_ten", label: "Họ tên chủ hộ" },
    { id: "ch_ns", label: "Ngày sinh" },
    { id: "ch_gt", label: "Giới tính" },
    { id: "ch_noisinh", label: "Nơi sinh" },
    { id: "ch_cccd", label: "Số CCCD" },
    { id: "ch_cccd_nc", label: "Ngày cấp CCCD" },
    { id: "ch_cccd_noicap", label: "Nơi cấp CCCD" },
    { id: "ch_dantoc", label: "Dân tộc" },
    { id: "ch_tongiao", label: "Tôn giáo" },
    { id: "ch_quoctich", label: "Quốc tịch" },
    { id: "ch_que", label: "Nguyên quán" },
    { id: "ch_diaChiHienNay", label: "Địa chỉ hiện nay" }
  ];

  // kiểm tra thiếu dữ liệu
  for (const f of requiredFields) {
    if (!v(f.id)) {
      fireAlert(`Vui lòng nhập: ${f.label}`);
      document.getElementById(f.id)?.focus();
      return;
    }
  }

  const data = {
    household: {
      soNha: v("addHHSoNha"),
      ngo: v("addHHNgo"),
      toDanPho: v("addHHDuong"),
      phuongXa: v("addHHPhuong"),
      quanHuyen: v("addHHQuan"),
      tinhTP: v("addHHTinh"),
      ngayLapSo: v("addHHNgayLapSo")
    },

    chuHo: {
      hoTen: v("ch_ten"),
      ngaySinh: v("ch_ns"),
      gioiTinh: v("ch_gt"),
      sdt: v("ch_sdt"),
      email: v("ch_email"),
      noiSinh: v("ch_noisinh"),
      cccd: v("ch_cccd"),
      cccdNgayCap: v("ch_cccd_nc"),
      cccdNoiCap: v("ch_cccd_noicap"),
      danToc: v("ch_dantoc"),
      tonGiao: v("ch_tongiao"),
      quocTich: v("ch_quoctich"),
      nguyenQuan: v("ch_que"),
      hocVan: v("ch_hocvan"),
      ngheNghiep: v("ch_nghe"),
      noiLamViec: v("ch_noilamviec"),
      diaChiTruoc: v("ch_diaChiHienNay")
    }
  };

  if (await confirmm("Xác nhận tạo hộ khẩu mới?")) {
    const res = await ApiService.addHousehold(data);

    if (res.success) {
      saveHistory(res.hkId, "Tạo hộ khẩu mới");
      Saved(res.message);
      await delay(200);

      await loadData();

      showHouseholdBookDetail(res.hkId);

    } else {

      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }
  }
}
function editHouseholdForm(id) {
  const h = households.find(x => x.realId === id);
  const dc = `${h.diaChi.soNha}, ${h.diaChi.ngo}, ${h.diaChi.duong}, ${h.diaChi.phuong}, ${h.diaChi.quan}, ${h.diaChi.tinh}`;
  const ch = residents.find(x => x.nkID === h.idCH);
  const title = "Thay đổi thông tin hộ khẩu";

  const contentHtml = `
    <div class="household-info-display">
      <h4>Thông tin hộ khẩu</h4>
      <div class="info-grid">
        <div class="info-field"><label>Họ tên chủ hộ:</label> <span id="info_ten">${h.chuHo}</span></div>
        <div class="info-field"><label>Ngày lập sổ:</label><span id="info_ngayLap">${formatDate(h.ngayLapSo)}</span></div>
        <div class="info-field"><label>Số nhà:</label> <span id="info_soNha">${h.diaChi.soNha}</span></div>
        <div class="info-field"><label>Ngõ/Đường:</label> <span id="info_ngo">${h.diaChi.ngo}</span></div>
        <div class="info-field"><label>Tổ dân phố:</label> <span id="info_tdp">${h.diaChi.duong}</span></div>
        <div class="info-field"><label>Phường:</label> <span id="info_phuong">${h.diaChi.phuong}</span></div>
        <div class="info-field"><label>Quận/Huyện:</label> <span id="info_qh">${h.diaChi.quan}</span></div>
        <div class="info-field"><label>Tỉnh/Thành phố:</label> <span id="info_tp">${h.diaChi.tinh}</span></div>
      </div>
    </div>
    <div class="section-divider">
      <h4 style="color: #e74c3c; margin-top: 0;">Thông tin địa chỉ mới</h4>
    </div>
    
    <div class="form-grid-2">
      <div class="form-group"><label>Số nhà:</label><input type="text" id="formSoNha" value="${h.diaChi.soNha || ''}"></div>
      <div class="form-group"><label>Ngõ/Đường:</label><input type="text" id="formNgo" value="${h.diaChi.ngo || ''}"></div>
    </div>

    <div class="form-grid-2">
      <div class="form-group"><label>Tổ dân phố:</label><input type="text" id="formDuong" value="${h.diaChi.duong || ''}"></div>
      <div class="form-group"><label>Phường/Xã:</label><input type="text" id="formPhuong" value="${h.diaChi.phuong || ''}"></div>
    </div>

    <div class="form-grid-2">
      <div class="form-group"><label>Quận/Huyện:</label><input type="text" id="formQuan" value="${h.diaChi.quan || ''}"></div>
      <div class="form-group"><label>Tỉnh/TP:</label><input type="text" id="formTinh" value="${h.diaChi.tinh || ''}"></div>
    </div>

    <div class="form-actions">
        <button class="btn success" onclick="editHousehold(${h.realId}, '${dc}')">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `;//thêm ngày đăng ký new Date().toISOString().split('T')[0]
  showDetailView(title, contentHtml, true);
}

async function editHousehold(id, dc = null) {
  const data = {
    id: id,
    // chuHo: document.getElementById("formChuHo").value,
    // cccdChuHo: document.getElementById("formCCCD").value,
    // ngayLapSo: document.getElementById("formNgayLapSo").value,
    diaChi: {
      soNha: document.getElementById("formSoNha").value,
      ngo: document.getElementById("formNgo").value,
      duong: document.getElementById("formDuong").value,
      phuong: document.getElementById("formPhuong").value,
      quan: document.getElementById("formQuan").value,
      tinh: document.getElementById("formTinh").value
    }
  };
  const dc2 = `${data.diaChi.soNha}, ${data.diaChi.ngo}, ${data.diaChi.duong}, ${data.diaChi.phuong}, ${data.diaChi.quan}, ${data.diaChi.tinh}`;
  //if (!data.chuHo) return fireAlert("Nhập tên chủ hộ!");
  if (await confirmm("Lưu thay đổi?", "Xác nhận thay đổi thông tin của hộ này?")) {
    const res = await ApiService.editHousehold(data);

    if (res.success) {

      saveHistory(id, `Thay đổi địa chỉ từ "${dc}" đến "${dc2}"`);
      Saved(res.message);
      await delay(200);
      //alert("Lưu thành công!");

      await loadData();
      showHouseholdBookDetail(id);
      //backDetailView();
    } else {

      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }
  }

}

async function deleteHousehold(id) {
  if (await confirmm("Xóa hộ khẩu này?", "Thao tác này sẽ xoá đăng ký thường trú của toàn bộ thành viên trong hộ khỏi địa phương!", "warning")) {
    const res = await ApiService.deleteHousehold(id);
    if (res.success) {
      Saved(res.message);
      await delay(200);
      //alert("Lưu thành công");
      //hide = 0;
      await loadData();

    }
    else {
      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }

  }


}


// ===== 2. LOGIC NHÂN KHẨU =====
async function renderResidents(list = residents) {
  const tb = document.querySelector("#residentTable tbody");
  const pagination = paginationState.residents;

  if (list.length === 0) {
    tb.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Không có dữ liệu</td></tr>";
    updatePaginationControls('residents', 0, 0);
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(list.length / pagination.rowsPerPage);
  const startIdx = (pagination.currentPage - 1) * pagination.rowsPerPage;
  const endIdx = Math.min(startIdx + pagination.rowsPerPage, list.length);
  const pageData = list.slice(startIdx, endIdx);

  //showLoading();
  let temp = "";

  pageData.forEach((p, index) => {
    const actualIndex = startIdx + index + 1;
    temp += `
      <tr>
        <td>${actualIndex}</td>
        <td>${p.ten}</td>
        <td>${formatDate(p.ngaySinh)}</td>
        <td>${p.gioiTinh}</td>
        <td>${p.ghiChu != "Chủ hộ" && p.ghiChu != null ? p.ghiChu : ''}</td>
        <td>
          <button class='btn small primary' onclick='showResidentDetail(${p.nkID})'>Chi tiết</button>
          <button class='btn small success' onclick='showActionModalNK(${p.nkID}, 1)'>Khác</button>
          
        </td>
      </tr>
    `;
  });
  //<button class='btn small danger' onclick='deleteResident(${p.nkID})'>Xoá</button>

  await delay(100);
  tb.innerHTML = temp;
  updatePaginationControls('residents', totalPages, list.length);

  //await delay(100);
  //closeLoading();
  return temp;
}

// CẬP NHẬT: Trang chi tiết nhân khẩu đầy đủ thông tin
async function showResidentDetail(id) {
  const r = residents.find(x => x.nkID === id);
  let dieContent = ''
  if (!r) return;
  const isDeath = r.ghiChu === 'Đã qua đời';
  if (isDeath) {
    const dieInfo = await ApiService.getDeath(id);
    dieContent = `
      <div class="info-item-row full-width" style="border-top: 4px solid #e74c3c; margin-top: 10px; padding-top: 10px;"><label><strong>Ngày qua đời</strong></label><span><strong>${formatDate(dieInfo.ngayMat)}</strong></span></div>
      <div class="info-item-row full-width"><label>Nơi qua đời</label><span>${dieInfo.noiMat}</span></div>
      <div class="info-item-row full-width"><label>Lý do qua đời</label><span>${dieInfo.lyDo || 'N/A'}</span></div>
    `
  }
  let absContent = '';
  if (r.ghiChu === 'Tạm vắng') {
    const abs = absentResidents.find(x => x.nkID === id);
    absContent = `
      <div class="info-item-row full-width" style="border-top: 4px solid #e74c3c; margin-top: 10px; padding-top: 10px;"><label><strong>Nơi chuyển đến</strong></label><span><strong>${abs.noiChuyenDen}</strong></span></div>
      <div class="info-item-row"><label>Ngày đăng ký</label><span>${formatDate(abs.ngayDangKy)}</span></div>
      <div class="info-item-row"><label>Thời hạn</label><span>${abs.thoiHanTamVang || 'N/A'}</span></div>
      <div class="info-item-row full-width"><label>Lý do</label><span>${abs.lyDo || 'N/A'}</span></div>  
    `
  }


  const contentHtml = `
    <h3 class="detail-name-title">${r.ten}</h3>
    <div class="info-vertical-list">
        <!-- Hàng 1 -->
        <div class="info-item-row"><label>Họ và tên</label><span>${r.ten}</span></div>
        <div class="info-item-row"><label>Giới tính</label><span>${r.gioiTinh}</span></div>
        
        <!-- Hàng 2 -->
        <div class="info-item-row"><label>Ngày sinh</label><span>${formatDate(r.ngaySinh)}</span></div>
        <div class="info-item-row"><label>Nơi sinh</label><span>${r.noiSinh || 'N/A'}</span></div>

        <div class="info-item-row"><label>Quê quán</label><span>${r.queQuan || 'N/A'}</span></div>
        <div class="info-item-row"><label>Số CCCD</label><span>${r.cccd || 'N/A'}</span></div>
        
        
        <!-- Hàng 3 -->
        
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
        <div class="info-item-row full-width"><label>Ghi chú</label><span>${r.ghiChu || 'Không có'}</span></div>
        ${absContent}
        ${dieContent}
    </div>
    
    <div class="form-actions">
      <button class="btn primary" onclick='showActionModalNK(${r.nkID})'>Các thao tác</button>
      
    </div>  
      
    
    `;
  showDetailView("Chi tiết nhân khẩu", contentHtml);
  // <button class="btn success" onclick='showResidentForm(${r.nkID})'>Thay đổi thông tin nhân khẩu</button>
  // <button class="btn second" onclick='showAbsentForm( ${r.nkID} )'> ${r.ghiChu === 'Tạm vắng' ? "Thay đổi thông tin tạm vắng" : "Đăng kí tạm vắng"} </button>
  // <button class='btn danger' onclick='declareDeathForm(${r.nkID})'>Khai tử</button>
}

function showResidentForm(nkId = null, hkId = null) {
  const isEdit = nkId !== null;//có nkid thì là edit
  let r = {};

  if (isEdit) r = residents.find(x => x.nkID === nkId) || {};

  if (!r) {
    return;
  }
  const contentHtml = `
    <h4>Thông tin cơ bản</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="nk_ten" value="${r.ten || ''}"></div>
        <div class="form-group"><label>Giới tính:<span style="color:red">*</span></label><select id="nk_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="nk_ns" value="${r.ngaySinh || ''}"></div>
        <div class="form-group"><label>Nơi sinh:<span style="color:red">*</span></label><input id="nk_noisinh" value="${r.noiSinh || ''}"></div>
        <div class="form-group"><label>Số điện thoại:</label><input id="nk_sdt" value="${r.sdt || ''}"></div>
        <div class="form-group"><label>Email:</label><input type="email" id="nk_email" value="${r.email || ''}"></div>
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
        <div class="form-group"><label>Trình độ học vấn:</label><input id="nk_hocvan" value="${r.trinhDoHocVan || ''}"></div>
        <div class="form-group"><label>Nghề nghiệp:</label><input id="nk_nghe" value="${r.nghe || ''}"></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="nk_noilamviec" value="${r.noiLamViec || ''}"></div>
    </div>
  
    <h4 style="margin-top: 20px;">Địa chỉ</h4>
    <div class="form-group full-width"><label>Địa chỉ thường trú:<span style="color:red">*</span></label><input id="nk_dctt" value="${r.diaChiThuongTru || ''}"  ${r.diaChiThuongTru ? 'readonly class="readonly-field"' : ''}></div>
    <div class="form-group full-width"><label>Nơi ở hiện tại:<span style="color:red">*</span></label><input id="nk_noht" value="${r.noiOHienTai || ''}"  ${r.noiOHienTai ? 'readonly class="readonly-field"' : ''}></div>
    

      
    <div class="form-actions">
      <button class="btn success" onclick="saveResident(${nkId}, ${hkId})">Lưu</button>
      <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
    `;
  showDetailView(isEdit ? "Thay đổi thông tin nhân khẩu" : "Thêm nhân khẩu", contentHtml, true);
  if (r.gioiTinh) document.getElementById('nk_gt').value = r.gioiTinh;
}

async function saveResident(nkId, hkId = null) {
  const data = {
    id: nkId || null,
    // hkId: hkId || null,
    // quanHeVoiChuHo:   document.getElementById('nk_qhvch')?.value.trim() || null,
    ten: document.getElementById('nk_ten').value.trim(),
    ngaySinh: document.getElementById('nk_ns').value,
    gioiTinh: document.getElementById('nk_gt').value,
    sdt: document.getElementById('nk_sdt').value.trim(),
    email: document.getElementById('nk_email').value.trim(),
    noiSinh: document.getElementById('nk_noisinh').value.trim(),
    cccd: document.getElementById('nk_cccd').value.trim(),
    cccdNgayCap: document.getElementById('nk_cccd_nc').value,
    cccdNoiCap: document.getElementById('nk_cccd_noicap').value.trim(),
    danToc: document.getElementById('nk_dantoc').value.trim(),
    tonGiao: document.getElementById('nk_tongiao').value.trim(),
    quocTich: document.getElementById('nk_quoctich').value.trim(),
    queQuan: document.getElementById('nk_que').value.trim(),
    trinhDoHocVan: document.getElementById('nk_hocvan').value.trim(),
    nghe: document.getElementById('nk_nghe').value.trim(),
    noiLamViec: document.getElementById('nk_noilamviec').value.trim(),
    diaChiThuongTru: document.getElementById('nk_dctt').value.trim(),
    noiOHienTai: document.getElementById('nk_noht').value.trim()
  };
  const requiredFields = [
    { field: data.ten, name: 'Họ tên' },
    { field: data.ngaySinh, name: 'Ngày sinh' },
    { field: data.gioiTinh, name: 'Giới tính' },
    //{ field: data.sdt, name: 'Số điện thoại' },
    { field: data.noiSinh, name: 'Nơi sinh' },
    { field: data.cccd, name: 'Số CCCD' },
    { field: data.cccdNgayCap, name: 'Ngày cấp CCCD' },
    { field: data.cccdNoiCap, name: 'Nơi cấp CCCD' },
    { field: data.danToc, name: 'Dân tộc' },
    { field: data.tonGiao, name: 'Tôn giáo' },
    { field: data.quocTich, name: 'Quốc tịch' },
    { field: data.queQuan, name: 'Nguyên quán' },
    // { field: data.trinhDoHocVan, name: 'Trình độ học vấn' },
    // { field: data.nghe, name: 'Nghề nghiệp' },
    { field: data.diaChiThuongTru, name: 'Địa chỉ thường trú' },
    { field: data.noiOHienTai, name: 'Nơi ở hiện tại' }
  ];

  const missingFields = requiredFields.filter(f => !f.field).map(f => f.name);

  if (missingFields.length > 0) {
    fireAlert(null, "Vui lòng điền đầy đủ các trường bắt buộc (*)!");
    //alert("Vui lòng điền đầy đủ các trường bắt buộc (*):\n");
    return;
  }
  if (await confirmm("Lưu thay đổi?")) {
    const res = await ApiService.saveResident(data);
    if (res.success) {
      Saved(res.message);
      //alert("Lưu thành công");
      hide = 1;
      if (currentSection == 'households') {
        hide = 1;
      }
      await delay(200);
      await loadData();

      //renderResidents();
      //residentHTML = '';
      if (currentSection === 'households') {
        showHouseholdBookDetail(hkId);
        return;
      }
      if (currentSection === 'residence_absent') {
        showAbsentDetail(nkId);
        return;
      }
      if (currentSection === 'residence_temp') {
        showTempDetail(nkId);
        return;
      }
      if (nkId) showResidentDetail(nkId);

      //backDetailView();

    }
    else {
      fireError(res.message);

    }

  }
}

function addResidentForm(hkId) {
  const hk = households.find(h => h.realId === hkId);

  const contentHtml = `
    <div class="household-info-display">
      <h4>Thông tin hộ khẩu</h4>
      <div class="info-grid">
        <div class="info-field"><label>Họ tên chủ hộ:</label> <span id="info_ten">${hk.chuHo}</span></div>
        <div class="info-field"><label>Ngày lập sổ:</label><span id="info_ngayLap">${formatDate(hk.ngayLapSo)}</span></div>
        <div class="info-field"><label>Số nhà:</label> <span id="info_soNha">${hk.diaChi.soNha}</span></div>
        <div class="info-field"><label>Ngõ/Đường:</label> <span id="info_ngo">${hk.diaChi.ngo}</span></div>
        <div class="info-field"><label>Tổ dân phố:</label> <span id="info_tdp">${hk.diaChi.duong}</span></div>
        <div class="info-field"><label>Phường:</label> <span id="info_phuong">${hk.diaChi.phuong}</span></div>
        <div class="info-field"><label>Quận/Huyện:</label> <span id="info_qh">${hk.diaChi.quan}</span></div>
        <div class="info-field"><label>Tỉnh/Thành phố:</label> <span id="info_tp">${hk.diaChi.tinh}</span></div>
      </div>
    </div>
    <div class="section-divider">
      <h4 style="color: #e74c3c; margin-top: 0;">Thông tin nhân khẩu</h4>
    </div>
    <h4>Thông tin cơ bản</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="nk_ten" value=""></div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="nk_ns" value=""></div>
        <div class="form-group"><label>Giới tính:<span style="color:red">*</span></label><select id="nk_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
        <div class="form-group"><label>Số điện thoại:</label><input id="nk_sdt" value=""></div>
        <div class="form-group"><label>Email:</label><input type="email" id="nk_email" value=""></div>
        <div class="form-group"><label>Nơi sinh:<span style="color:red">*</span></label><input id="nk_noisinh" value=""></div>
        <div class="form-group"><label>Số CCCD:<span style="color:red">*</span></label><input id="nk_cccd" value="" placeholder='Nhập "Mới sinh" hoặc số CCCD nếu có'></div>
    </div>
    <div class="form-grid-2">
        <div class="form-group"><label>Ngày cấp:<span style="color:red">*</span></label><input type="date" id="nk_cccd_nc" value=""></div>
        <div class="form-group full-width"><label>Nơi cấp:<span style="color:red">*</span></label><input id="nk_cccd_noicap" value=""></div>
        <div class="form-group"><label>Dân tộc:<span style="color:red">*</span></label><input id="nk_dantoc" value=""></div>
        <div class="form-group"><label>Tôn giáo:<span style="color:red">*</span></label><input id="nk_tongiao" value="${'Không'}"></div>
        <div class="form-group"><label>Quốc tịch:<span style="color:red">*</span></label><input id="nk_quoctich" value="${'Việt Nam'}"></div>
        <div class="form-group"><label>Nguyên quán:<span style="color:red">*</span></label><input id="nk_que" value=""></div>
    </div>
    
    
    <div class="form-grid-2">
        <div class="form-group"><label>Trình độ học vấn:</label><input id="nk_hocvan" value=""></div>
        <div class="form-group"><label>Nghề nghiệp:</label><input id="nk_nghe" value=""></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="nk_noilamviec" value=""></div>
    </div>
    <div class="form-group full-width"><label>Nơi thường trú hiện nay:<span style="color:red">*</span></label><input id="nk_noht" value="" placeholder='Nhập "Mới sinh" nếu là lần đầu đăng ký thường trú'></div>
    <div class="form-group full-width"><label>Quan hệ với chủ hộ:<span style="color:red">*</span></label><input id="nk_qhvch" value="" ></div>


      
    <div class="form-actions">
      <button class="btn success" onclick="addResidentToHousehold(${hkId})">Lưu</button>
      <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
    `;
  showDetailView("Thêm nhân khẩu", contentHtml, true);

}
async function addResidentToHousehold(hkId) {
  const v = id => document.getElementById(id)?.value.trim();
  const data = {
    hoTen: v("nk_ten"),
    ngaySinh: v("nk_ns"),
    gioiTinh: v("nk_gt"),
    sdt: v("nk_sdt"),
    email: v("nk_email"),
    noiSinh: v("nk_noisinh"),

    cccd: v("nk_cccd"),
    cccdNgayCap: v("nk_cccd_nc"),
    cccdNoiCap: v("nk_cccd_noicap"),

    danToc: v("nk_dantoc"),
    tonGiao: v("nk_tongiao"),
    quocTich: v("nk_quoctich"),
    nguyenQuan: v("nk_que"),

    hocVan: v("nk_hocvan"),
    ngheNghiep: v("nk_nghe"),
    noiLamViec: v("nk_noilamviec"),

    noiOHienTai: v("nk_noht"),
    quanHeChuHo: v("nk_qhvch"),

    idHoKhau: hkId
  };

  const requiredFields = [
    { key: "hoTen", label: "Họ tên" },
    { key: "ngaySinh", label: "Ngày sinh" },
    { key: "gioiTinh", label: "Giới tính" },
    { key: "noiSinh", label: "Nơi sinh" },
    { key: "cccd", label: "Số CCCD" },
    { key: "danToc", label: "Dân tộc" },
    { key: "tonGiao", label: "Tôn giáo" },
    { key: "quocTich", label: "Quốc tịch" },
    { key: "nguyenQuan", label: "Nguyên quán" },
    { key: "noiOHienTai", label: "Nơi ở hiện tại" },
    { key: "quanHeChuHo", label: "Quan hệ với chủ hộ" }
  ];

  for (const f of requiredFields) {
    if (!data[f.key]) {
      fireAlert(`Vui lòng nhập ${f.label}`);
      return;
    }
  }

  const isNewBorn = data.cccd.toLowerCase() === "mới sinh";

  if (!isNewBorn) {
    if (!data.cccdNgayCap || !data.cccdNoiCap) {
      fireAlert("Vui lòng nhập Ngày cấp và Nơi cấp CCCD");
      return;
    }
  } else {
    // Chuẩn hoá dữ liệu cho backend
    data.cccdNgayCap = null;
    data.cccdNoiCap = null;
  }
  data.isNewBorn = isNewBorn;
  if (await confirmm("Thêm nhân khẩu này vào hộ khẩu hiện tại?")) {
    const res = await ApiService.addResident(data);
    if (res.success) {
      saveHistory(hkId, `Thêm nhân khẩu ${data.hoTen}`);
      Saved(res.message);
      await delay(200);
      await loadData();
      showHouseholdBookDetail(hkId);
    }
    else {
      fireError("Có lỗi xảy ra");
    }
  }
}

// KHAI TỬ
//chua sua
function declareDeathForm(id) {

  let t = residents.find(x => x.nkID === id);

  // Form HTML (Common part)
  const contentHtml = `
    <div id="die_resident_info" style="display: block;">
      <div class="die-info-display">
        <h4>Thông tin người mất</h4>
        <div class="info-grid">
          <div class="info-field"><label>Họ tên:</label> <span id="die_ten">${t.ten || ''}</span></div>
          <div class="info-field"><label>Giới tính:</label> <span id="die_gt">${t.gioiTinh || ''}</span></div>
          <div class="info-field"><label>Ngày sinh:</label> <span id="die_ns">${formatDate(t.ngaySinh) || ''}</span></div>
          <div class="info-field"><label>Quê quán:</label> <span id="die_qq">${t.queQuan || 'N/A'}</span></div>
          <div class="info-field"><label>CCCD:</label> <span id="die_cccd">${t.cccd || ''}</span></div>
        </div>
      </div>
      
      <div class="section-divider">
        <h4 style="color: #e74c3c; margin-top: 0;">Thông tin khai tử</h4>
      </div>
      
      <div class="form-grid-2">
        <div class="form-group">
          <label>Ngày qua đời:<span style="color:red">*</span></label>
          <input type="date" id="die_ngay" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>Nơi qua đời:<span style="color:red">*</span></label>
          <input type="text" id="die_noiMat" value="" placeholder="Nhập nơi qua đời">
        </div>
      </div>
            
      <div class="form-group">
        <label>Lý do qua đời:</label>
        <input type="text" id="die_lydo" value="">
      </div>
      
      <div class="form-actions">
        <button class="btn success" onclick="saveDeath(${id})">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
      </div>
    </div>
  `;

  showDetailView(`Đăng ký khai tử cho: ${t.ten}`, contentHtml, true);
}
async function saveDeath(nkId) {
  data = {
    id: nkId,
    ngayQuaDoi: document.getElementById('die_ngay').value,
    noiQuaDoi: document.getElementById('die_noiMat').value,
    lyDo: document.getElementById('die_lydo').value
  }
  if (!data.ngayQuaDoi || !data.noiQuaDoi) {
    fireAlert(null, "Vui lòng nhập đầy đủ thông tin!");
    return;
  }
  if (await confirmm("Xác nhận khai tử người này?")) {
    //ApiService.deleteAbsentResident(nkId);
    const res = await ApiService.saveDeath(data);
    if (res.success) {

      Saved(res.message);
      await delay(200);
      //alert("Lưu thành công");
      hide = 1;
      notNav = 1;
      await loadData();

      showResidentDetail(nkId);

      //backDetailView();

    }
    else {
      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }

  }


}

async function deleteResident(id, hkId = null) {
  const r = residents.find(x => x.nkID == id);
  if (!r) return;
  console.log(r.IDHOKHAU);
  if (await confirmm("Xoá đăng ký thường trú của người này?", "Người này sẽ không còn là người của địa phương", "warning")) {
    const res = await ApiService.deleteResident(id);
    if (res.success) {

      saveHistory(hkId || r.IDHOKHAU, `${r.ten} chuyển đi nơi khác`);
      Saved(res.message);
      await delay(200);
      await loadData();
      if (currentSection === 'households') {
        showHouseholdBookDetail(hkId);
      }

    }
    else {
      fireError(res.message);
    }
  }
}

// ===== 3. TẠM TRÚ / TẠM VẮNG =====
async function renderTemp(list = tempResidents) {
  const tb = document.querySelector("#tempTable tbody");
  const pagination = paginationState.temp;

  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Không có dữ liệu</td></tr>";
    updatePaginationControls('temp', 0, 0);
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(list.length / pagination.rowsPerPage);
  const startIdx = (pagination.currentPage - 1) * pagination.rowsPerPage;
  const endIdx = Math.min(startIdx + pagination.rowsPerPage, list.length);
  const pageData = list.slice(startIdx, endIdx);

  //showLoading();
  let temp = '';
  pageData.forEach((t, i) => {
    const actualIndex = startIdx + i + 1;
    temp += `
    <tr>
      <td>${actualIndex}</td><td>${t.ten}</td><td>${formatDate(t.ngaySinh)}</td><td>${t.gioiTinh}</td><td>${t.queQuan}</td><td style="text-align: right">${t.thoiHanTamTru}</td>
      <td style="text-align: center">
          <button class='btn small primary' onclick="showTempDetail(${t.nkID})">Chi tiết</button>
          <button class='btn small success' onclick="showActionModalTemp(${t.nkID})">Khác</button>
      </td>
    </tr>`;
  });
  // <button class='btn small success' onclick="showTempTTForm(${t.nkID})">Sửa</button>
  //         <button class='btn small danger' onclick="deleteTemp(${t.nkID})">Xóa</button>

  await delay(100);
  tb.innerHTML = temp;
  updatePaginationControls('temp', totalPages, list.length);

  //await delay(100);
  //closeLoading();
  return temp;
}

// Hàm xem chi tiết tạm trú (đầy đủ thông tin)
function showTempDetail(id) {
  const t = tempResidents.find(x => x.nkID === id);
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
        <div class="info-item-row full-width" style="border-top: 4px solid #e74c3c; margin-top: 10px; padding-top: 10px;"><label><strong>Nơi tạm trú</strong></label><span><strong>${t.noiTamTru}</strong></span></div>
        <div class="info-item-row"><label>Ngày đăng ký</label><span>${formatDate(t.ngayDangKy)}</span></div>
        <div class="info-item-row"><label>Thời hạn</label><span>${t.thoiHanTamTru || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Lý do</label><span>${t.lyDo || 'N/A'}</span></div>
    </div>
    <div class="form-actions">
      <button class='btn small success' onclick="showActionModalTemp(${t.nkID})">Các thao tác</button>
      
    </div>
        `;

  // <button class="btn success" onclick="showTempForm(${t.nkID})">Thay đổi thông tin nhân khẩu</button>
  //   <button class="btn second" onclick="showTempTTForm(${t.nkID})">Thay đổi thông tin tạm trú</button>
  showDetailView("Chi tiết tạm trú", contentHtml);
}
function showTempTTForm(id) {
  let t = tempResidents.find(x => x.nkID === id);
  if (!t) return;
  const contentHtml = `
    <div class="resident-info-display">
      <h4>Thông tin người đăng ký</h4>
      <div class="info-grid">
        <div class="info-field"><label>Họ tên:</label> <span id="info_ten">${t.ten || ''}</span></div>
        <div class="info-field"><label>Giới tính:</label> <span id="info_gt">${t.gioiTinh || ''}</span></div>
        <div class="info-field"><label>Ngày sinh:</label> <span id="info_ns">${formatDate(t.ngaySinh) || ''}</span></div>
        <div class="info-field"><label>CCCD:</label> <span id="info_cccd">${t.cccd || ''}</span></div>
        <div class="info-field"><label>Quê quán:</label> <span id="info_qq">${t.queQuan || 'N/A'}</span></div>
        <div class="info-field"><label>Số điện thoại:</label> <span id="info_sdt">${t.sdt || 'N/A'}</span></div>
      </div>
    </div>
    <div class="section-divider">
      <h4 style="color: #e74c3c; margin-top: 0;">Thông tin tạm trú</h4>
    </div>
    
    <div class="form-group full-width"><label>Nơi tạm trú:<span style="color:red">*</span></label><input id="tmp_noio" value="${t.noiTamTru || ''}"></div>
    <div class="form-grid-2">
        <div class="form-group"><label>Ngày đăng ký:<span style="color:red">*</span></label><input type="date" id="tmp_ngaydk" value="${t.ngayDangKy || new Date().toISOString().split('T')[0]}"></div>
        <div class="form-group"><label>Đến ngày:<span style="color:red">*</span></label><input type="date" id="tmp_th" value="${t.denNgay || ''}" ></div>
    </div>
    
    <div class="form-group full-width"><label>Lý do:</label><input id="tmp_lydo" value="${t.lyDo || ''}"></div>
    <div class="form-actions">
        <button class="btn success" onclick="saveTempTT(${id})">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
        <button class="btn danger" onclick="deleteTemp(${id})">Xoá đăng ký tạm vắng</button>
    </div>
  `
  showDetailView("Thay đổi thông tin tạm trú", contentHtml, true);
}
async function saveTempTT(id) {//thay đổi thông tin tạm trú
  const v = id => document.getElementById(id)?.value.trim();
  const data = {
    id: id,
    noiTamTru: v('tmp_noio'),
    ngayDangKy: v('tmp_ngaydk'),
    denNgay: v('tmp_th'),
    lyDo: v('tmp_lydo')
  }
  const requiredFields = [
    { field: data.noiTamTru, name: 'Nơi tạm trú' },
    { field: data.ngayDangKy, name: 'Ngày đăng ký' },
    { field: data.denNgay, name: 'Đến ngày' }
  ];
  const missingFields = requiredFields.filter(f => !f.field).map(f => f.name);

  if (missingFields.length > 0) {
    fireAlert(null, "Vui lòng điền đầy đủ các trường bắt buộc (*)!");
    //alert("Vui lòng điền đầy đủ các trường bắt buộc (*):\n");
    return;
  }

  if (await confirmm("Lưu thay đổi?")) {
    const res = await ApiService.saveTempTT(data);
    if (res.success) {
      Saved(res.message);
      await delay(200);
      //alert("Lưu thành công");

      await loadTemps();
      showTempDetail(id);
    }
    else {
      fireError(res.message);
    }
  }

}
// Cập nhật: Form tạm trú hỗ trợ chỉnh sửa
function showTempForm(id = null) {
  const isEdit = id !== null;
  const t = isEdit ? tempResidents.find(x => x.nkID === id) : {};

  const contentHtml = `
    <h4>Thông tin cơ bản</h4>
    <div class="form-grid-2">
        <div class="form-group"><label>Họ tên:<span style="color:red">*</span></label><input id="tmp_ten" value="${t.ten || ''}"></div>
        <div class="form-group"><label>Giới tính:<span style="color:red">*</span></label><select id="tmp_gt"><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></div>
        <div class="form-group"><label>Ngày sinh:<span style="color:red">*</span></label><input type="date" id="tmp_ns" value="${t.ngaySinh || ''}"></div>
        <div class="form-group"><label>Nơi sinh:<span style="color:red">*</span></label><input id="tmp_noisinh" value="${t.noiSinh || ''}"></div>
        <div class="form-group"><label>Số điện thoại:<span style="color:red">*</span></label><input id="tmp_sdt" value="${t.sdt || ''}"></div>
        <div class="form-group"><label>Email:</label><input type="email" id="tmp_email" value="${t.email || ''}"></div>
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
        <div class="form-group"><label>Trình độ học vấn:</label><input id="tmp_hocvan" value="${t.trinhDoHocVan || ''}"></div>
        <div class="form-group"><label>Nghề nghiệp:</label><input id="tmp_nghe" value="${t.nghe || ''}"></div>
        <div class="form-group full-width"><label>Nơi làm việc:</label><input id="tmp_noilamviec" value="${t.noiLamViec || ''}"></div>
    </div>
    <div class="form-group full-width"><label>Địa chỉ thường trú:<span style="color:red">*</span></label><input id="tmp_tt" value="${t.diaChiThuongTru || ''}"></div>
    
    <div style="display: ${isEdit ? 'none' : 'block'}">
      <div class="section-divider">
        <h4 style="color: #e74c3c; margin-top: 0;">Thông tin tạm trú</h4>
      </div>
      
      <div class="form-group full-width"><label>Nơi tạm trú:<span style="color:red">*</span></label><input id="tmp_noio" value="${t.noiTamTru || ''}"></div>
      <div class="form-grid-2">
          <div class="form-group"><label>Ngày đăng ký:<span style="color:red">*</span></label><input type="date" id="tmp_ngaydk" value="${t.ngayDangKy || new Date().toISOString().split('T')[0]}"></div>
          <div class="form-group"><label>Đến ngày:<span style="color:red">*</span></label><input type="date" id="tmp_th" value="${t.denNgay || ''}" ></div>
      </div>
      
      <div class="form-group full-width"><label>Lý do:</label><input id="tmp_lydo" value="${t.lyDo || ''}"></div>
    </div> 
    
    <div class="form-actions">
        <button class="btn success" onclick="saveTemp(${id}, ${isEdit})">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
    `;
  showDetailView(isEdit ? "Thay đổi thông tin nhân khẩu" : "Đăng ký tạm trú", contentHtml, true);
  if (t.gioiTinh) document.getElementById('tmp_gt').value = t.gioiTinh;
}

async function saveTemp(id, isEdit) {
  const data = {
    isEdit: isEdit,
    id: id !== null ? id : null,
    ten: document.getElementById('tmp_ten').value.trim(),
    ngaySinh: document.getElementById('tmp_ns').value,
    gioiTinh: document.getElementById('tmp_gt').value,
    sdt: document.getElementById('tmp_sdt').value.trim(),
    email: document.getElementById('tmp_email').value.trim(),
    noiSinh: document.getElementById('tmp_noisinh').value.trim(),
    cccd: document.getElementById('tmp_cccd').value.trim(),
    cccdNgayCap: document.getElementById('tmp_cccd_nc').value,
    cccdNoiCap: document.getElementById('tmp_cccd_noicap').value.trim(),
    danToc: document.getElementById('tmp_dantoc').value.trim(),
    tonGiao: document.getElementById('tmp_tongiao').value.trim(),
    quocTich: document.getElementById('tmp_quoctich').value.trim(),
    queQuan: document.getElementById('tmp_que').value.trim(),
    trinhDoHocVan: document.getElementById('tmp_hocvan').value.trim(),
    nghe: document.getElementById('tmp_nghe').value.trim(),
    noiLamViec: document.getElementById('tmp_noilamviec').value.trim(),
    diaChiThuongTru: document.getElementById('tmp_tt').value.trim(),
    noiTamTru: document.getElementById('tmp_noio').value.trim(),
    ngayDangKy: document.getElementById('tmp_ngaydk').value || new Date().toISOString().split('T')[0],
    denNgay: document.getElementById('tmp_th').value,
    lyDo: document.getElementById('tmp_lydo').value.trim()
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
    // { field: data.trinhDoHocVan, name: 'Trình độ học vấn' },
    // { field: data.nghe, name: 'Nghề nghiệp' },
    { field: data.diaChiThuongTru, name: 'Địa chỉ thường trú' },
    { field: data.noiTamTru, name: 'Nơi tạm trú' },
    { field: data.ngayDangKy, name: 'Ngày đăng ký' },
    { field: data.denNgay, name: 'Đến ngày' }
  ];

  const missingFields = requiredFields.filter(f => !f.field).map(f => f.name);

  if (missingFields.length > 0) {
    fireAlert(null, "Vui lòng điền đầy đủ các trường bắt buộc (*)!");
    //alert("Vui lòng điền đầy đủ các trường bắt buộc (*):\n");
    return;
  }
  if (await confirmm(isEdit ? "Lưu thay đổi?" : "Thêm tạm trú cho người này?")) {
    const res = await ApiService.saveTempResident(data);
    if (res.success) {
      Saved(res.message);

      //alert("Lưu thành công");
      if (!isEdit) hide = 1;
      await delay(200);
      await loadTemps();
      showTempDetail(id);
    }
    else {
      fireError(res.message);
    }
  }
}

async function deleteTemp(id) {
  if (await confirmm("Xóa tạm trú của người này?", "Người này sẽ trở về nơi đăng kí thường trú")) {
    const res = await ApiService.deleteTempResident(id);
    if (res.success) {
      Saved(res.message);
      //alert("Lưu thành công");
      await delay(200);
      await loadTemps();
      // tempHTML = '';
      // backDetailView(true);

      //renderTemp();
    }
    else {
      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }

  }

}

async function renderAbsent(list = absentResidents) {
  const tb = document.querySelector("#absentTable tbody");
  const pagination = paginationState.absent;

  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Không có dữ liệu</td></tr>";
    updatePaginationControls('absent', 0, 0);
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(list.length / pagination.rowsPerPage);
  const startIdx = (pagination.currentPage - 1) * pagination.rowsPerPage;
  const endIdx = Math.min(startIdx + pagination.rowsPerPage, list.length);
  const pageData = list.slice(startIdx, endIdx);

  //showLoading();
  let temp = '';
  pageData.forEach((t, i) => {
    const actualIndex = startIdx + i + 1;
    temp += `
    <tr>
      <td>${actualIndex}</td><td>${t.ten}</td><td>${formatDate(t.ngaySinh)}</td><td>${t.gioiTinh}</td><td>${t.cccd}</td><td>${t.noiChuyenDen}</td>
      <td style="text-align: center">
          <button class='btn small primary' onclick="showAbsentDetail(${t.nkID})">Chi tiết</button>
          <button class='btn small success' onclick="showActionModalAbs(${t.nkID})">Khác</button>
      </td>
    </tr>
    `;
  });

  await delay(100);
  tb.innerHTML = temp;
  updatePaginationControls('absent', totalPages, list.length);

  //await delay(100);
  //closeLoading();
  return temp;
}

// Hàm xem chi tiết tạm vắng (có nút sửa)
function showAbsentDetail(id) {
  const t = absentResidents.find(x => x.nkID === id);
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
        <div class="info-item-row full-width" style="border-top: 4px solid #e74c3c; margin-top: 10px; padding-top: 10px;"><label><strong>Nơi chuyển đến</strong></label><span><strong>${t.noiChuyenDen}</strong></span></div>
        <div class="info-item-row"><label>Ngày đăng ký</label><span>${formatDate(t.ngayDangKy)}</span></div>
        <div class="info-item-row"><label>Thời hạn</label><span>${t.thoiHanTamVang || 'N/A'}</span></div>
        <div class="info-item-row full-width"><label>Lý do</label><span>${t.lyDo || 'N/A'}</span></div>
    </div>
    <div class="form-actions">
      <button class="btn primary" onclick="showActionModalAbs(${t.nkID})">Tất cả thao tác</button>
      
    </div> 
    `;
  //<button class="btn secondary" onclick="showResidentForm(${t.nkID})">Thay đổi thông tin nhân khẩu</button>
  //<button class="btn second" onclick="showAbsentForm(${t.nkID})">Thay đổi thông tin tạm vắng</button>
  showDetailView("Chi tiết tạm vắng", contentHtml);
}
function showAbsentForm(id = null) {

  let isEdit = "";
  let t = absentResidents.find(x => x.nkID === id);

  if (t) {
    isEdit = true;
  } else {
    t = residents.find(x => x.nkID === id);
    isEdit = false;
  }
  // Form HTML (Common part)
  const contentHtml = `
    <div id="abs_resident_info" style="display: block;">
      <div class="resident-info-display">
        <h4>Thông tin người đăng ký</h4>
        <div class="info-grid">
          <div class="info-field"><label>Họ tên:</label> <span id="info_ten">${t.ten || ''}</span></div>
          
          <div class="info-field"><label>Giới tính:</label> <span id="info_gt">${t.gioiTinh || ''}</span></div>
          <div class="info-field"><label>Ngày sinh:</label> <span id="info_ns">${formatDate(t.ngaySinh) || ''}</span></div>
          <div class="info-field"><label>CCCD:</label> <span id="info_cccd">${t.cccd || ''}</span></div>
          <div class="info-field"><label>Quê quán:</label> <span id="info_qq">${t.queQuan || 'N/A'}</span></div>
          <div class="info-field"><label>Số điện thoại:</label> <span id="info_sdt">${t.sdt || 'N/A'}</span></div>
        </div>
      </div>
      
      <div class="section-divider">
        <h4 style="color: #e74c3c; margin-top: 0;">Thông tin tạm vắng</h4>
      </div>
      
      <div class="form-grid-2">
        <div class="form-group">
          <label>Ngày đăng ký tạm vắng:<span style="color:red">*</span></label>
          <input type="date" id="abs_ngay" value="${t.ngayDangKy || new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label>Tạm vắng đến ngày:<span style="color:red">*</span></label>
          <input type="date" id="abs_denngay" value="${t.denNgay || ''}" >
        </div>
      </div>
      
      <div class="form-group">
        <label>Nơi chuyển đến:<span style="color:red">*</span></label>
        <input type="text" id="abs_chuyenden" value="${t.noiChuyenDen || ''}" placeholder="Nhập địa chỉ nơi chuyển đến">
      </div>
      
      <div class="form-group">
        <label>Lý do:</label>
        <input type="text" id="abs_lydo" value="${t.lyDo || ''}">
      </div>
      
      <div class="form-actions">
        <button class="btn success" onclick="saveAbsent(${id}, ${isEdit})">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
        ${isEdit ? `<button class="btn danger" onclick="deleteAbsent(${id})">Xoá tạm vắng</button>` : ''}
      </div>
    </div>
  `;

  showDetailView(isEdit ? "Thay đổi thông tin tạm vắng" : "Đăng ký tạm vắng", contentHtml, true);
}


async function saveAbsent(id, isEdit) {
  const data = {
    id: id,
    isEdit: isEdit,
    // nhanKhauId: selectedId,
    ngayDangKy: document.getElementById('abs_ngay').value,
    denNgay: document.getElementById('abs_denngay').value,
    noiChuyenDen: document.getElementById('abs_chuyenden').value.trim(),
    lyDo: document.getElementById('abs_lydo').value.trim()
  };

  // Validate required fields
  if (!data.ngayDangKy || !data.denNgay || !data.noiChuyenDen) {
    fireAlert(null, "Vui lòng điền đầy đủ các trường bắt buộc (*)!");
    //alert('Vui lòng điền đầy đủ các trường bắt buộc (*)!');
    return;
  }

  if (await confirmm(isEdit ? "Lưu thay đổi?" : "Thêm tạm vắng cho người này?")) {
    //showLoading("Đang xử lý");
    const res = await ApiService.saveAbsentResident(data);
    if (res.success) {
      Saved(res.message);
      await delay(200);
      //alert("Lưu thành công");
      //delayy(100);
      await loadData();
      hide = 1;
      if (isEdit) {

        //backDetailView(true);
        if (currentSection == "residents") {
          showResidentDetail(id);
        }
        else {
          showAbsentDetail(id);
        }


      }
      else {
        // backDetailView();
        showResidentDetail(id);
        // absentHTML ='';
        // await renderAbsent();
        //closeLoading();
      }

    }
    else {
      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }

  }



}

async function deleteAbsent(id) {

  if (await confirmm("Xóa tạm vắng?", "Người này đã quay lại địa phương?")) {
    const res = await ApiService.deleteAbsentResident(id);
    if (res.success) {

      Saved(res.message);
      await delay(200);
      await loadData();

      //backDetailView(true);

      //renderAbsent();
    }
    else {
      fireError(res.message);

    }

  }
}

async function renderRewards(list = rewards) {
  const tb = document.querySelector("#rewardTable tbody");
  tb.innerHTML = "";
  if (!list || list.length === 0) {
    tb.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Không có dữ liệu</td></tr>";
    return;
  }
  list.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.ten}</td>
      <td>${r.loai === 'LE' ? "Lễ" : "Học tập"}</td>
      <td>${(r.tongGT).toLocaleString("vi-VN")} Đồng</td>
      <td>${formatDate(r.ngayTao)}</td>
      <td>
        <button class="btn small primary" onclick ="showRewardDetail(${r.id})">Chi tiết</button>
        <button class="btn small success" onclick ="showActionModalRW(${r.id})">Khác</button>
      </td>`;
    tb.appendChild(tr);
  });
  delayy(200);

  //   <button class="btn small success" onclick ="changeRewardInfomation(${r.id})">Sửa</button>
  // <button class="btn small danger" onclick = "deleteReward(${r.id})">Xoá</button>
}



function showRewardForm() {
  const contentHtml = `
    <div class="form-group">
      <label>Tên đợt thưởng</label>
      <input type="text" id="rw_ten" placeholder="Ví dụ: Trung thu 2025">
    </div>

    <div class="form-group">
      <label>Loại đợt thưởng</label>
      <select id="rw_loai" onchange="onChangeLoaiThuong()">
        <option value="">-- Chọn loại --</option>
        <option value="LE">🎁 Dịp lễ</option>
        <option value="HOCTAP">🎓 Học tập</option>
      </select>
    </div>

    <div class="form-group" id="dg_form" style="display:none">
      <label>Giá trị 1 phần quà</label>
      <input type="number" id="rw_dg" placeholder="VD: 50.000đ, 100.000đ,...">
    </div>

    <div class="form-group">
      <label>Ghi chú</label>
      <input type="text" id="rw_gc" value="">
    </div>
    <div class="form-group">
      <label>Ngày tạo</label>
      <input type="date" id="rw_ngayTao" value="${new Date().toISOString().split('T')[0]}" readonly class="readonly-field">
    </div>
    <div class="form-actions">
      <button class="btn success" onclick="addReward()">Lưu</button>
      <button class="btn" onclick="cancelForm()">Huỷ</button>
    </div>
  
  `
  showDetailView("Thêm đợt thưởng", contentHtml, true);

}

function onChangeLoaiThuong() {
  const loai = document.getElementById("rw_loai").value;
  const leGroup = document.getElementById("dg_form");

  if (loai === "LE") {
    leGroup.style.display = "block";
  } else {
    leGroup.style.display = "none";
    document.getElementById("rw_dg").value = "";
  }
}




async function showRewardDetail(id) {

  const r = rewards.find(x => x.id === id);

  if (!r) {

    return;
  }

  if (r.loai == 'LE') {

    const tong = await ApiService.getTotalLe(id);

    const dsThuong = await ApiService.getDetailLe(id);
    let ds = ``;
    dsThuong.forEach(item => {
      ds += `
        <tr>
          <td>${item.ten}</td>
          <td>${item.soPhanQua}</td>
          <td>${item.tien.toLocaleString("vi-VN")}</td>
        </tr>
      `
    });

    contentHtml = `
      <div id="reward_info" style="display: block; margin-bottom: 20px;">
        <div class="reward-info-display">
          <h4>Thông tin chung</h4>
          <div class="info-grid">
            <div class="info-field"><label>Tên đợt: </label> <span id="info_ten">${r.ten || ''}</span></div>
            <div class="info-field"><label>Loại thưởng: </label> <span id="info_loai">Lễ</span></div>
            <div class="info-field"><label>Tổng số hộ: </label> <span id="info_ns">${tong.tongHo || ''}</span></div>
            <div class="info-field"><label>Giá trị mỗi phần quà: </label> <span id="info_ns">${r.donGia || ''}</span></div>
            <div class="info-field"><label>Tổng số phần quà: </label> <span id="info_cccd">${tong.tongNg || ''}</span></div>
            <div class="info-field"><label>Tổng số tiền: </label> <span id="info_qq">${(tong.tongTien).toLocaleString("vi-VN")}</span></div>
            <div class="info-field"><label>Ngày tạo: </label> <span id="info_sdt">${r.ngayTao || 'N/A'}</span></div>
            <div class="info-field"><label>Ghi chú: </label> <span id="info_gc">${r.ghiChu || 'Toàn bộ các em dưới 18 tuổi đều được nhận quà'}</span></div>
          </div>
        </div>
        
        <div class="section-divider">
          <h4 style="color: #e74c3c; margin-top: 0;">Thông tin chi tiết</h4>
        </div>
        <table id="rewardTableLe">
          <thead>
                <tr>
                  <th>Tên chủ hộ</th> 
                  <th>Số phần quà</th>
                  <th>Số tiền nhận</th>
                </tr>
              </thead>
              <tbody>${ds}</tbody>
        </table>
      </div>
      <button class="btn  primary" onclick ="showActionModalRW(${r.id}, 1)">Các thao tác</button>
      
    `
    // <button class="btn  success" onclick ="changeRewardInfomation(${r.id})">Thay đổi thông tin thưởng</button>
    //   <button class="btn  danger" onclick = "deleteReward(${r.id})">Xoá đợt thưởng</button>
  }
  else {
    const tong = await ApiService.getTotalHocTap(id);
    const dsThuong = await ApiService.getDetailHocTap(id);
    let ds = ``;
    dsThuong.forEach(item => {
      ds += `
        <tr>
          <td>${item.ten}</td>
          <td>${item.truong}</td>
          <td>${item.lop}</td>
          <td>
            <select data-old="${item.tt || ''}" onchange="onChangeThanhTich(${r.id},${item.id}, this)" >
              <option value="">-- Chọn --</option>
              <option value="GIOI" ${item.tt === 'GIOI' ? 'selected' : ''}>Giỏi</option>
              <option value="KHA" ${item.tt === 'KHA' ? 'selected' : ''}>Khá</option>
              <option value="TB" ${item.tt === 'TB' ? 'selected' : ''}>Trung bình</option>
            </select>
          </td>
          <td class="so-vo-hs">${item.soVo || ''}</td>
        </tr>
      `
    });
    contentHtml = `
      <div id="reward_info" style="display: block; margin-bottom:20px">
        <div class="reward-info-display">
          <h4>Thông tin chung</h4>
          <div class="info-grid" id="detail-info-ht">
            <div class="info-field"><label>Tên đợt: </label> <span id="info_ten">${r.ten || ''}</span></div>
            <div class="info-field"><label>Loại thưởng: </label> <span id="info_loai">Học tập</span></div>
            <div class="info-field"><label>Tổng số học sinh: </label> <span id="info_tongHS">${tong.tongHS || ''}</span></div>
            <div class="info-field"><label>Số học sinh giỏi: </label> <span id="info_soHSGioi">${tong.soHS_Gioi || ''}</span></div>
            <div class="info-field"><label>Số học sinh khá: </label> <span id="info_soHSKha">${tong.soHS_Kha || ''}</span></div>
            <div class="info-field"><label>Số học sinh trung bình: </label> <span id="info_soHSTB">${tong.soHS_TrungBinh || ''}</span></div>
            <div class="info-field"><label>Tổng số vở: </label> <span id="info_tongVo">${tong.tongVo || ''}</span></div>
            <div class="info-field"><label>Tổng số tiền: </label> <span id="info_tongTien">${(tong.tongTien || 0).toLocaleString("vi-VN")}</span></div>
          </div>
        </div>
        
        <div class="section-divider">
          <h4 style="color: #e74c3c; margin-top: 0;">Thông tin chi tiết</h4>
        </div>
        <table id="rewardTableHocTap">
          <thead>
                <tr>
                  <th>Tên học sinh</th> 
                  <th>Trường học</th> 
                  <th>Lớp</th> 
                  <th>Thành tích</th> 
                  <th>Số vở thưởng</th>
                </tr>
              </thead>
              <tbody>${ds}</tbody>
        </table>
      </div>
      <button class="btn  primary" onclick ="showActionModalRW(${r.id}, 1)">Các thao tác</button>
      
    `;
    // <button class="btn  success" onclick ="changeRewardInfomation(${r.id})">Thay đổi thông tin thưởng</button>
    //   <button class="btn  danger" onclick = "deleteReward(${r.id})">Xoá đợt thưởng</button>
  }

  showDetailView("Chi tiết thưởng", contentHtml, false);
}
async function onChangeThanhTich(idDot, id, Sel) {
  const oldvalue = Sel.dataset.old || "";
  const value = Sel.value;
  const data = { idDot, id, value };
  const res = await ApiService.changeTT(data);
  if (!res.success) {
    fireAlert(res.message);
    Sel.value = oldvalue;
    return;
  }

  // login =0;
  // rewardHTML ='';
  // detailHistory =[];
  renderLai = 1;
  Sel.dataset.old = value;

  let soVo = 0;
  if (value === "GIOI") soVo = 10;
  else if (value === "KHA") soVo = 7;
  else if (value === "TB") soVo = 5;


  const soVoCell = Sel
    .closest("tr")
    .querySelector(".so-vo-hs");

  if (soVoCell) {
    soVoCell.innerText = soVo || '';
  }
  const r = rewards.find(x => x.id === idDot);
  const tong = await ApiService.getTotalHocTap(idDot);
  const x = document.getElementById('detail-info-ht')
  x.innerHTML = `
    <div class="info-field"><label>Tên đợt: </label> <span id="info_ten">${r.ten || ''}</span></div>
    <div class="info-field"><label>Loại thưởng: </label> <span id="info_loai">Học tập</span></div>
    <div class="info-field"><label>Tổng số học sinh: </label> <span id="info_tongHS">${tong.tongHS || ''}</span></div>
    <div class="info-field"><label>Số học sinh giỏi: </label> <span id="info_soHSGioi">${tong.soHS_Gioi || ''}</span></div>
    <div class="info-field"><label>Số học sinh khá: </label> <span id="info_soHSKha">${tong.soHS_Kha || ''}</span></div>
    <div class="info-field"><label>Số học sinh trung bình: </label> <span id="info_soHSTB">${tong.soHS_TrungBinh || ''}</span></div>
    <div class="info-field"><label>Tổng số vở: </label> <span id="info_tongVo">${tong.tongVo || ''}</span></div>
    <div class="info-field"><label>Tổng số tiền: </label> <span id="info_tongTien">${(tong.tongTien || 0).toLocaleString("vi-VN")}</span></div>
  `
  r.tongGT = tong.tongTien;
}

async function addReward() {
  const data = {
    tenDot: document.getElementById('rw_ten').value,
    loai: document.getElementById('rw_loai').value,
    donGia: document.getElementById('rw_dg').value,
    ngayTao: document.getElementById('rw_ngayTao').value,
    ghiChu: document.getElementById('rw_gc').value
  }
  if (await confirmm("Tạo đợt thưởng mới?")) {
    const res = await ApiService.addReward(data);
    //console.log(res);
    if (res.success) {

      Saved(res.message);
      await delay(200);
      hide = 1;
      await loadRewards();
      // rewardHTML = '';
      // backDetailView(true);

      //renderRewards();
    }
    else {
      fireError(res.message || null);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }

  }
}

async function deleteReward(id) {
  if (await confirmm("Xoá đợt thưởng này?")) {
    const res = await ApiService.deleteReward(id);
    if (res.success) {

      Saved(res.message);
      await delay(200);
      await loadRewards();
    }
    else {
      fireError(res.message);

    }

  }
}

function changeRewardInfomation(id) {

  let r = rewards.find(x => x.id === id);


  // Form HTML (Common part)
  const contentHtml = `
    <div class="form-group"><label>Tên đợt thưởng:</label><input id="rw_ten" value="${r.ten}"></div>
    ${r.loai != 'LE' ? "" : `<div class="form-group"><label>Giá trị mỗi phần quà:</label><input id="rw_dg" value="${r.donGia}"></div>`}
    <div class="form-actions">
      <button class="btn success" onclick="saveReward(${id})">Lưu</button>
      <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `;

  showDetailView("Thay đổi thông tin đợt thưởng", contentHtml, true);
}


async function saveReward(id) {
  const data = {
    id: id,

    ten: document.getElementById('rw_ten').value,
    donGia: document.getElementById('rw_dg')?.value || null,

  };

  // Validate required fields


  if (await confirmm("Lưu thay đổi?")) {
    //showLoading("Đang lưu thông tin");
    const res = await ApiService.saveReward(data);
    if (res.success) {

      Saved(res.message);
      await delay(200);
      //alert("Lưu thành công");
      await loadRewards();
      // rewardHTML = '';
      // //renderRewards();
      // backDetailView(true);

    }
    else {
      fireError(res.message);
      //alert("Có lỗi xảy ra: " + (res.message || ""));
    }

  }

}

// ===== THỐNG KÊ (Yêu cầu của bạn) =====
function calculateAge(dobString) {
  if (!dobString) return -1;
  const dob = new Date(dobString);
  const diff_ms = Date.now() - dob.getTime();
  const age_dt = new Date(diff_ms);
  return Math.abs(age_dt.getUTCFullYear() - 1970);
}

async function updateStats(filterType = 'gender') {
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

  // const summaryHtml = `<p><b>Tổng số hộ khẩu:</b> ${totalHouseholds} | <b>Tổng số nhân khẩu (đang thường trú):</b> ${totalResidents} | <b>Tổng số tạm trú:</b> ${totalTemp} | <b>Tổng số tạm vắng:</b> ${totalAbsent}</p>`;

  //tổng số nhân khẩu chỉ tính những người đang sinh sống tại địa phương - tức tính tổng nhân khẩu + số tạm trú - số tạm vắng - đã mất
  const summaryHtml = `<p><b>Tổng số hộ tại địa phương:</b> ${totalHouseholds} | <b>Tổng số nhân khẩu tại địa phương:</b> ${totalResidents + totalTemp} `;

  if (filterType === 'gender') {
    stats = {
      "Nam": residents.filter(r => r.gioiTinh === "Nam" && (!r.ghiChu)).length + tempResidents.filter(r => r.gioiTinh === "Nam").length,
      "Nữ": residents.filter(r => r.gioiTinh === "Nữ" && (!r.ghiChu)).length + tempResidents.filter(r => r.gioiTinh === "Nữ").length,
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
    tempResidents.forEach(r => {
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
      "Đang thường trú": totalResidents,
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
  delayy(200);
}


// ===== HELPER FUNCTIONS =====
function showDetailView(title, contentHtml, isForm = false) {

  if (detailView.style.display === "flex") {
    detailHistory.push({
      title: detailViewTitle.textContent,
      content: detailViewContent.innerHTML,
      isForm: false // hoặc lưu trạng thái cũ nếu cần
    });
  }

  //console.log(detailHistory);
  //lưu tt cũ -> hiện tt mới
  detailViewTitle.textContent = title;
  detailViewContent.innerHTML = contentHtml;
  detailView.style.display = "flex";
  detailViewContent.scrollTop = 0;
  isDetailDirty = false;

  if (isForm) {
    detailViewContent
      .querySelectorAll("input, select")
      .forEach(i => i.oninput = () => isDetailDirty = true);
  }
}
function hideDetailView() {
  detailView.style.display = "none";
  isDetailDirty = false;
}

function cancelForm() {
  if (isDetailDirty) {
    showConfirmModal("Hủy bỏ thay đổi?", () => backDetailView());
  }
  else backDetailView();
}
function showConfirmModal(msg, cb) {
  confirmModalMessage.textContent = msg;
  confirmModal.style.display = "flex";
  confirmModalConfirm.onclick = () => { confirmModal.style.display = "none"; cb(); };
  confirmModalCancel.onclick = () => confirmModal.style.display = "none";
}

function showActionModalHH(id, detail) {
  let a = '';
  if (detail) a = `<button class="btn secondary" onclick='editHouseholdForm(${id})'>Thay đổi thông tin hộ khẩu</button><button class="btn secondary" onclick='changeOwner(${id})'>Thay đổi chủ hộ</button><button class="btn secondary" onclick='showSplitHouseholdForm(${id})'>Tách hộ khẩu</button><button class="btn secondary" onclick='addResidentForm(${id})'>Thêm nhân khẩu mới</button><button class='btn secondary' onclick='deleteHousehold(${id})'>Xoá hộ khẩu</button>`;
  else a = `<button class='btn secondary' onclick='showHouseholdBookDetail(${id})'>Xem thông tin chi tiết</button><button class="btn secondary" onclick='editHouseholdForm(${id})'>Thay đổi thông tin hộ khẩu</button><button class="btn secondary" onclick='changeOwner(${id})'>Thay đổi chủ hộ</button><button class="btn secondary" onclick='showSplitHouseholdForm(${id})'>Tách hộ khẩu</button><button class="btn secondary" onclick='addResidentForm(${id})'>Thêm nhân khẩu mới</button><button class='btn secondary' onclick='deleteHousehold(${id})'>Xoá hộ khẩu</button>`;
  showActionModal(a);
}
function showActionModalNK(id, out = 0) {
  //type = 1 -> absent
  //type = 2 -> die
  const r = residents.find(x => x.nkID === id);
  let a = '';
  if (r.ghiChu === 'Tạm vắng') {
    a = `<button class="btn secondary" onclick='showHouseholdBookDetail2(${r.IDHOKHAU})'>Xem thông tin của hộ</button>
    <button class="btn secondary" onclick='showResidentForm(${id}, ${r.IDHOKHAU})'>Thay đổi thông tin nhân khẩu</button>
    <button class="btn secondary" onclick='showAbsentForm( ${id} )'>Thay đổi thông tin tạm vắng</button>
    <button class='btn secondary' onclick='declareDeathForm(${id})'>Khai tử</button>
    <button class="btn secondary" onclick="deleteResident(${id})">Xoá thường trú</button>
  `;
  }
  else {
    a = `<button class="btn secondary" onclick='showHouseholdBookDetail2(${r.IDHOKHAU})'>Xem thông tin của hộ</button>
    <button class="btn secondary" onclick='showResidentForm(${id}, ${r.IDHOKHAU})'>Thay đổi thông tin nhân khẩu</button>
    <button class="btn secondary" onclick='showAbsentForm( ${id} )'>Đăng ký tạm vắng</button>
    <button class='btn secondary' onclick='declareDeathForm(${id})'>Khai tử</button>
    <button class="btn secondary" onclick="deleteResident(${id})">Xoá thường trú</button>
  `;
  }
  if (r.ghiChu === "Đã qua đời") {
    a = `<button class="btn secondary" onclick='showHouseholdBookDetail2(${r.IDHOKHAU})'>Xem thông tin của hộ</button>
    <button class="btn secondary" onclick='fireErrNK()' data-close="false">Thay đổi thông tin nhân khẩu</button>
    <button class="btn secondary" onclick='fireErrNK()' data-close="false">Đăng ký tạm vắng</button>
    <button class='btn secondary' onclick='fireErrNK()' data-close="false">Khai tử</button>
    <button class="btn secondary" onclick="deleteResident(${id})">Xoá thường trú</button>
  `;
  }
  if (out) a = `<button class='btn secondary' onclick='showResidentDetail(${id})'>Xem thông tin chi tiết</button>` + a;
  showActionModal(a);
}
function showActionModalRW(id, inn = 0) {
  let a = '';
  if (inn) a = `
    <button class="btn secondary" onclick ="changeRewardInfomation(${id})">Thay đổi thông tin thưởng</button>
    <button class="btn secondary" onclick = "deleteReward(${id})">Xoá đợt thưởng</button>`;
  else a = `
    <button class="btn secondary" onclick ="showRewardDetail(${id})">Chi tiết</button>
    <button class="btn secondary" onclick ="changeRewardInfomation(${id})">Thay đổi thông tin thưởng</button>
    <button class="btn secondary" onclick = "deleteReward(${id})">Xoá đợt thưởng</button>

  `;
  showActionModal(a);
}
function showActionModalTemp(id, inn = 0) {
  let a = '';
  a = `
    <button class="btn secondary" onclick="showTempForm(${id})">Thay đổi thông tin cơ bản</button>
    <button class="btn secondary" onclick="showTempTTForm(${id})">Thay đổi thông tin tạm trú</button>
    <button class='btn secondary' onclick="deleteTemp(${id})">Xóa Tạm trú</button>`;
  if (!inn) a = `<button class='btn secondary' onclick="showTempDetail(${id})">Xem thông tin chi tiết</button>` + a;
  showActionModal(a);
}
function showActionModalAbs(id, inn = 0) {
  let a = '';
  a = `
    <button class="btn secondary" onclick="showResidentForm(${id})">Thay đổi thông tin nhân khẩu</button>
    <button class="btn secondary" onclick="showAbsentForm(${id})">Thay đổi thông tin tạm vắng</button>
  `;
  if (!inn) a = `<button class='btn secondary' onclick="showAbsentDetail(${id})">Xem thông tin chi tiết</button>` + a;
  showActionModal(a);
}
function showActionModal(actionLists, msg = 'Vui lòng chọn một hành động bên dưới để tiếp tục.') {
  actionList.innerHTML = (actionLists || '') + `<button class="action-list-btn danger" onclick="document.getElementById('actionModal').style.display='none'">Hủy</button>`;
  actionModal.style.display = 'flex';
  document.getElementById('act-msg').innerText = msg;
}
function closeActionModal() {
  document.getElementById('actionModal').style.display = 'none';
}
// function handleActionClick(e) {
//   if (e.target.tagName === 'BUTTON') {
//     closeActionModal();
//   }
// }
function handleActionClick(e) {
  if (e.target.tagName !== 'BUTTON') return;

  const shouldClose = e.target.dataset.close !== "false";

  if (shouldClose) {
    closeActionModal();
  }
}
function showHouseholdBookDetail2(id) {
  detailHistory = [];
  sectionId = 'households';
  updateHeader(sectionId);
  resetMenu();
  document.querySelector(".nav-item[data-section='households']").classList.add("active");
  currentSection = sectionId;

  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const activeSection = document.getElementById(sectionId);
  if (activeSection) activeSection.classList.add("active");
  showHouseholdBookDetail(id);

}
function backDetailView(x = false) {
  //console.log(detailHistory);
  if (x) {
    login = 0;
    hideDetailView();
    forceNavigateTo(currentSection);
    detailHistory = [];
    return;
  }
  if (renderLai) {
    login = 0;
    forceNavigateTo(currentSection);
    renderLai = 0;

  }
  if (detailHistory.length === 0) {
    hideDetailView();// không còn bước trước
    return;
  }

  const prev = detailHistory.pop();
  detailViewTitle.textContent = prev.title;
  //if(edited)
  detailViewContent.innerHTML = prev.content;
  detailView.style.display = "flex";
  isDetailDirty = false;
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

function OKE(str) {
  Swal.fire({
    title: "Lưu thành công",
    text: str,
    icon: "success"
  });
}

function Saved(str = null, timer = null) {

  Swal.fire({
    position: "center",
    icon: "success",
    title: str ? str : "Lưu thành công",
    showConfirmButton: false,
    timer: timer || 500
  });
  //closeLoading();
}

async function confirmm(str, message = null, icon = null) {
  const result = await Swal.fire({
    title: str,
    text: message,
    icon: icon || "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "OK",
    cancelButtonText: "Huỷ"

  })
  return result.isConfirmed;
}

function fireError(errMessage = null) {
  closeLoading();
  Swal.fire({
    icon: "error",
    title: "Có lỗi đã xảy ra!",
    text: errMessage,
    // footer: '<a href="#">Why do I have this issue?</a>'
  });
}
function fireErrNK(msg = null) {
  Swal.fire({
    position: "center",
    icon: "error",
    title: msg || "Nhân khẩu đã bị khai tử",
    text: "Không thể thay đổi thông tin của người này"
    //showConfirmButton: true,
    //timer: 500
  });
}

function fireAlert(str, message = null) {
  Swal.fire({
    title: str,
    text: message,
    icon: "warning"
  });
}

function showLoading(str = null) {
  //closeLoading();
  Swal.fire({
    title: str || "Đang tải dữ liệu",
    allowOutsideClick: false, // Không cho bấm ra ngoài
    didOpen: () => {
      Swal.showLoading(); // Hiển thị icon xoay xoay
    }
  });
}

function closeLoading() {
  Swal.close();
  //console.log("closeLOADING")
}


async function showSplitHouseholdForm(hkId) {
  const hk = households.find(h => h.realId === hkId);

  if (!hk.nhanKhau || hk.nhanKhau.length < 2) return fireAlert("Hộ phải có ít nhất 2 người để tách.");

  state = {
    oldMembers: [...hk.nhanKhau.filter(m => m.nkID !== hk.idCH)], // Danh sách người ở hộ cũ
    newOwner: null,                  // Người làm chủ hộ mới
    newMembers: []                   // Danh sách thành viên ở hộ mới
  };
  // Khởi chạy

  contentHtml = `
    <div class = "split-household-container">
      <div class="card card-old">
        <div class="card-title">Hộ khẩu cũ </div>
        
        <div class="form-group">
          <label>Chủ hộ:</label>
          <input type="text" style="height:42px" class="form-control" value="${hk.chuHo}" readonly class="readonly-field">
        </div>

        <label>Danh sách thành viên:</label>
        <div id="old-list" class="member-list-zone"> </div>
      </div>

      <div class="card card-new">
        <div class="card-title">Hộ khẩu mới</div>

        <div class="form-group">
            <label>Chủ hộ:</label>
            <div id="new-owner-zone" class="form-control" style="height: 42px; display: flex; align-items: center; color: #999;">
                Kéo thành viên vào đây làm chủ hộ
            </div>
        </div>

        <label>Các thành viên khác:</label>
        <div id="new-list" class="member-list-zone">
          <div class="empty-placeholder">Kéo thả thành viên vào đây</div>
        </div>
      </div>
    </div>
    <div class="form-actions">
        <button class="btn success" onclick="saveSplitHousehold(${hk.realId})">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `
  showDetailView(`Tách hộ khẩu: ${hk.id}`, contentHtml, true);

  render();
  initDragEvents();
}

async function saveSplitHousehold(hkid) {
  if (!state.newOwner) {
    fireAlert("Chưa có chủ hộ mới", "Vui lòng chọn chủ hộ cho hộ mới!");
    return;
  }
  const missingRelation = state.newMembers.find(m => !m.newRole || m.newRole === "");
  if (missingRelation) {
    fireAlert(`Lỗi: Vui lòng chọn quan hệ cho thành viên: ${missingRelation.ten}`);
    return;
  }

  data = {
    idHoKhauCu: hkid,
    diaChi: state.newOwner.diaChiThuongTru,
    HoKhauMoi: {
      idChuHo: state.newOwner.nkID,
      thanhVien: state.newMembers.map(m => ({
        id: m.nkID,
        vaiTro: m.newRole
      }))
    }
  }

  if (await confirmm("Xác nhận tách hộ khẩu này?")) {
    const res = await ApiService.splitHousehold(data);
    if (res.success) {
      saveHistory(hkid, `${state.newOwner.ten}${(state.newMembers || []).map(m => `, ${m.ten}`).join('')} đã tách thành hộ mới`);
      saveHistory(res.newHkId, 'Tạo hộ mới');
      saveHistory(res.newHkId, `Thêm nhân khẩu: ${state.newOwner.ten}${(state.newMembers || []).map(m => `, ${m.ten}`).join('')}`);
      Saved(res.message);
      await delay(200);
      //hide = 0;
      await loadData();

      showHouseholdBookDetail(res.newHkId);
    }
    else {
      fireError(res.message);
    }
  }
}

function initDragEvents() {
  const zones = [
    document.getElementById('old-list'),
    document.getElementById('new-list'),
    document.getElementById('new-owner-zone')
  ];

  zones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {

      e.preventDefault(); // Cho phép drop
      zone.classList.add('drag-over');
      if (zone.id === 'new-owner-zone') zone.classList.add('highlight');
    });

    zone.addEventListener('dragleave', (e) => {
      zone.classList.remove('drag-over');
      if (zone.id === 'new-owner-zone') zone.classList.remove('highlight');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (zone.id === 'new-owner-zone') zone.classList.remove('highlight');

      const memberId = e.dataTransfer.getData('text/plain');

      handleDrop(memberId, zone.id);
    });
  });
}

function handleDrop(memberId, targetZoneId) {

  const compareId = (item) => String(item.nkID) === String(memberId);
  // Tìm thành viên đang được kéo (từ bất kỳ đâu)
  let member = null;
  let source = '';
  // Kiểm tra xem thành viên đang ở đâu
  if (state.oldMembers.find(m => m.nkID == memberId)) {
    member = state.oldMembers.find(m => m.nkID == memberId);
    source = 'old';
  } else if (state.newOwner && state.newOwner.nkID == memberId) {
    member = state.newOwner;
    source = 'owner';
  } else if (state.newMembers.find(m => m.nkID == memberId)) {
    member = state.newMembers.find(m => m.nkID == memberId);
    source = 'new';
  }

  if (!member) return;
  isDetailDirty = true;
  // Xóa member khỏi vị trí cũ
  if (source === 'old') {
    if (targetZoneId === 'old-list') return;
    state.oldMembers = state.oldMembers.filter(m => String(m.nkID) !== String(memberId));
  }
  if (source === 'owner') state.newOwner = null;
  if (source === 'new') {
    if (targetZoneId === 'new-list') return;
    state.newMembers = state.newMembers.filter(m => String(m.nkID) !== String(memberId));
  }

  // Thêm member vào vị trí mới
  if (targetZoneId === 'new-owner-zone') {
    // Nếu đã có chủ hộ mới, đẩy chủ hộ hiện tại xuống danh sách thành viên mới (hoặc trả về cũ tùy logic, ở đây ta đẩy về list cũ cho an toàn)
    if (state.newOwner) {
      state.newOwner.newRole = '';
      state.newMembers.push(state.newOwner);
    }
    state.newOwner = member;
    member.newRole = 'Chủ hộ'; // Reset role
  } else if (targetZoneId === 'new-list') {
    member.newRole = ''; // Reset để người dùng chọn
    state.newMembers.push(member);
  } else if (targetZoneId === 'old-list') {
    state.oldMembers.push(member);
  }
  console.log(5);
  render();
}

// Hàm render giao diện dựa trên State
function render() {
  const oldListEl = document.getElementById('old-list');
  const newListEl = document.getElementById('new-list');
  const newOwnerZone = document.getElementById('new-owner-zone');

  // 1. Render Old List
  oldListEl.innerHTML = '';
  state.oldMembers.forEach(m => {
    oldListEl.appendChild(createMemberItem(m, 'old'));
  });

  // 2. Render New Owner Zone
  if (state.newOwner) {
    newOwnerZone.innerHTML = '';
    newOwnerZone.style.color = '#333';
    newOwnerZone.style.fontWeight = 'bold';
    const item = createMemberItem(state.newOwner, 'owner');
    item.style.border = 'none';
    item.style.width = '100%';
    item.style.margin = '0';
    newOwnerZone.appendChild(item);
  } else {
    newOwnerZone.innerHTML = 'Kéo thành viên vào đây làm chủ hộ';
    newOwnerZone.style.color = '#999';
    newOwnerZone.style.fontWeight = 'normal';
  }

  // 3. Render New Members List
  newListEl.innerHTML = '';
  if (state.newMembers.length === 0) {
    newListEl.innerHTML = '<div class="empty-placeholder">Kéo thả thành viên vào đây</div>';
  } else {
    state.newMembers.forEach(m => {
      newListEl.appendChild(createMemberItem(m, 'new'));
    });
  }
}
// Thay thế hàm createMemberItem cũ bằng hàm này
function createMemberItem(member, type) {
  const div = document.createElement('div');
  div.className = 'member-item';

  // Nếu là ô chủ hộ, thêm class đặc biệt để đổi giao diện
  if (type === 'owner') {
    div.classList.add('owner-style');
  }

  div.draggable = true;

  // Event start drag
  div.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', member.nkID);
    div.classList.add('dragging');
  });
  div.addEventListener('dragend', () => {
    div.classList.remove('dragging');
  });

  // Nội dung bên trái (Tên & Quan hệ cũ)
  let leftContent = `
        <div class="member-info">
            <span class="member-name">${member.ten}</span>
            
        </div>
    `;//<span class="member-rel">Quan hệ với chủ hộ: ${member.vaiTro}</span>

  // Nội dung bên phải
  let rightContent = '';
  if (type === 'new') {
    // Dropdown chọn quan hệ
    rightContent = `
            <select class="new-rel-select" onchange="updateRelation(${member.nkID}, this.value)" onclick="event.stopPropagation()">
                <option value="" disabled ${!member.newRole ? 'selected' : ''}>-- Chọn --</option>
                <option value="Vợ" ${member.newRole === 'Vợ' ? 'selected' : ''}>Vợ</option>
                <option value="Chồng" ${member.newRole === 'Chồng' ? 'selected' : ''}>Chồng</option>
                <option value="Con" ${member.newRole === 'Con' ? 'selected' : ''}>Con</option>
                <option value="Bố/Mẹ" ${member.newRole === 'Bố/Mẹ' ? 'selected' : ''}>Bố/Mẹ</option>
                <option value="Anh/Chị/Em" ${member.newRole === 'Anh/Chị/Em' ? 'selected' : ''}>Anh/Chị/Em</option>
            </select>
        `;
  } else if (type === 'owner') {
    // Tag chủ hộ mới (nhỏ gọn hơn)
    rightContent = `<span style="background:#e8f5e9; color:#2e7d32; padding: 2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">Chủ hộ mới</span>`;
  }
  else {
    rightContent = `<span style="background:#e8f5e9; color:var(--primary-color); padding: 2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">${member.vaiTro}</span>`;
  }

  div.innerHTML = leftContent + rightContent;
  return div;
}

// Cập nhật quan hệ khi user chọn trong Dropdown
window.updateRelation = function (id, value) {
  const member = state.newMembers.find(m => m.nkID === id);
  if (member) member.newRole = value;
}

function changeOwner(hkId) {
  const hk = households.find(x => x.realId === hkId);
  state = {
    oldOwner: hk.nhanKhau.find(m => m.nkID === hk.idCH),
    oldMembers: [...hk.nhanKhau], // Danh sách người ở hộ cũ
    newOwner: null,                  // Người làm chủ hộ mới
    newMembers: []                   // Danh sách thành viên ở hộ mới
  };
  if (!hk) return;
  const optionsHtml = state.oldMembers.map(member => {
    if (member.nkID != hk.idCH) return `<option value="${member.nkID}">${member.ten}</option>`;
    return '';

  }).join('');

  const contentHtml = `
    <div class = "change-household-container">
      <div class="card card-old">
        <div class="card-title">Hộ khẩu hiện tại </div>
        
        <div class="form-group">
          <label>Chủ hộ:</label>
          <input type="text" style="height:42px" class="form-control" value="${hk.chuHo}" readonly class="readonly-field">
        </div>

        <label>Danh sách thành viên:</label>
        <div id="old-list" class="member-list-zone">     </div>
      </div>

      <div class="card card-new">
        <div class="card-title">Hộ khẩu mới</div>

        <div class="form-group">
            <label>Chủ hộ:</label>
            
            <select onchange="eventChangeOwner(this.value)" id="new-owner-zone" class="form-control" style="height: 42px; display: flex; align-items: center; color: #000000ff; appearance: none;">
                <option value="">-- Chọn chủ hộ --</option>
                ${optionsHtml}
            </select>
              
        </div>

        <label>Các thành viên khác:</label>
        <div id="new-list" class="member-list-zone">
          <div class="empty-placeholder">Vui lòng chọn chủ hộ trước</div>
        </div>
      </div>
    </div>
    <div class="form-actions">
        <button class="btn success" onclick="saveChangeOwner(${hk.realId})">Lưu</button>
        <button class="btn" onclick="cancelForm()">Hủy</button>
    </div>
  `

  showDetailView(`Thay đổi chủ hộ`, contentHtml, true);
  renderChangeOwner();
}

function renderChangeOwner() {
  const oldListEl = document.getElementById('old-list');
  const newListEl = document.getElementById('new-list');
  const newOwnerZone = document.getElementById('new-owner-zone');

  oldListEl.innerHTML = '';
  state.oldMembers.forEach(m => {
    if (m.nkID !== state.oldOwner.nkID) oldListEl.appendChild(createMemberItem2(m, 'old'));
  });

  newListEl.innerHTML = '';
  if (state.newMembers.length === 0) {
    newListEl.innerHTML = '<div class="empty-placeholder">Vui lòng chọn chủ hộ trước</div>';
  } else {
    state.newMembers.forEach(m => {
      if (m.nkID !== state.newOwner?.nkID) newListEl.appendChild(createMemberItem2(m, 'new'));
    });
  }
}


function createMemberItem2(member, type) {
  const div = document.createElement('div');
  div.className = 'member-item';

  // Nếu là ô chủ hộ, thêm class đặc biệt để đổi giao diện
  if (type === 'owner') {
    div.classList.add('owner-style');
  }




  // Nội dung bên trái (Tên & Quan hệ cũ)
  let leftContent = `
        <div class="member-info">
            <span class="member-name">${member.ten}</span>
        </div>
    `;//<span class="member-rel">Quan hệ với chủ hộ: ${member.vaiTro}</span>

  // Nội dung bên phải
  let rightContent = '';
  if (type === 'new') {
    // Dropdown chọn quan hệ
    rightContent = `
            <select class="new-rel-select" onchange="updateRelation(${member.nkID}, this.value)" onclick="event.stopPropagation()">
                <option value="" disabled ${!member.newRole ? 'selected' : ''}>-- Chọn --</option>
                <option value="Vợ" ${member.newRole === 'Vợ' ? 'selected' : ''}>Vợ</option>
                <option value="Chồng" ${member.newRole === 'Chồng' ? 'selected' : ''}>Chồng</option>
                <option value="Con" ${member.newRole === 'Con' ? 'selected' : ''}>Con</option>
                <option value="Bố/Mẹ" ${member.newRole === 'Bố/Mẹ' ? 'selected' : ''}>Bố/Mẹ</option>
                <option value="Anh/Chị/Em" ${member.newRole === 'Anh/Chị/Em' ? 'selected' : ''}>Anh/Chị/Em</option>
            </select>
        `;
  } else if (type === 'owner') {
    // Tag chủ hộ mới (nhỏ gọn hơn)
    rightContent = `<span style="background:#e8f5e9; color:#2e7d32; padding: 2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">Chủ hộ mới</span>`;
  }
  else {
    rightContent = `<span style="background:#e8f5e9; color:var(--primary-color); padding: 2px 8px; border-radius:10px; font-size:11px; font-weight:bold;">${member.vaiTro}</span>`;
  }

  div.innerHTML = leftContent + rightContent;
  return div;
}

function eventChangeOwner(newOwnerId) {
  //console.log(newOwnerId);

  const newCH = state.oldMembers.find(x => x.nkID == newOwnerId) || null;
  //console.log(newCH);
  state.newOwner = newCH;
  if (!newOwnerId) {
    state.newMembers = [];
  }
  else state.newMembers = state.oldMembers.filter(x => x.nkID != newOwnerId);

  renderChangeOwner();
}

async function saveChangeOwner(hkId) {
  if (!state.newOwner) {
    fireAlert("Chưa có chủ hộ mới", "Vui lòng chọn chủ hộ cho hộ mới!");
    return;
  }
  const missingRelation = state.newMembers.find(m => !m.newRole || m.newRole === "");
  if (missingRelation) {
    fireAlert(`Lỗi: Vui lòng chọn quan hệ cho thành viên: ${missingRelation.ten}`);
    return;
  }

  data = {
    idHK: hkId,
    newOwnerId: state.newOwner.nkID,
    tv: state.newMembers.map(m => ({
      id: m.nkID,
      vaiTro: m.newRole
    }))
  }
  if (await confirmm("Xác nhận đổi chủ hộ?", `${state.newOwner.ten} sẽ làm chủ hộ mới`)) {
    const res = await ApiService.saveChangeOwner(data);
    if (res.success) {
      saveHistory(hkId, `Thay đổi chủ hộ từ "${state.oldOwner.ten}" thành "${state.newOwner.ten}"`);
      Saved(res.message);
      await delay(200);
      await loadData();

      showHouseholdBookDetail(hkId);
    }
    else {
      fireError(res.message);
    }
  }
}

async function saveHistory(idHK, thongtin) {
  const data = {
    id: idHK,
    tt: thongtin
  }
  await ApiService.saveHistory(data);
}