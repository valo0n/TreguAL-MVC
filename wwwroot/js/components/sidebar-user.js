document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const role = localStorage.getItem("role");

    // Active link (desktop)
    document.querySelectorAll(".user-sidebar-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.remove("text-white");
            link.classList.add("text-amber-500");
        }
    });

    // Active link (mobile)
    document.querySelectorAll(".user-mobile-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.remove("text-white");
            link.classList.add("text-amber-500");
        }
    });

    // Show Admin Panel if role === Admin
    if (role === "Admin") {
        const adminDesktop = document.getElementById("adminPanelLink");
        const adminMobile = document.getElementById("adminPanelMobileLink");
        if (adminDesktop) adminDesktop.classList.remove("hidden");
        if (adminMobile) adminMobile.classList.remove("hidden");
    }
});

function toggleUserMobileSidebar() {
    const menu = document.getElementById("userMobileSidebar");
    if (menu) menu.classList.toggle("hidden");
}
