document.getElementById("signupForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        clearErrors();

        const data = {
            businessName: val("businessName"),
            email: val("email"),
            businessNumber: val("businessNumber"),
            address: val("address")
        };

        let valid = true;

        if (!/^[a-zA-Z0-9\s.,&\-()']+$/.test(data.businessName)) {
            showError("businessName", "Invalid characters in business name");
            valid = false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            showError("email", "Invalid email format");
            valid = false;
        }

        if (!/^\d{9}$/.test(data.businessNumber)) {
            showError("businessNumber", "Business number must be exactly 9 digits");
            valid = false;
        }

        if (!/^[a-zA-Z0-9\s]+$/.test(data.address)) {
            showError("address", "Address must contain only letters and numbers");
            valid = false;
        }

        if (!valid) return;

        try {
            const res = await fetch(
                "http://localhost:5104/api/auth/check-email",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: data.email })
                }
            );

            const { exists } = await res.json();

            if (exists) {
                showError("email", "This email is already registered.");
                return;
            }

            localStorage.setItem("signupStep1", JSON.stringify(data));
            window.location.href = "/AuthPages/StepTwo";

        } catch (err) {
            console.error("Email check failed:", err);
        }
    });

/* ---------------- HELPERS ---------------- */

function val(id) {
    return document.getElementById(id).value.trim();
}

function showError(field, message) {
    document.getElementById(field + "Error").textContent = message;
    document.getElementById(field + "Error").classList.remove("hidden");

    const fs = document.getElementById(field + "Field");
    fs.classList.remove("border-gray-300");
    fs.classList.add("border-red-500");
}

function clearErrors() {
    ["businessName", "email", "businessNumber", "address"].forEach(f => {
        document.getElementById(f + "Error").classList.add("hidden");
        const fs = document.getElementById(f + "Field");
        fs.classList.remove("border-red-500");
        fs.classList.add("border-gray-300");
    });
}

function goBack() {
    window.history.back();
}
