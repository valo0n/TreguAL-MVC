let customers = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 6;

let sortField = "full_Name";
let sortOrder = "asc";

let deleteId = null;
let localIdMap = {};
let userId = null;

document.addEventListener("DOMContentLoaded", () => {
    userId = getUserIdFromToken();

    const stored = localStorage.getItem(`customerLocalIdMap_${userId}`);
    if (stored) localIdMap = JSON.parse(stored);

    fetchCustomers();

    document.getElementById("searchInput").addEventListener("input", onSearch);
    document.getElementById("sortSelect").addEventListener("change", onSortChange);
});

/* ---------------- TOKEN ---------------- */

function getUserIdFromToken() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.User_ID || payload.user_id || payload.sub;
    } catch {
        return null;
    }
}

/* ---------------- FETCH ---------------- */

async function fetchCustomers() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/customer/user", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        let maxLocalId = Math.max(0, ...Object.values(localIdMap));
        data.forEach(c => {
            if (!localIdMap[c.customer_ID]) {
                localIdMap[c.customer_ID] = ++maxLocalId;
            }
        });

        localStorage.setItem(
            `customerLocalIdMap_${userId}`,
            JSON.stringify(localIdMap)
        );

        customers = data.map(c => ({
            ...c,
            localId: localIdMap[c.customer_ID]
        }));

        applyFilters();

    } catch (err) {
        console.error("Failed to fetch customers", err);
    }
}

/* ---------------- FILTER / SORT ---------------- */

function onSearch(e) {
    currentPage = 1;
    applyFilters();
}

function onSortChange(e) {
    const [field, order] = e.target.value.split("-");
    sortField = field;
    sortOrder = order;
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById("searchInput").value.toLowerCase();

    filtered = customers
        .filter(c => c.full_Name?.toLowerCase().includes(term))
        .sort((a, b) => {
            const av = (a[sortField] ?? "").toString().toLowerCase();
            const bv = (b[sortField] ?? "").toString().toLowerCase();
            if (av < bv) return sortOrder === "asc" ? -1 : 1;
            if (av > bv) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

    render();
}

/* ---------------- RENDER ---------------- */

function render() {
    const tbody = document.getElementById("customerTable");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    pageItems.forEach(c => {
        tbody.innerHTML += `
            <tr class="text-center border-b">
                <td class="p-3">${c.localId}</td>
                <td class="p-3">${c.full_Name}</td>
                <td class="p-3">${c.email}</td>
                <td class="p-3">${c.phone_Number}</td>
                <td class="p-3">${c.address}</td>
                <td class="p-3 space-x-2">
                    <a href="/UserPages/EditCustomer/${c.customer_ID}"
                       class="bg-[#112D4E] text-white px-4 py-1 rounded hover:bg-[#0b213f]">
                        Edit
                    </a>
                    <button onclick="openDeleteModal(${c.customer_ID})"
                            class="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-800">
                        Delete
                    </button>
                </td>
            </tr>`;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages;

    document.getElementById("prevBtn").onclick =
        () => { if (currentPage > 1) { currentPage--; render(); } };

    document.getElementById("nextBtn").onclick =
        () => { if (currentPage < totalPages) { currentPage++; render(); } };

    document.getElementById("totalCustomers").textContent =
        `Total Customers: ${customers.length}`;
}

/* ---------------- DELETE ---------------- */

function openDeleteModal(id) {
    deleteId = id;
    document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal() {
    deleteId = null;
    document.getElementById("deleteModal").classList.add("hidden");
}

async function confirmDelete() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5104/api/customer/${deleteId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        customers = customers.filter(c => c.customer_ID !== deleteId);
        delete localIdMap[deleteId];

        localStorage.setItem(
            `customerLocalIdMap_${userId}`,
            JSON.stringify(localIdMap)
        );

        closeDeleteModal();
        applyFilters();

    } catch {
        alert("Failed to delete customer");
    }
}
