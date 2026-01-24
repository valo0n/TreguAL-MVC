const API_URL = "http://localhost:5104";
const activityToken = localStorage.getItem("token");

let loggedInTodayData = [];
let latestLogsData = [];

document.addEventListener("DOMContentLoaded", () => {
  const hasUsersTable = document.getElementById("usersTableBody");
  const hasLogs = document.getElementById("latestLogsContainer");

  // Nëse script është ngarku në faqe tjetër, mos bëj asgjë
  if (!hasUsersTable && !hasLogs) return;

  fetchActivity();
  setupModalListeners();
});

async function fetchActivity() {
  try {
    const res = await fetch(`${API_URL}/api/admin/user-activity`, {
      headers: { Authorization: `Bearer ${activityToken}` }
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    processAndRender(data);

  } catch (err) {
    console.error("Activity fetch error:", err);
    const tbody = document.getElementById("usersTableBody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-red-500">Failed to load activity data.</td></tr>`;
    }
  }
}

function processAndRender(data) {
  const grouped = {};
  (data.usersLoggedInToday || []).forEach(log => {
    const name = log.business_Name;
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(log.timestamp);
  });

  const summary = Object.entries(grouped).map(([businessName, timestamps]) => ({
    businessName,
    count: timestamps.length,
    latest: timestamps.sort().slice(-1)[0]
  }));

  loggedInTodayData = summary;
  latestLogsData = data.latestLogs || [];

  renderUsersTable(loggedInTodayData);
  renderLatestLogs(latestLogsData);
}

function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");
  const noDataRow = document.getElementById("usersNoData");
  const viewMoreBtn = document.getElementById("usersViewMoreContainer");

  if (!tbody) return;

  if (!users || users.length === 0) {
    if (noDataRow) noDataRow.classList.remove("hidden");
    return;
  }

  if (users.length > 2 && viewMoreBtn) viewMoreBtn.classList.remove("hidden");

  const displayedUsers = users.slice(0, 2);

  let html = "";
  displayedUsers.forEach(row => {
    const formattedDate = (typeof moment !== "undefined")
      ? moment(row.latest).format("YYYY-MM-DD HH:mm")
      : row.latest;

    html += `
      <tr class="hover:bg-gray-50 transition">
        <td class="px-4 py-3 font-medium">${row.businessName}</td>
        <td class="px-4 py-3">${row.count}</td>
        <td class="px-4 py-3 text-gray-600">${formattedDate}</td>
        <td class="px-4 py-3">
          <button class="text-blue-600 hover:text-blue-800 text-xs">View</button>
        </td>
      </tr>`;
  });

  tbody.innerHTML = html;
}

function renderLatestLogs(logs) {
  const container = document.getElementById("latestLogsContainer");
  const viewMoreBtn = document.getElementById("btnOpenLogsModal");

  if (!container) return;

  if (logs && logs.length > 4 && viewMoreBtn) viewMoreBtn.classList.remove("hidden");

  const displayedLogs = (logs || []).slice(0, 4);

  container.innerHTML = displayedLogs.map(log => `
    <div class="bg-white p-3 rounded-lg border border-gray-200 text-sm shadow-sm hover:shadow-md transition mb-2">
      <span class="font-medium text-[#112D4E]">${log.business_Name}</span> -
      <span class="text-gray-700">${log.action}</span>
      <span class="block text-xs text-gray-500 mt-1">
        ${(typeof moment !== "undefined") ? moment(log.timestamp).format("dddd, MMM D • HH:mm") : log.timestamp}
      </span>
    </div>
  `).join("");
}

function setupModalListeners() {
  const btnOpenUsers = document.getElementById("btnOpenUsersModal");
  const usersModal = document.getElementById("usersModal");
  const btnCloseUsers = document.getElementById("btnCloseUsersModal");

  if (btnOpenUsers && usersModal) {
    btnOpenUsers.addEventListener("click", () => {
      renderUsersModalContent();
      usersModal.classList.remove("hidden");
    });
  }

  if (btnCloseUsers && usersModal) {
    btnCloseUsers.addEventListener("click", () => usersModal.classList.add("hidden"));
  }

  // (Nëse i ke edhe logs modal IDs, i shton njësoj me if-check)
}

function renderUsersModalContent() {
  const tbody = document.getElementById("modalUsersBody");
  if (!tbody) return;

  tbody.innerHTML = (loggedInTodayData || []).map(row => `
    <tr>
      <td class="px-4 py-3 font-medium">${row.businessName}</td>
      <td class="px-4 py-3">${row.count}</td>
      <td class="px-4 py-3 text-gray-600">${row.latest}</td>
    </tr>
  `).join("");
}
