document.addEventListener("DOMContentLoaded", () => {
    localStorage.removeItem("token"); // Sigurohuni që tokeni të fshihet në load (security best practice)
    // =========================
    // AUTH UI HANDLING
    // =========================
    const signUpBtn = document.getElementById("signUpBtn");
    const loginBtn = document.getElementById("loginBtn");

    const token = localStorage.getItem("token");

    // Mos e fshij token automatikisht (security + UX best practice)
    if (!token) {
        if (signUpBtn) signUpBtn.style.display = "none";
        if (loginBtn) loginBtn.style.display = "none";
    }

    // =========================
    // CONTACT FORM HANDLING
    // =========================
    const form = document.getElementById("contactForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!submitBtn) return;

        // UX feedback
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        const payload = {
            email: form.email?.value.trim(),
            message: form.message?.value.trim()
        };

        // Client-side validation (fast-fail)
        if (!payload.email || !payload.message) {
            alert("Please fill in all required fields.");
            resetButton();
            return;
        }

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                alert(data?.message || "Failed to submit message.");
                return;
            }

            alert("Message submitted successfully!");
            form.reset();
        } catch (error) {
            console.error("Contact form error:", error);
            alert("Server error. Please try again later.");
        } finally {
            resetButton();
        }
    });

    function resetButton() {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
    }
});

// =========================
// MOBILE MENU
// =========================
function toggleMenu() {
    const menu = document.getElementById("mobileMenu");
    if (menu) {
        menu.classList.toggle("hidden");
    }
}
