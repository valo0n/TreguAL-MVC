async function saveDetails() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const details = {
        address: document.getElementById("address").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        transitNumber: document.getElementById("transitNumber").value
    };

    try {
        const res = await fetch("http://localhost:5104/api/Settings/update-details", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(details)
        });

        if (!res.ok) throw new Error();

        alert("Details updated successfully.");
    } catch {
        alert("Failed to update details.");
    }
}

async function savePassword() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const messageEl = document.getElementById("passwordMessage");
    const btn = document.getElementById("savePasswordBtn");

    if (!currentPassword) {
        showPasswordMessage("Please enter your current password.", false);
        return;
    }

    if (!newPassword) {
        showPasswordMessage("Please enter a new password.", false);
        return;
    }

    if (newPassword !== confirmPassword) {
        showPasswordMessage("New passwords do not match.", false);
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = "Saving...";

        const res = await fetch("http://localhost:5104/api/Settings/update-password", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                CurrentPassword: currentPassword,
                NewPassword: newPassword
            })
        });

        const text = await res.text();

        if (!res.ok) throw new Error(text);

        showPasswordMessage("Password updated successfully.", true);

        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
    } catch (err) {
        showPasswordMessage(err.message || "Failed to update password.", false);
    } finally {
        btn.disabled = false;
        btn.textContent = "Save";
    }
}

function showPasswordMessage(message, success) {
    const el = document.getElementById("passwordMessage");
    el.textContent = message;
    el.classList.remove("hidden", "bg-green-500", "bg-red-500");
    el.classList.add(success ? "bg-green-500" : "bg-red-500");
}
