let messages = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 6;

let sortOrder = "asc";
let deleteId = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchMessages();

    document.getElementById("searchInput")
        .addEventListener("input", applyFilters);

    document.getElementById("sortSelect")
        .addEventListener("change", e => {
            sortOrder = e.target.value;
            applyFilters();
        });
});

/* ---------------- FETCH ---------------- */

async function fetchMessages() {
    try {
        const res = await fetch("http://localhost:5104/api/contacts");
        if (!res.ok) throw new Error();

        messages = await res.json();
        applyFilters();

    } catch (err) {
        console.error("Error fetching messages:", err);
        document.getElementById("loadingText").textContent =
            "Failed to load messages.";
    }
}

/* ---------------- FILTER / SORT ---------------- */

function applyFilters() {
    const term =
        document.getElementById("searchInput").value.toLowerCase();

    filtered = messages
        .filter(m =>
            m.email.toLowerCase().includes(term) ||
            m.message.toLowerCase().includes(term)
        )
        .sort((a, b) =>
            sortOrder === "asc"
                ? a.contact_ID - b.contact_ID
                : b.contact_ID - a.contact_ID
        );

    currentPage = 1;
    render();
}

/* ---------------- RENDER ---------------- */

function render() {
    document.getElementById("loadingText").classList.add("hidden");

    const tbody = document.getElementById("messageTable");
    tbody.innerHTML = "";

    if (filtered.length === 0) {
        document.getElementById("noDataText").classList.remove("hidden");
        document.getElementById("tableWrapper").classList.add("hidden");
        document.getElementById("pagination").classList.add("hidden");
        document.getElementById("footerSummary").classList.add("hidden");
        return;
    }

    document.getElementById("noDataText").classList.add("hidden");
    document.getElementById("tableWrapper").classList.remove("hidden");

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    pageItems.forEach(m => {
        tbody.innerHTML += `
            <tr class="text-center border-b">
                <td class="p-3">${m.contact_ID}</td>
                <td class="p-3">${m.email}</td>
                <td class="p-3">${m.message}</td>
                <td class="p-3">${new Date(m.date).toLocaleString()}</td>
                <td class="p-3">
                    <button onclick="openConfirm(${m.contact_ID})"
                            class="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-800">
                        Delete
                    </button>
                </td>
            </tr>`;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    document.getElementById("pagination").classList.remove("hidden");
    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages;

    document.getElementById("prevBtn").onclick =
        () => { if (currentPage > 1) { currentPage--; render(); } };

    document.getElementById("nextBtn").onclick =
        () => { if (currentPage < totalPages) { currentPage++; render(); } };

    document.getElementById("footerSummary").classList.remove("hidden");
    document.getElementById("totalMessages").textContent =
        `Total Messages: ${filtered.length}`;
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
            `http://localhost:5104/api/contacts/${deleteId}`,
            { method: "DELETE" }
        );

        if (!res.ok) throw new Error();

        messages = messages.filter(m => m.contact_ID !== deleteId);
        applyFilters();

    } catch {
        alert("Failed to delete message.");
    }

    closeConfirm();
}
