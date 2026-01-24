let users = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 6;

let sortField = "user_ID";
let sortOrder = "asc";
let deleteId = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchUsers();

    document.getElementById("searchInput")
        .addEventListener("input", () => {
            currentPage = 1;
            applyFilters();
        });

    document.getElementById("sortSelect")
        .addEventListener("change", e => {
            const [field, order] = e.target.value.split("-");
            sortField = field;
            sortOrder = order;
            applyFilters();
        });
});

/* ---------------- FETCH ---------------- */

async function fetchUsers() {
    try {
        const res = await fetch("http://localhost:5104/api/users");
        if (!res.ok) throw new Error();

        users = await res.json();
        applyFilters();

    } catch (err) {
        console.error("Error fetching users:", err);
    }
}

/* ---------------- FILTER / SORT ---------------- */

function applyFilters() {
    const term = document.getElementById("searchInput")
        .value.toLowerCase();

    filtered = users
        .filter(u =>
            u.business_Name?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term)
        )
        .sort((a, b) => {
            let av = a[sortField] ?? "";
            let bv = b[sortField] ?? "";

            if (sortField === "date") {
                av = new Date(a.date);
                bv = new Date(b.date);
            }

            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();

            return sortOrder === "asc"
                ? av < bv ? -1 : 1
                : av > bv ? -1 : 1;
        });

    render();
}

/* ---------------- RENDER ---------------- */

function render() {
    const tbody = document.getElementById("usersTable");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    pageItems.forEach(u => {
        tbody.innerHTML += `
            <tr class="text-center border-b text-sm">
                <td class="p-3">${u.user_ID}</td>
                <td class="p-3">${u.business_Name ?? ""}</td>
                <td class="p-3">${u.business_Number ?? ""}</td>
                <td class="p-3">${u.email ?? ""}</td>
                <td class="p-3">${u.phone_Number ?? ""}</td>
                <td class="p-3">${u.address ?? ""}</td>
                <td class="p-3">${u.transit_Number ?? ""}</td>
                <td class="p-3">
                    ${u.date
                        ? new Date(u.date).toLocaleString("en-GB")
                        : "No Date"}
                </td>
                <td class="p-3">
                    <button onclick="openConfirm(${u.user_ID})"
                            class="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-800">
                        Delete
                    </button>
                </td>
            </tr>`;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    document.getElementById("pagination").classList.toggle(
        "hidden", filtered.length === 0
    );

    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages;

    document.getElementById("prevBtn").onclick =
        () => { if (currentPage > 1) { currentPage--; render(); } };

    document.getElementById("nextBtn").onclick =
        () => { if (currentPage < totalPages) { currentPage++; render(); } };

    document.getElementById("footerSummary").classList.remove("hidden");
    document.getElementById("totalUsers").textContent =
        `Total Users: ${filtered.length}`;
}

/* ---------------- DELETE ---------------- */

function openConfirm(id) {
    deleteId = id;
    document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirm() {
    deleteId = null;
    document.getElementById("confirmModal").classList.add("hidden");
}

async function confirmDelete() {
    try {
        const res = await fetch(
            `http://localhost:5104/api/users/${deleteId}`,
            { method: "DELETE" }
        );

        if (!res.ok) throw new Error();

        users = users.filter(u => u.user_ID !== deleteId);
        applyFilters();

    } catch {
        alert("Failed to delete user.");
    }

    closeConfirm();
}
