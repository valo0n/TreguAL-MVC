let categories = [];
let productId = null;

document.addEventListener("DOMContentLoaded", async () => {
    productId = getProductIdFromUrl();
    if (!productId) {
        alert("Invalid product ID");
        return;
    }

    await fetchCategories();
    await fetchProduct(productId);

    document
        .getElementById("editProductForm")
        .addEventListener("submit", handleSubmit);
});

/* ---------------- HELPERS ---------------- */

function getProductIdFromUrl() {
    // /StockPages/EditProduct/5
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1];
}

/* ---------------- FETCH CATEGORIES ---------------- */

async function fetchCategories() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5104/api/product/category/user", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        categories = await res.json();

        const select = document.getElementById("categorySelect");
        select.innerHTML = `<option value="">Select category</option>`;

        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.category_ID;
            opt.textContent = cat.category_Name;
            select.appendChild(opt);
        });

    } catch (err) {
        console.error("Error fetching categories:", err);
    }
}

/* ---------------- FETCH PRODUCT ---------------- */

async function fetchProduct(id) {
    try {
        const res = await fetch(`http://localhost:5104/api/product/${id}`);
        if (!res.ok) throw new Error();

        const data = await res.json();

        document.getElementById("product_Name").value = data.product_Name || "";
        document.getElementById("description").value = data.description || "";
        document.getElementById("stock_Quantity").value = data.stock_Quantity || "";
        document.getElementById("price").value = data.price || "";

        document.getElementById("categorySelect").value =
            data.category_ID ?? "";

    } catch (err) {
        console.error("Error fetching product:", err);
        alert("Failed to load product details.");
    }
}

/* ---------------- SUBMIT ---------------- */

async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
        product_Name: document.getElementById("product_Name").value.trim(),
        description: document.getElementById("description").value.trim(),
        category_ID: parseInt(document.getElementById("categorySelect").value),
        stock_Quantity: parseInt(document.getElementById("stock_Quantity").value),
        price: parseFloat(document.getElementById("price").value)
    };

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5104/api/product/${productId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error();

        showSuccessPopup();

        setTimeout(() => {
            window.location.href = "/StockPages/Product";
        }, 2000);

    } catch (err) {
        console.error("Error updating product:", err);
        alert("Failed to update product.");
    }
}

/* ---------------- UI ---------------- */

function showSuccessPopup() {
    document.getElementById("successPopup").classList.remove("hidden");
}

function goBack() {
    window.history.back();
}
