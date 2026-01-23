document.addEventListener("DOMContentLoaded", () => {
    const customerId = getCustomerIdFromUrl();
    if (!customerId) {
        alert("Invalid customer ID");
        return;
    }

    fetchCustomer(customerId);

    document
        .getElementById("editCustomerForm")
        .addEventListener("submit", e => handleSubmit(e, customerId));
});

/* ---------------- HELPERS ---------------- */

function getCustomerIdFromUrl() {
    // /UserPages/EditCustomer/5
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1];
}

/* ---------------- FETCH CUSTOMER ---------------- */

async function fetchCustomer(id) {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5104/api/customer/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        document.getElementById("full_Name").value = data.full_Name || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phone_Number").value = data.phone_Number || "";
        document.getElementById("address").value = data.address || "";

    } catch (err) {
        console.error("Error fetching customer:", err);
        alert("Failed to load customer details.");
    }
}

/* ---------------- SUBMIT ---------------- */

async function handleSubmit(e, id) {
    e.preventDefault();

    const customer = {
        full_Name: document.getElementById("full_Name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone_Number: document.getElementById("phone_Number").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5104/api/customer/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(customer)
        });

        if (!res.ok) throw new Error();

        showSuccessPopup();

        setTimeout(() => {
            window.location.href = "/UserPages/Customer";
        }, 2000);

    } catch (err) {
        console.error("Error updating customer:", err);
        alert("Failed to update customer.");
    }
}

/* ---------------- UI ---------------- */

function showSuccessPopup() {
    const popup = document.getElementById("successPopup");
    popup.classList.remove("hidden");
}

function goBack() {
    window.history.back();
}
