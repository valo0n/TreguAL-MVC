document.getElementById("addCustomerForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const form = e.target;

        const data = {
            full_Name: form.full_Name.value.trim(),
            email: form.email.value.trim(),
            phone_Number: form.phone_Number.value.trim(),
            address: form.address.value.trim()
        };

        if (!data.full_Name || !data.email || !data.phone_Number || !data.address) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:5104/api/customer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const text = await res.text();
            if (!res.ok) throw new Error(text);

            form.reset();
            openSuccessModal();

        } catch (err) {
            console.error("Error adding customer:", err);
            alert("Failed to add customer");
        }
    });

function openSuccessModal() {
    document.getElementById("successModal").classList.remove("hidden");
}

function goToCustomerList() {
    window.location.href = "/UserPages/Customer";
}

function goBack() {
    window.history.back();
}
