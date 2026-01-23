document.addEventListener("DOMContentLoaded", async () => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    // Sidebar switch
    const sidebarContainer = document.getElementById("sidebarContainer");
    if (role === "Admin") {
        fetch("/Views/Partials/_SidebarAdmin.cshtml")
            .then(r => r.text())
            .then(html => sidebarContainer.innerHTML = html);
    } else {
        fetch("/Views/Partials/_SidebarUser.cshtml")
            .then(r => r.text())
            .then(html => sidebarContainer.innerHTML = html);
    }

    if (!token) return;

    // Fetch user info
    try {
        const res = await fetch("http://localhost:5104/api/user/me", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();

        document.getElementById("emailInput").value = data.email || "";

        if (data.businessName || data.businessNumber) {
            document.getElementById("businessName").textContent = data.businessName || "";
            document.getElementById("businessNumber").textContent = data.businessNumber || "";
            document.getElementById("userInfoBox").classList.remove("hidden");
        }

    } catch (err) {
        console.error("Failed to fetch user info:", err);
    }
});

// Submit
document.getElementById("contactDashboardForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const btn = document.getElementById("submitBtn");
        btn.disabled = true;
        btn.textContent = "Sending...";

        const payload = {
            email: document.getElementById("emailInput").value,
            message: document.getElementById("messageInput").value.trim()
        };

        try {
            const res = await fetch("http://localhost:5104/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            alert("Message submitted successfully!");
            document.getElementById("messageInput").value = "";

        } catch (err) {
            alert("Failed to submit message.");
            console.error(err);
        }

        btn.disabled = false;
        btn.textContent = "Submit";
    });
