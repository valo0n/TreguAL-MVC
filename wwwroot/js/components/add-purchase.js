let products = [];
let items = [{ productId: "", quantity: 1, price: 0 }];
let total = 0;

document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
    renderItems();
});

/* ---------------- FETCH PRODUCTS ---------------- */

async function fetchProducts() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/product/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        products = await res.json();
        renderItems();
    } catch (err) {
        console.error("Failed to fetch products", err);
    }
}

/* ---------------- ITEMS ---------------- */

function renderItems() {
    const container = document.getElementById("itemsContainer");
    container.innerHTML = "";

    items.forEach((item, index) => {
        const amount = item.quantity * item.price;

        container.innerHTML += `
            <div class="grid grid-cols-5 gap-2 mb-1 items-center relative">

                <select class="border p-1 rounded-md col-span-2"
                        onchange="onProductChange(${index}, this.value)">
                    <option value="">Select product</option>
                    ${products.map(p => `
                        <option value="${p.product_ID}" ${p.product_ID == item.productId ? "selected" : ""}>
                            ${p.product_Name}
                        </option>
                    `).join("")}
                </select>

                <input type="number" min="1"
                       value="${item.quantity}"
                       onchange="onQuantityChange(${index}, this.value)"
                       class="border px-2 py-1 rounded-md text-center" />

                <input type="number" step="0.01"
                       value="${item.price}"
                       onchange="onPriceChange(${index}, this.value)"
                       class="border px-2 py-1 rounded-md text-center" />

                <input type="text" readonly
                       value="${formatCurrency(amount)}"
                       class="border px-2 py-1 rounded-md bg-gray-100 text-center" />

                ${items.length > 1 ? `
                    <button onclick="removeItem(${index})"
                            class="absolute -right-6 top-2 text-red-500 text-xl font-bold">
                        &times;
                    </button>
                ` : ""}
            </div>
        `;
    });

    calculateTotal();
}

function addItem() {
    items.push({ productId: "", quantity: 1, price: 0 });
    renderItems();
}

function removeItem(index) {
    if (items.length > 1) {
        items.splice(index, 1);
        renderItems();
    }
}

function onProductChange(index, productId) {
    const product = products.find(p => p.product_ID == productId);
    items[index].productId = productId;
    items[index].price = product ? product.price : 0;
    items[index].quantity = 1;
    renderItems();
}

function onQuantityChange(index, val) {
    items[index].quantity = parseFloat(val) || 0;
    calculateTotal();
}

function onPriceChange(index, val) {
    items[index].price = parseFloat(val) || 0;
    calculateTotal();
}

/* ---------------- TOTAL ---------------- */

function calculateTotal() {
    total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    document.getElementById("totalAmount").textContent = formatCurrency(total);
}

function formatCurrency(val) {
    return val.toLocaleString("de-DE", { minimumFractionDigits: 2 });
}

/* ---------------- SUBMIT ---------------- */

async function savePurchase() {
    const errorEl = document.getElementById("errorMessage");
    errorEl.classList.add("hidden");

    const supplierName = document.getElementById("supplierInput").value.trim();
    if (!supplierName) {
        showError("Please enter supplier name");
        return;
    }

    const invalid = items.some(i => !i.productId || i.quantity <= 0 || i.price <= 0);
    if (invalid) {
        showError("Each item must have product, quantity > 0 and price > 0");
        return;
    }

    const payload = {
        supplier_Name: supplierName,
        total_Amount: total,
        items: items.map(i => ({
            product_ID: i.productId,
            quantity: i.quantity,
            price: i.price
        }))
    };

    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/purchase", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        document.getElementById("successModal").classList.remove("hidden");

    } catch (err) {
        showError("Failed to save purchase: " + err.message);
    }
}

function showError(msg) {
    const el = document.getElementById("errorMessage");
    el.textContent = msg;
    el.classList.remove("hidden");
}

/* ---------------- NAV ---------------- */

function goToPurchaseList() {
    window.location.href = "/StockPages/Purchase";
}

function goBack() {
    window.history.back();
}
