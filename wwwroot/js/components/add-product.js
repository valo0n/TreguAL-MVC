let categories = [];

document.addEventListener("DOMContentLoaded", () => {
  fetchCategories();

  const form = document.getElementById("addProductForm");
  form.addEventListener("submit", handleSubmit);

  const categoryInput = document.getElementById("categoryInput");
  const dropdown = document.getElementById("categoryDropdown");

  // Show dropdown on focus
  categoryInput.addEventListener("focus", () => {
    renderDropdown(categoryInput.value.trim());
    openDropdown();
  });

  // Filter + clear potential new on input
  categoryInput.addEventListener("input", () => {
    renderDropdown(categoryInput.value.trim());
    openDropdown();
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!categoryInput.parentElement.contains(e.target)) {
      closeDropdown();
    }
  });

  // ESC closes
  categoryInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  function openDropdown() {
    dropdown.classList.remove("hidden");
  }

  function closeDropdown() {
    dropdown.classList.add("hidden");
  }
});

async function fetchCategories() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:5104/api/product/category/user", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(await res.text());
    categories = await res.json();
    renderDropdown(""); // Preload empty
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  }
}

function renderDropdown(query) {
  const dropdown = document.getElementById("categoryDropdown");
  dropdown.innerHTML = "";

  const q = (query || "").toLowerCase();
  const filtered = categories
    .filter((c) => (c.category_Name || "").toLowerCase().includes(q))
    .slice(0, 50); // Limit for perf

  if (filtered.length === 0 && q) {
    const empty = document.createElement("div");
    empty.className = "px-3 py-2 text-sm text-gray-500 italic";
    empty.textContent = `No matches. Will create "${query}" on submit.`;
    dropdown.appendChild(empty);
    return;
  }

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "px-3 py-2 text-sm text-gray-500";
    empty.textContent = "Start typing to search categories...";
    dropdown.appendChild(empty);
    return;
  }

  filtered.forEach((c) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none cursor-pointer";
    item.textContent = c.category_Name;

    item.addEventListener("click", () => {
      document.getElementById("categoryInput").value = c.category_Name;
      closeDropdown();
    });

    dropdown.appendChild(item);
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const stock = parseInt(form.stockQuantity.value, 10);
  const price = parseFloat(form.price.value);

  if (isNaN(stock) || stock < 0) {
    alert("Please enter a valid stock quantity");
    return;
  }
  if (isNaN(price) || price < 0) {
    alert("Please enter a valid price");
    return;
  }

  const categoryInput = document.getElementById("categoryInput");
  const categoryName = categoryInput.value.trim();

  if (!categoryName) {
    alert("Please select or type a category");
    return;
  }

  let finalCategoryId = null;
  const matched = categories.find(
    (c) => (c.category_Name || "").toLowerCase() === categoryName.toLowerCase()
  );

  const token = localStorage.getItem("token");

  if (matched) {
    finalCategoryId = matched.category_ID;
  } else {
    try {
      const createRes = await fetch("http://localhost:5104/api/product/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ category_Name: categoryName })
      });

      if (!createRes.ok) throw new Error(await createRes.text());

      const newCat = await createRes.json();
      finalCategoryId = newCat.category_ID;
      await fetchCategories(); // Refresh dropdown
    } catch (err) {
      alert("Failed to create new category: " + err.message);
      return;
    }
  }

  const newProduct = {
    product_Name: form.productName.value.trim(),
    description: form.description.value.trim(),
    category_ID: finalCategoryId,
    stock_Quantity: stock,
    price: price
  };

  try {
    const res = await fetch("http://localhost:5104/api/product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newProduct)
    });

    const txt = await res.text();
    if (!res.ok) throw new Error(txt);

    form.reset();
    document.getElementById("categoryDropdown").classList.add("hidden");
    openSuccessModal();
  } catch (err) {
    console.error("Error adding product:", err);
    alert("Failed to add product: " + err.message);
  }
}

function openSuccessModal() {
  document.getElementById("successModal").style.display = "flex";
}

function goToProductList() {
  window.location.href = "/StockPages/Product";
}

function goBack() {
  window.history.back();
}
