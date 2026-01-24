document.getElementById("stepTwoForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();
        clearErrors();

        const phone = val("phone");
        const transit = val("transit");
        const password = val("password");
        const confirmPassword = val("confirmPassword");

        let valid = true;

        if (!phone) {
            showError("phone", "Phone number is required");
            valid = false;
        }

        if (!transit) {
            showError("transit", "Transit number is required");
            valid = false;
        }

        if (!password) {
            showError("password", "Password is required");
            valid = false;
        }

        if (!confirmPassword) {
            showError("confirmPassword", "Please confirm your password");
            valid = false;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (password && !passwordRegex.test(password)) {
            showError(
                "password",
                "Password must be at least 8 characters, include one uppercase letter and one number"
            );
            valid = false;
        }

        if (password && confirmPassword && password !== confirmPassword) {
            showError("confirmPassword", "Passwords do not match");
            valid = false;
        }

        if (!valid) return;

        try {
            const raw = localStorage.getItem("signupStep1");
            if (!raw) {
                alert("Step 1 data missing. Please restart signup.");
                window.location.href = "/AuthPages/SignUpForm";
                return;
            }

            const step1 = JSON.parse(raw);

            const payload = {
                businessName: step1.businessName,
                email: step1.email,
                businessNumber: step1.businessNumber,
                address: step1.address,
                phone: phone,
                transit: transit,
                password: password
            };

            const res = await fetch("http://localhost:5104/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.text();
                alert(`Error: ${err}`);
                return;
            }

            const data = await res.json();

            localStorage.removeItem("signupStep1");
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);

            if (data.role === "Admin") {
                window.location.href = "/AdminPages/Dashboard";
            } else {
                window.location.href = "/UserPages/UserDashboard";
            }

        } catch (err) {
            console.error("Registration failed:", err);
            alert("Registration failed. Try again.");
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
    ["phone", "transit", "password", "confirmPassword"].forEach(f => {
        document.getElementById(f + "Error").classList.add("hidden");
        const fs = document.getElementById(f + "Field");
        fs.classList.remove("border-red-500");
        fs.classList.add("border-gray-300");
    });
}

function goBack() {
    window.history.back();
}
