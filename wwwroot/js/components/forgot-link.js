document.getElementById("forgotForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const emailInput = document.getElementById("emailInput");
        const errorEl = document.getElementById("emailError");
        const fieldset = document.getElementById("emailFieldset");

        const email = emailInput.value.trim();

        // Reset error
        errorEl.classList.add("hidden");
        fieldset.classList.remove("border-red-500");
        fieldset.classList.add("border-gray-300");

        if (!email) {
            errorEl.classList.remove("hidden");
            fieldset.classList.remove("border-gray-300");
            fieldset.classList.add("border-red-500");
            return;
        }

        try {
            const res = await fetch("http://localhost:5104/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const text = await res.text();

            if (!res.ok) {
                alert(`Error: ${text}`);
            } else {
                alert(text);
                emailInput.value = "";
            }

        } catch (err) {
            console.error("Error submitting email:", err);
            alert("Something went wrong. Please try again.");
        }
    });

function goBack() {
    window.history.back();
}
