let incomeData = [];
let comparisonData = null;

let sortOption = "date-desc";
let filter = "daily";
let startDate = null;
let endDate = null;

let currentPage = 1;
const itemsPerPage = 5;

const token = localStorage.getItem("token");

const filterTitles = {
    daily: "Daily Income",
    weekly: "Weekly Income",
    monthly: "Monthly Income",
    yearly: "Yearly Income"
};

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    loadIncome();
});

function bindEvents() {
    document.getElementById("sortSelect")
        .addEventListener("change", e => {
            sortOption = e.target.value;
            loadIncome();
        });

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            filter = btn.dataset.filter;
            clearDateRange();
            loadIncome();
            highlightFilter();
        });
    });

    document.getElementById("startDate").addEventListener("change", onDateChange);
    document.getElementById("endDate").addEventListener("change", onDateChange);

    document.getElementById("clearDateBtn").addEventListener("click", clearDateRange);

    document.getElementById("prevBtn").onclick =
        () => { if (currentPage > 1) { currentPage--; renderTable(); } };

    document.getElementById("nextBtn").onclick =
        () => {
            const totalPages = Math.ceil(incomeData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        };
}

function onDateChange() {
    startDate = document.getElementById("startDate").value || null;
    endDate = document.getElementById("endDate").value || null;

    document.getElementById("clearDateBtn")
        .classList.toggle("hidden", !(startDate && endDate));

    loadIncome();
}

function clearDateRange() {
    startDate = endDate = null;
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("clearDateBtn").classList.add("hidden");
}

async function loadIncome() {
    showLoading(true);
    hideError();

    try {
        const params = new URLSearchParams();

        if (startDate && endDate) {
            params.append("startDate", new Date(startDate).toISOString());
            params.append("endDate", new Date(endDate).toISOString());
        } else {
            params.append("filter", filter);
        }

        const res = await fetch(
            `http://localhost:5104/api/income?${params}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error();

        let data = await res.json();

        data.sort((a, b) => {
            const dA = new Date(a.date);
            const dB = new Date(b.date);
            if (sortOption === "date-desc") return dB - dA;
            if (sortOption === "date-asc") return dA - dB;
            if (sortOption === "amount-asc") return a.amount - b.amount;
            if (sortOption === "amount-desc") return b.amount - a.amount;
            return 0;
        });

        incomeData = data;
        currentPage = 1;

        renderTitle();
        renderTable();
        loadComparison();

    } catch {
        showError("Failed to load income data");
    }

    showLoading(false);
}

async function loadComparison() {
    if (startDate || endDate) {
        document.getElementById("comparisonBox").classList.add("hidden");
        return;
    }

    try {
        const res = await fetch(
            `http://localhost:5104/api/income/comparison?filter=${filter}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) return;

        comparisonData = await res.json();
        renderComparison();

    } catch { }
}

function renderComparison() {
    if (!comparisonData) return;

    document.getElementById("comparisonBox").classList.remove("hidden");

    document.getElementById("currentAmount").textContent =
        formatCurrency(comparisonData.current);

    document.getElementById("previousAmount").textContent =
        formatCurrency(comparisonData.previous);

    const percentEl = document.getElementById("percentChange");
    percentEl.textContent =
        `${comparisonData.percentChange > 0 ? "+" : ""}${comparisonData.percentChange.toFixed(2)}%`;

    percentEl.className =
        "text-xl font-bold " +
        (comparisonData.percentChange > 0
            ? "text-green-600"
            : comparisonData.percentChange < 0
            ? "text-red-600"
            : "");
}

function renderTitle() {
    document.getElementById("incomeTitle").textContent =
        startDate && endDate
            ? "Custom Date Range Income"
            : filterTitles[filter] || "Income";

    document.getElementById("dateHeader").textContent =
        startDate && endDate
            ? "Date"
            : filter.charAt(0).toUpperCase() + filter.slice(1);
}

function renderTable() {
    const tbody = document.getElementById("incomeTable");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const items = incomeData.slice(start, start + itemsPerPage);

    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="2" class="py-6 text-center text-gray-500">
                    No income data found for this period
                </td>
            </tr>`;
    }

    items.forEach(entry => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">
                    ${entry.displayLabel || new Date(entry.date).toLocaleDateString()}
                </td>
                <td class="py-3 px-4 text-right">
                    ${formatCurrency(entry.amount)}
                </td>
            </tr>`;
    });

    const totalPages = Math.ceil(incomeData.length / itemsPerPage);
    document.getElementById("pagination")
        .classList.toggle("hidden", totalPages <= 1);

    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
    }).format(amount);
}

function showLoading(show) {
    document.getElementById("loadingBox")
        .classList.toggle("hidden", !show);
}

function showError(msg) {
    const box = document.getElementById("errorBox");
    box.textContent = msg;
    box.classList.remove("hidden");
}

function hideError() {
    document.getElementById("errorBox").classList.add("hidden");
}

function highlightFilter() {
    document.querySelectorAll(".filter-btn").forEach(b => {
        b.className =
            "filter-btn border px-3 py-1 md:px-4 md:py-2 rounded-md text-sm md:text-base " +
            (b.dataset.filter === filter
                ? "bg-[#0d274b] text-white"
                : "hover:bg-gray-100");
    });
}
