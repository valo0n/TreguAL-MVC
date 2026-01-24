document.getElementById("loginForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        clearErrors();

        if (!email) {
            showError("email", "Email is required");
            return;
        }

        if (!password) {
            showError("password", "Password is required");
            return;
        }

        try {
            const res = await fetch("http://localhost:5104/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const text = await res.text();
                alert(`Login failed: ${text}`);
                return;
            }

            const data = await res.json();

            // Save tokens
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("role", data.role);

            // Dispatch login event (same as React)
            window.dispatchEvent(new CustomEvent("user-logged-in", {
                detail: {
                    token: data.token,
                    refreshToken: data.refreshToken,
                    role: data.role,
                    timestamp: new Date().toISOString()
                }
            }));

            // Redirect
            if (data.role === "Admin") {
                window.location.href = "/AdminPages/Dashboard";
            } else {
                window.location.href = "/UserPages/UserDashboard";
            }

        } catch (err) {
            console.error("Login error:", err);
            alert("Something went wrong. Please try again.");
        }
    });

function showError(field, message) {
    document.getElementById(field + "Error").textContent = message;
    document.getElementById(field + "Error").classList.remove("hidden");

    const fieldset = document.getElementById(field + "Field");
    fieldset.classList.remove("border-gray-300");
    fieldset.classList.add("border-red-500");
}

function clearErrors() {
    ["email", "password"].forEach(f => {
        document.getElementById(f + "Error").classList.add("hidden");
        const fieldset = document.getElementById(f + "Field");
        fieldset.classList.remove("border-red-500");
        fieldset.classList.add("border-gray-300");
    });
}

function goBack() {
    window.location.href = "/PublicPages/Landingpage";
}
