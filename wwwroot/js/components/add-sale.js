let customers = [];
let products = [];
let items = [{ productId: "", quantity: 1, price: 0, warning: "" }];
let total = 0;

document.addEventListener("DOMContentLoaded", () => {
    fetchCustomers();
    fetchProducts();
    renderItems();
});

/* ---------------- FETCH ---------------- */

async function fetchCustomers() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/customer/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        customers = await res.json();

        const select = document.getElementById("customerSelect");
        select.innerHTML = `<option value="">Select customer</option>`;
        customers.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.customer_ID;
            opt.textContent = c.full_Name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Failed to fetch customers", err);
    }
}

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
        const product = products.find(p => p.product_ID == item.productId);
        const amount = item.quantity * item.price;

        container.innerHTML += `
            <div class="mb-1">
                <div class="grid grid-cols-5 gap-2 items-center relative">

                    <select class="border p-1 rounded-md col-span-2"
                            onchange="onProductChange(${index}, this.value)">
                        <option value="">Select product</option>
                        ${products.map(p => `
                            <option value="${p.product_ID}"
                                ${p.product_ID == item.productId ? "selected" : ""}>
                                ${p.product_Name} (Stock: ${p.stock_Quantity})
                            </option>
                        `).join("")}
                    </select>

                    <input type="number" min="1"
                           value="${item.quantity}"
                           onchange="onQuantityChange(${index}, this.value)"
                           class="border px-2 py-1 rounded-md text-center" />

                    <input type="text" readonly
                           value="${formatCurrency(item.price)}"
                           class="border px-2 py-1 rounded-md bg-gray-100 text-center" />

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

                ${item.warning ? `
                    <div class="text-red-600 text-xs mb-2">${item.warning}</div>
                ` : ""}
            </div>
        `;
    });

    calculateTotal();
}

/* ---------------- ITEM EVENTS ---------------- */

function addItem() {
    items.push({ productId: "", quantity: 1, price: 0, warning: "" });
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

    if (product?.stock_Quantity === 0) {
        items[index].warning = "This product is out of stock!";
    } else {
        items[index].warning = "";
    }

    renderItems();
}

function onQuantityChange(index, val) {
    const qty = parseInt(val) || 0;
    const product = products.find(p => p.product_ID == items[index].productId);

    items[index].quantity = qty;

    if (qty <= 0) {
        items[index].warning = "Quantity must be greater than 0";
    } else if (product && qty > product.stock_Quantity) {
        items[index].warning = `Only ${product.stock_Quantity} in stock`;
    } else if (product && product.stock_Quantity === 0) {
        items[index].warning = "This product is out of stock!";
    } else {
        items[index].warning = "";
    }

    calculateTotal();
    renderItems();
}

/* ---------------- TOTAL ---------------- */

function calculateTotal() {
    total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    document.getElementById("totalAmount").textContent = formatCurrency(total);

    const hasWarning = items.some(i => i.warning);
    const btn = document.getElementById("saveBtn");
    btn.disabled = hasWarning;
    btn.classList.toggle("bg-gray-400", hasWarning);
    btn.classList.toggle("cursor-not-allowed", hasWarning);
}

function formatCurrency(val) {
    return val.toLocaleString("de-DE", { minimumFractionDigits: 2 });
}

/* ---------------- SUBMIT ---------------- */

async function saveSale() {
    const errorEl = document.getElementById("errorMessage");
    errorEl.classList.add("hidden");

    const customerId = document.getElementById("customerSelect").value;
    if (!customerId) {
        showError("Please select a customer.");
        return;
    }

    if (items.some(i => !i.productId)) {
        showError("Please select a product for each item.");
        return;
    }

    if (items.some(i => i.quantity <= 0)) {
        showError("All quantities must be greater than 0.");
        return;
    }

    if (items.some(i => i.warning)) {
        showError("Please fix item warnings before submitting.");
        return;
    }

    const payload = {
        customer_ID: parseInt(customerId),
        total_Amount: total,
        items: items.map(i => ({
            product_ID: parseInt(i.productId),
            quantity: i.quantity,
            price: i.price
        }))
    };

    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/invoice", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        document.getElementById("successModal").classList.remove("hidden");
        items = [{ productId: "", quantity: 1, price: 0, warning: "" }];
        calculateTotal();

    } catch (err) {
        showError("Failed to save invoice: " + err.message);
    }
}

function showError(msg) {
    const el = document.getElementById("errorMessage");
    el.textContent = msg;
    el.classList.remove("hidden");
}

/* ---------------- NAV ---------------- */

function goToSaleList() {
    window.location.href = "/StockPages/Sale";
}

function goBack() {
    window.history.back();
}
