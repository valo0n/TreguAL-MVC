document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch("http://localhost:5104/api/user/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("Failed to fetch user info");
            return;
        }

        const data = await response.json();

        const nameEl = document.getElementById("headerBusinessName");
        const numberEl = document.getElementById("headerBusinessNumber");

        if (nameEl) nameEl.textContent = data.businessName || "";
        if (numberEl) numberEl.textContent = data.businessNumber || "";

    } catch (err) {
        console.error("Header fetch error:", err);
    }
});
