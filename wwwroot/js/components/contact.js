function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("hidden");
}

document.getElementById("contactForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const btn = document.getElementById("submitBtn");
        btn.disabled = true;
        btn.textContent = "Sending...";

        const form = e.target;
        const payload = {
            email: form.email.value.trim(),
            message: form.message.value.trim()
        };

        try {
            const res = await fetch("http://localhost:5104/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.text();
                alert("Failed to submit: " + err);
            } else {
                alert("Message submitted successfully!");
                form.reset();
            }
        } catch (err) {
            console.error("Error submitting message:", err);
            alert("An error occurred. Please try again.");
        }

        btn.disabled = false;
        btn.textContent = "Submit";
    });
