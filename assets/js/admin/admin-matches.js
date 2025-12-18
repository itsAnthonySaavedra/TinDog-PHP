document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("matches-table-body");
    const token = sessionStorage.getItem("userToken");

    if (!token) {
        window.location.href = "../auth/admin.html";
        return;
    }

    // --- KPIs ---
    const totalEl = document.getElementById("total-matches");
    const newEl = document.getElementById("new-matches");
    const activeEl = document.getElementById("active-matches");
    const inactiveEl = document.getElementById("inactive-matches");
    const endedEl = document.getElementById("ended-matches");

    const loadMatches = async () => {
        try {
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading matches...</td></tr>';

            const response = await fetch("http://127.0.0.1:8000/api/admin/matches", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error("Failed to fetch matches");

            const result = await response.json();
            if (result.success) {
                renderKPIs(result.data.stats);
                renderTable(result.data.matches);
            }

        } catch (error) {
            console.error("Error:", error);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        }
    };

    const renderKPIs = (stats) => {
        if (totalEl) totalEl.textContent = stats.total;
        if (newEl) newEl.textContent = stats.new_this_week;
        if (activeEl) activeEl.textContent = stats.active;
        if (inactiveEl) inactiveEl.textContent = stats.inactive;
        if (endedEl) endedEl.textContent = stats.ended;
    };

    const renderTable = (matches) => {
        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (matches.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No matches found.</td></tr>';
            return;
        }

        matches.forEach(match => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="d-flex align-items-center me-3">
                             <img src="${match.user_1.avatar}" class="rounded-circle border" width="30" height="30" style="object-fit:cover;">
                             <span class="ms-2 fw-bold small">${match.user_1.name}</span>
                        </div>
                        <i class="bi bi-heart-fill text-danger mx-2"></i>
                        <div class="d-flex align-items-center ms-3">
                             <img src="${match.user_2.avatar}" class="rounded-circle border" width="30" height="30" style="object-fit:cover;">
                             <span class="ms-2 fw-bold small">${match.user_2.name}</span>
                        </div>
                    </div>
                </td>
                <td>${match.created_at}</td>
                <td>${match.time_ago}</td>
                <td><span class="badge bg-secondary">0</span></td> <!-- TODO: Count messages -->
                <td>-</td>
                <td><span class="badge bg-success">Active</span></td>
            `;
            tableBody.appendChild(tr);
        });
    };

    loadMatches();
});
