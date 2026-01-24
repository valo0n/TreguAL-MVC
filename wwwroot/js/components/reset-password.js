document.getElementById("resetForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        clearErrors();
        hideMessage();

        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) {
            alert("Reset token missing.");
            return;
        }

        const password = document.getElementById("password").value.trim();
        const confirmPassword =
            document.getElementById("confirmPassword").value.trim();

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        let valid = true;

        if (!password) {
            showError("password", "Password is required");
            valid = false;
        } else if (!passwordRegex.test(password)) {
            showError(
                "password",
                "Password must be at least 8 characters, include one uppercase letter and one number"
            );
            valid = false;
        }

        if (!confirmPassword) {
            showError("confirmPassword", "Please confirm your password");
            valid = false;
        } else if (password !== confirmPassword) {
            showError("confirmPassword", "Passwords do not match");
            valid = false;
        }

        if (!valid) return;

        try {
            const res = await fetch(
                "http://localhost:5104/api/auth/reset-password",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        token: token,
                        newPassword: password
                    })
                }
            );

            const text = await res.text();

            if (res.ok) {
                showMessage("Password reset successful!");
                setTimeout(() => {
                    window.location.href = "/AuthPages/Login";
                }, 2000);
            } else {
                showMessage(`Error: ${text}`);
            }

        } catch (err) {
            console.error(err);
            showMessage("Something went wrong.");
        }
    });

/* ---------------- UI HELPERS ---------------- */

function showError(field, message) {
    document.getElementById(field + "Error").textContent = message;
    document.getElementById(field + "Error").classList.remove("hidden");

    const fs = document.getElementById(field + "Field");
    fs.classList.remove("border-gray-300");
    fs.classList.add("border-red-500");
}

function clearErrors() {
    ["password", "confirmPassword"].forEach(f => {
        document.getElementById(f + "Error").classList.add("hidden");
        const fs = document.getElementById(f + "Field");
        fs.classList.remove("border-red-500");
        fs.classList.add("border-gray-300");
    });
}

function showMessage(text) {
    const m = document.getElementById("message");
    m.textContent = text;
    m.classList.remove("hidden");
}

function hideMessage() {
    document.getElementById("message").classList.add("hidden");
}
