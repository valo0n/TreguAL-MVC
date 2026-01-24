let purchases = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 5;

let sortField = "localId";
let sortOrder = "Ascending";

let deleteId = null;
let localIdMap = {};
let userId = null;

document.addEventListener("DOMContentLoaded", () => {
    userId = getUserIdFromToken();

    const stored = localStorage.getItem(`purchaseLocalIdMap_${userId}`);
    if (stored) localIdMap = JSON.parse(stored);

    fetchPurchases();

    document.getElementById("searchInput").addEventListener("input", applyFilters);
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

async function fetchPurchases() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/purchase/user", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        let maxLocalId = Math.max(0, ...Object.values(localIdMap));
        data.forEach(p => {
            if (!localIdMap[p.purchase_ID]) {
                localIdMap[p.purchase_ID] = ++maxLocalId;
            }
        });

        localStorage.setItem(
            `purchaseLocalIdMap_${userId}`,
            JSON.stringify(localIdMap)
        );

        purchases = data.map(p => ({
            ...p,
            localId: localIdMap[p.purchase_ID]
        }));

        applyFilters();

    } catch (err) {
        console.error("Failed to fetch purchases:", err);
    }
}

/* ---------------- FILTER / SORT ---------------- */

function onSortChange(e) {
    const [field, order] = e.target.value.split("-");
    sortField = field;
    sortOrder = order;
    applyFilters();
}

function applyFilters() {
    const term = document.getElementById("searchInput").value.toLowerCase();

    filtered = purchases
        .filter(p =>
            p.supplier_Name.toLowerCase().includes(term) ||
            p.localId.toString().includes(term)
        )
        .sort((a, b) => {
            let av = a[sortField];
            let bv = b[sortField];

            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();

            return sortOrder === "Ascending"
                ? av < bv ? -1 : 1
                : av > bv ? -1 : 1;
        });

    currentPage = 1;
    render();
}

/* ---------------- RENDER ---------------- */

function render() {
    const tbody = document.getElementById("purchaseTable");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    pageItems.forEach(p => {
        tbody.innerHTML += `
            <tr class="border-t text-center">
                <td class="p-3">${p.localId}</td>
                <td class="p-3">${p.supplier_Name}</td>
                <td class="p-3">${formatDate(p.purchase_Date)}</td>
                <td class="p-3">${formatCurrency(p.total_Amount)}</td>
                <td class="p-3">
                    <div class="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                        <button onclick='viewDetails(${JSON.stringify(p.items)})'
                                class="bg-blue-600 text-white px-4 py-2 rounded text-xs">
                            View
                        </button>
                        <button onclick="openConfirm(${p.purchase_ID})"
                                class="bg-red-600 text-white px-4 py-2 rounded text-xs">
                            Delete
                        </button>
                        <button onclick='sendEmail(${JSON.stringify(p)})'
                                class="bg-green-600 text-white px-4 py-2 rounded text-xs">
                            Email
                        </button>
                        <button onclick='downloadPdf(${JSON.stringify(p)})'
                                class="bg-gray-700 text-white px-4 py-2 rounded text-xs">
                            PDF
                        </button>
                    </div>
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

    document.getElementById("totalPurchases").textContent =
        `Total Purchases: ${filtered.length}`;

    document.getElementById("totalAmount").textContent =
        `Total Amount: ${formatCurrency(
            filtered.reduce((s, p) => s + parseFloat(p.total_Amount), 0)
        )}`;
}

/* ---------------- DETAILS ---------------- */

function viewDetails(items) {
    const tbody = document.getElementById("detailsTable");
    tbody.innerHTML = "";

    items.forEach(i => {
        tbody.innerHTML += `
            <tr>
                <td>${i.name}</td>
                <td>${i.quantity}</td>
                <td>${formatCurrency(i.unit_Cost)}</td>
                <td>${formatCurrency(i.quantity * i.unit_Cost)}</td>
            </tr>`;
    });

    document.getElementById("detailsModal").classList.remove("hidden");
}

function closeDetails() {
    document.getElementById("detailsModal").classList.add("hidden");
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
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5104/api/purchase/${deleteId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const msg = await res.text();

        if (res.ok) {
            showMessage(msg, "success");
            delete localIdMap[deleteId];
            localStorage.setItem(
                `purchaseLocalIdMap_${userId}`,
                JSON.stringify(localIdMap)
            );
            fetchPurchases();
        } else {
            showMessage("Failed to delete purchase: " + msg, "error");
        }

    } catch {
        showMessage("Error deleting purchase", "error");
    }

    closeConfirm();
}

/* ---------------- EMAIL & PDF ---------------- */

async function sendEmail(purchase) {
    try {
        const token = localStorage.getItem("token");

        const payload = {
            From: "STOX\nBardhosh\nPrishtine, Kosove",
            To: purchase.supplier_Email,
            Number: purchase.purchase_ID,
            Amount_Paid: 0,
            Items: purchase.items
        };

        const res = await fetch("http://localhost:5104/api/purchase/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        showMessage("Purchase email sent successfully.", "success");

    } catch (err) {
        showMessage("Error sending email: " + err.message, "error");
    }
}

async function downloadPdf(purchase) {
    try {
        const token = localStorage.getItem("token");

        const payload = {
            From: "STOX\nBardhosh\nPrishtine, Kosove",
            To: purchase.supplier_Email,
            Number: purchase.purchase_ID,
            Amount_Paid: 0,
            Items: purchase.items
        };

        const res = await fetch("http://localhost:5104/api/purchase/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `purchase_${purchase.purchase_ID}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (err) {
        showMessage("PDF generation failed: " + err.message, "error");
    }
}

/* ---------------- UI HELPERS ---------------- */

function formatDate(date) {
    return new Date(date).toLocaleString("en-GB");
}

function formatCurrency(val) {
    return `${parseFloat(val).toFixed(2)}€`;
}

function showMessage(text, type) {
    const popup = document.getElementById("messagePopup");
    const msg = document.getElementById("messageText");

    msg.textContent = text;
    popup.className =
        "fixed top-6 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg z-50 md:ml-30 " +
        (type === "success" ? "bg-green-600" : "bg-red-600");

    popup.classList.remove("hidden");
}

function closeMessage() {
    document.getElementById("messagePopup").classList.add("hidden");
}
