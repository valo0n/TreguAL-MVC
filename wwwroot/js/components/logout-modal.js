function openLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) modal.classList.remove("hidden");
}

function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) modal.classList.add("hidden");
}

async function confirmLogout() {
    const token = localStorage.getItem("token");

    try {
        await fetch("http://localhost:5104/api/auth/logout", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error("Failed to log logout activity:", error);
    }

    // Clear auth & redirect
    localStorage.removeItem("token");
    window.location.href = "/AuthPages/Login";
}
