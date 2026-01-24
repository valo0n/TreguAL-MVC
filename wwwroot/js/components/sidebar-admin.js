document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;

    document.querySelectorAll(".sidebar-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.remove("text-white");
            link.classList.add("text-amber-500");
        }
    });

    document.querySelectorAll(".mobile-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.remove("text-white");
            link.classList.add("text-amber-500");
        }
    });
});

function toggleMobileSidebar() {
    const menu = document.getElementById("mobileSidebar");
    if (menu) menu.classList.toggle("hidden");
}
