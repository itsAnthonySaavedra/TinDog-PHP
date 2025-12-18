document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');

    if (!invoiceId) {
        alert("Invalid Invoice ID");
        return;
    }

    if (typeof DataService === 'undefined') {
        console.error("DataService not loaded");
        // Fallback or just let it fail to console
        return;
    }

    const token = DataService.getToken();
    if (!token) {
        window.location.href = "../auth/index.html";
        return;
    }

    try {
        // 1. Fetch Invoice Details
        const invResponse = await fetch(`http://127.0.0.1:8000/api/user/invoices/${invoiceId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (!invResponse.ok) throw new Error("Invoice not found");
        const invoice = await invResponse.json();

        // 2. Fetch User Details for "Bill To"
        const userResponse = await fetch(`http://127.0.0.1:8000/api/user/me`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });
        const user = await userResponse.json(); // If fails, we just use placeholders

        // 3. Render
        document.getElementById("inv-id").textContent = String(invoice.id).padStart(4, '0');

        const date = new Date(invoice.created_at).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
        });
        document.getElementById("inv-date").textContent = date;

        // Status
        const statusEl = document.getElementById("inv-status");
        statusEl.textContent = invoice.status;
        statusEl.className = `invoice-status status-${invoice.status}`;

        // User
        if (user && user.success && user.data) {
            const userData = user.data;
            document.getElementById("inv-user-name").textContent = userData.first_name + " " + userData.last_name;
            document.getElementById("inv-user-email").textContent = userData.email;
        }

        // Items
        const tbody = document.getElementById("inv-items");
        tbody.innerHTML = `
            <tr>
                <td class="py-3">
                    <div class="fw-bold text-dark">${invoice.description}</div>
                    <small class="text-muted">Premium Subscription Service</small>
                </td>
                <td class="text-end py-3">1 Month</td>
                <td class="text-end py-3 fw-bold">₱${invoice.amount}</td>
            </tr>
        `;

        document.getElementById("inv-total").textContent = `₱${invoice.amount}`;

    } catch (error) {
        console.error("Invoice Error:", error);
        document.body.innerHTML = `<div class="p-5 text-center text-danger"><h3>Error loading invoice</h3><p>${error.message}</p></div>`;
    }
});
