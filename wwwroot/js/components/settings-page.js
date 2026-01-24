document.addEventListener("DOMContentLoaded", () => {
    const role = localStorage.getItem("role");
    const container = document.getElementById("sidebarContainer");

    if (role === "Admin") {
        container.innerHTML = `
            <div id="adminSidebar"></div>
        `;
        fetch("/Partials/SidebarAdmin")
            .then(r => r.text())
            .then(html => {
                document.getElementById("adminSidebar").innerHTML = html;
            });

    } else {
        container.innerHTML = `
            <div id="userSidebar"></div>
        `;
        fetch("../Partials/SidebarUser")
            .then(r => r.text())
            .then(html => {
                document.getElementById("userSidebar").innerHTML = html;
            });
    }
});
