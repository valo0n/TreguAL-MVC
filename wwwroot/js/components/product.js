let products = [];
let filtered = [];
let currentPage = 1;
const itemsPerPage = 6;

let sortField = "localId";
let sortOrder = "Ascending";

let deleteId = null;
let localIdMap = {};
let userId = null;

document.addEventListener("DOMContentLoaded", () => {
    userId = getUserIdFromToken();

    const stored = localStorage.getItem(`localIdMap_${userId}`);
    if (stored) localIdMap = JSON.parse(stored);

    fetchProducts();

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

async function fetchProducts() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/product/user", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        let maxLocalId = Math.max(0, ...Object.values(localIdMap));
        data.forEach(p => {
            if (!localIdMap[p.product_ID]) {
                localIdMap[p.product_ID] = ++maxLocalId;
            }
        });

        localStorage.setItem(
            `localIdMap_${userId}`,
            JSON.stringify(localIdMap)
        );

        products = data.map(p => ({
            ...p,
            localId: localIdMap[p.product_ID]
        }));

        applyFilters();

    } catch (err) {
        console.error("Failed to fetch products", err);
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

    filtered = products
        .filter(p => p.product_Name.toLowerCase().includes(term))
        .sort((a, b) => {
            let av = a[sortField] ?? "";
            let bv = b[sortField] ?? "";

            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();

            if (["localId", "stock_Quantity", "price"].includes(sortField)) {
                av = parseFloat(av);
                bv = parseFloat(bv);
            }

            if (av < bv) return sortOrder === "Ascending" ? -1 : 1;
            if (av > bv) return sortOrder === "Ascending" ? 1 : -1;
            return 0;
        });

    currentPage = 1;
    render();
}

/* ---------------- RENDER ---------------- */

function render() {
    const tbody = document.getElementById("productTable");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = filtered.slice(start, start + itemsPerPage);

    pageItems.forEach(p => {
        tbody.innerHTML += `
            <tr class="text-center border-b">
                <td class="p-3">${p.localId}</td>
                <td class="p-3 max-w-[180px] truncate">${p.product_Name}</td>
                <td class="p-3 max-w-[250px] truncate">${p.description}</td>
                <td class="p-3">${p.category_Name}</td>
                <td class="p-3">${p.stock_Quantity}</td>
                <td class="p-3">${p.price}€</td>
                <td class="p-3 space-x-2">
                    <a href="/StockPages/EditProduct/${p.product_ID}"
                       class="bg-[#112D4E] text-white px-4 py-1 rounded hover:bg-[#0b213f]">
                        Edit
                    </a>
                    <button onclick="openDeleteModal(${p.product_ID})"
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

    document.getElementById("totalProducts").textContent =
        `Product Number: ${products.length}`;

    document.getElementById("totalStock").textContent =
        `Total Stock Quantity: ${products.reduce((a, b) => a + b.stock_Quantity, 0)}`;

    document.getElementById("totalPrice").textContent =
        `Total Price: ${products.reduce((a, b) => a + b.price * b.stock_Quantity, 0)}€`;
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

        const res = await fetch(`http://localhost:5104/api/product/${deleteId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        products = products.filter(p => p.product_ID !== deleteId);
        delete localIdMap[deleteId];

        localStorage.setItem(
            `localIdMap_${userId}`,
            JSON.stringify(localIdMap)
        );

        closeDeleteModal();
        applyFilters();

    } catch {
        alert("Failed to delete product");
    }
}
