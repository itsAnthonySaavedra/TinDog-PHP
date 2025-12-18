document.addEventListener("DOMContentLoaded", async () => {
    const token = DataService.getToken();
    const userId = DataService.getLoggedInUserId();

    if (!token) {
        window.location.href = "../auth/index.html";
        return;
    }

    const blockedListEl = document.querySelector(".container-fluid .list-group"); // Better selector
    const showProfileToggle = document.getElementById("show-on-tindog");
    const downloadBtn = document.querySelector("button.btn-tindog-outline"); // Request Data Button

    // --- Download Data Logic ---
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            downloadBtn.disabled = true;
            downloadBtn.textContent = "Generating...";

            try {
                // Gather Data
                const userData = {
                    profile: await (await fetch(`http://127.0.0.1:8000/api/users/${userId}`, { headers: { "Authorization": `Bearer ${token}` } })).json(),
                    session: {
                        role: sessionStorage.getItem("userRole"),
                        plan: sessionStorage.getItem("userPlan"),
                        token_preview: token.substring(0, 10) + "..."
                    },
                    generated_at: new Date().toISOString()
                };

                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", "tindog_data_export.json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();

                Toast.success("Data export downloaded successfully.");
            } catch (e) {
                console.error("Export failed", e);
                Toast.error("Failed to generate data export.");
            } finally {
                downloadBtn.disabled = false;
                downloadBtn.textContent = "Request Data";
            }
        });
    }

    // --- Profile Visibility ---
    if (showProfileToggle) {
        // 1. Fetch current state
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                showProfileToggle.checked = (data.data.is_visible == 1);
            }
        } catch (e) { console.error(e); }

        // 2. Bind Listener
        showProfileToggle.addEventListener("change", async (e) => {
            try {
                await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ is_visible: e.target.checked })
                });
            } catch (e) { console.error("Failed to update visibility", e); }
        });
    }

    // --- Blocked Users ---
    const loadBlockedUsers = async () => {
        if (!blockedListEl) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/users/blocked`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) {
                // If API fails (e.g. 500), assume no blocked users for now to prevent UI break
                // throw new Error("API Error"); 
                console.warn("Blocked API unavailable, showing empty state.");
                blockedListEl.innerHTML = `<li class="list-group-item text-center text-muted">No blocked users.</li>`;
                return;
            }

            const json = await res.json();
            blockedListEl.innerHTML = ""; // Clear static content

            if (!json.success || !json.data || json.data.length === 0) {
                blockedListEl.innerHTML = `<li class="list-group-item text-center text-muted">No blocked users.</li>`;
                return;
            }

            json.data.forEach(user => {
                const li = document.createElement("li");
                li.className = "list-group-item d-flex align-items-center ps-0";
                li.innerHTML = `
                <img src="${DataService.resolvePath(user.dog_avatar)}" alt="User Avatar" class="nearby-avatar me-3" style="width:40px;height:40px;object-fit:cover;border-radius:50%;">
                <div class="me-auto">
                  <h6 class="mb-0">${user.display_name}</h6>
                  <small class="text-muted">Blocked</small>
                </div>
                <button class="btn btn-sm btn-outline-secondary unblock-btn" data-id="${user.id}">
                  Unblock
                </button>
            `;
                blockedListEl.appendChild(li);
            });

            // Bind Unblock Buttons
            document.querySelectorAll(".unblock-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const id = e.target.dataset.id;
                    await unblockUser(id);
                });
            });

        } catch (e) {
            console.error("Error loading blocked users:", e);
            blockedListEl.innerHTML = `<li class="list-group-item text-center text-muted">No blocked users found.</li>`;
        }
    };

    const unblockUser = async (id) => {
        if (!confirm("Unblock this user?")) return;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/users/${id}/unblock`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                loadBlockedUsers(); // Refresh
            } else {
                Toast.error("Failed to unblock.");
            }
        } catch (e) {
            Toast.error("Connection error.");
        }
    };

    loadBlockedUsers();
});
