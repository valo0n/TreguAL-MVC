let invoices = [];
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

    const stored = localStorage.getItem(`invoiceLocalIdMap_${userId}`);
    if (stored) localIdMap = JSON.parse(stored);

    fetchInvoices();

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

async function fetchInvoices() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/invoice/user", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        let maxLocalId = Math.max(0, ...Object.values(localIdMap));
        data.forEach(inv => {
            if (!localIdMap[inv.invoice_ID]) {
                localIdMap[inv.invoice_ID] = ++maxLocalId;
            }
        });

        localStorage.setItem(
            `invoiceLocalIdMap_${userId}`,
            JSON.stringify(localIdMap)
        );

        invoices = data.map(inv => ({
            ...inv,
            localId: localIdMap[inv.invoice_ID]
        }));

        applyFilters();

    } catch (err) {
        console.error("Failed to fetch invoices:", err);
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

    filtered = invoices
        .filter(inv =>
            inv.customerName.toLowerCase().includes(term) ||
            inv.localId.toString().includes(term)
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
    const tbody = document.getElementById("saleTable");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    No invoices found.
                </td>
            </tr>`;
    }

    pageItems.forEach(inv => {
        tbody.innerHTML += `
            <tr class="border-t text-center">
                <td class="p-3">${inv.localId}</td>
                <td class="p-3">${inv.customerName}</td>
                <td class="p-3">${formatDate(inv.invoice_Date)}</td>
                <td class="p-3">${formatCurrency(inv.total_Amount)}</td>
                <td class="p-3">
                    <div class="flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
                        <button onclick="viewDetails(${inv.invoice_ID})"
                                class="bg-blue-700 text-white px-4 py-2 rounded text-xs">
                            View
                        </button>
                        <button onclick="openConfirm(${inv.invoice_ID})"
                                class="bg-red-600 text-white px-4 py-2 rounded text-xs">
                            Delete
                        </button>
                        <button onclick="sendEmail(${inv.invoice_ID})"
                                class="bg-green-600 text-white px-4 py-2 rounded text-xs">
                            Email
                        </button>
                        <button onclick="downloadPdf(${inv.invoice_ID})"
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

    document.getElementById("totalInvoices").textContent =
        `Total Invoices: ${filtered.length}`;

    document.getElementById("totalAmount").textContent =
        `Total Amount: ${formatCurrency(
            filtered.reduce((s, i) => s + parseFloat(i.total_Amount), 0)
        )}`;
}

/* ---------------- DETAILS ---------------- */

async function viewDetails(id) {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5104/api/invoice/details/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const items = await res.json();
        const tbody = document.getElementById("detailsTable");
        tbody.innerHTML = "";

        items.forEach(i => {
            tbody.innerHTML += `
                <tr>
                    <td>${i.product_Name}</td>
                    <td>${i.quantity}</td>
                    <td>${formatCurrency(i.price)}</td>
                    <td>${formatCurrency(i.amount)}</td>
                </tr>`;
        });

        document.getElementById("detailsModal").classList.remove("hidden");

    } catch {
        alert("Failed to load invoice details");
    }
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
        const res = await fetch(`http://localhost:5104/api/invoice/${deleteId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        const text = await res.text();

        if (res.ok) {
            showMessage(text || "Invoice deleted.", "success");
            delete localIdMap[deleteId];
            localStorage.setItem(
                `invoiceLocalIdMap_${userId}`,
                JSON.stringify(localIdMap)
            );
            fetchInvoices();
        } else {
            showMessage(text || "Delete failed.", "error");
        }

    } catch {
        showMessage("Error deleting invoice.", "error");
    }

    closeConfirm();
}

/* ---------------- EMAIL & PDF ---------------- */

async function sendEmail(id) {
    try {
        const token = localStorage.getItem("token");

        const detailsRes = await fetch(`http://localhost:5104/api/invoice/details/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const items = await detailsRes.json();

        const meta = invoices.find(i => i.invoice_ID === id);
        if (!meta || !meta.customerEmail) throw new Error("Missing customer email");

        const payload = {
            From: "STOX\nBardhosh\nPrishtine, Kosove",
            To: meta.customerEmail,
            Number: id,
            Amount_Paid: 0,
            Items: items.map(i => ({
                Name: i.product_Name,
                Quantity: i.quantity,
                Unit_Cost: i.price
            }))
        };

        const res = await fetch("http://localhost:5104/api/invoice/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        showMessage("Invoice email sent successfully.", "success");

    } catch (err) {
        showMessage("Email error: " + err.message, "error");
    }
}

async function downloadPdf(id) {
    try {
        const token = localStorage.getItem("token");

        const detailsRes = await fetch(`http://localhost:5104/api/invoice/details/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const items = await detailsRes.json();

        const meta = invoices.find(i => i.invoice_ID === id);
        if (!meta) throw new Error("Invoice not found");

        const payload = {
            From: "STOX\nBardhosh\nPrishtine, Kosove",
            To: meta.customerEmail,
            Number: id,
            Amount_Paid: 0,
            Items: items.map(i => ({
                Name: i.product_Name,
                Quantity: i.quantity,
                Unit_Cost: i.price
            }))
        };

        const res = await fetch("http://localhost:5104/api/invoice/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

    } catch (err) {
        showMessage("PDF error: " + err.message, "error");
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
