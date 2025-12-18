// Encapsulated Billing Logic
const TinDogBilling = (() => {
  // DOM Elements
  const elements = {
    planName: document.getElementById("billing-plan-name"),
    planPrice: document.getElementById("billing-plan-price"),
    planCycle: document.getElementById("billing-plan-cycle"),
    renewalDate: document.getElementById("billing-renewal-date"),
    historyTable: document.getElementById("billing-history-body"), // Updated ID selector
    paymentMethod: document.getElementById("payment-method-text") ? document.getElementById("payment-method-text").closest(".card-body") : null,
    btnChangePlan: document.querySelector("a[href*='pricing.html']"),
    btnCancelPlan: document.querySelector("a.btn-outline-danger"),
  };
  // ...
  // Bind Update Payment Method (Mock)
  const btnUpdatePayment = document.getElementById("btn-update-payment"); // Explicit ID
  if (btnUpdatePayment) {
    btnUpdatePayment.onclick = null; // Verify clear
    btnUpdatePayment.addEventListener('click', (e) => {
      e.preventDefault();
      Toast.info("Payment Stripe Integration is coming soon!");
    });
  }

  // State
  let currentUser = null;

  // --- API Calls ---
  const fetchUserAndInvoices = async () => {
    try {
      const token = DataService.getToken();
      if (!token) {
        console.error("No token found for billing");
        return null;
      }

      // Fetch User for Plan Status
      const userRes = await fetch("http://127.0.0.1:8000/api/user/me", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const userData = await userRes.json();

      // Fetch Invoices
      const invoiceRes = await fetch("http://127.0.0.1:8000/api/user/invoices", {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
      });
      const invoices = await invoiceRes.json();

      return { user: userData.data, invoices: invoices };
    } catch (error) {
      console.error("Billing fetch error:", error);
      return null;
    }
  };

  // Helper for Toasts
  // Uses window.Toast from toast-service.js


  const cancelSubscription = async () => {
    try {
      const token = DataService.getToken();
      const res = await fetch("http://127.0.0.1:8000/api/subscription/cancel", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        Toast.success("Subscription cancelled. You are now on the Free plan.");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        Toast.error("Failed to cancel subscription.");
      }
    } catch (error) {
      console.error("Cancel API error:", error);
      Toast.error("Connection error.");
    }
  };

  // --- Render Logic ---
  const renderPlan = (user) => {
    const plan = user.plan || "chihuahua";
    const plans = {
      chihuahua: { name: "Chihuahua (Free)", price: "₱0", cycle: "/mo" },
      labrador: { name: "Labrador", price: "₱49", cycle: "/mo" },
      mastiff: { name: "Mastiff", price: "₱99", cycle: "/mo" },
    };

    const details = plans[plan] || plans.chihuahua;

    if (elements.planName) elements.planName.textContent = details.name;
    if (elements.planPrice) elements.planPrice.textContent = details.price;
    if (elements.planCycle) elements.planCycle.textContent = details.cycle;

    if (elements.renewalDate) {
      if (plan === "chihuahua" || user.plan_status === 'cancelled') {
        elements.renewalDate.textContent = "No active renewal.";
        if (elements.btnCancelPlan) elements.btnCancelPlan.style.display = 'none';
      } else {
        const date = new Date(user.next_billing_date);
        elements.renewalDate.textContent = `Renews on ${date.toLocaleDateString()}`;
        if (elements.btnCancelPlan) elements.btnCancelPlan.style.display = 'inline-block';
      }
    }
  };

  const renderInvoices = (invoices) => {
    if (!elements.historyTable) return;
    elements.historyTable.innerHTML = "";

    if (!invoices || invoices.length === 0) {
      elements.historyTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No billing history found.</td></tr>`;
      return;
    }

    // Sort by newest first
    invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    invoices.forEach(inv => {
      const date = new Date(inv.created_at).toLocaleDateString();
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${date}</td>
                <td>${inv.description || "Subscription Payment"}</td>
                <td class="text-end">₱${inv.amount}</td>
                <td class="text-end"><span class="badge text-bg-success">${inv.status}</span></td>
                <td class="text-end">
                    <a href="invoice.html?id=${inv.id}" class="btn btn-sm btn-outline-secondary">
                        <i class="bi bi-download me-1"></i>Invoice
                    </a>
                </td>
            `;
      elements.historyTable.appendChild(tr);
    });
  };

  // --- Init ---
  const init = async () => {
    const data = await fetchUserAndInvoices();
    if (data) {
      currentUser = data.user;
      renderPlan(data.user);
      renderInvoices(data.invoices);

      // Bind Cancel Button
      if (elements.btnCancelPlan) {
        elements.btnCancelPlan.addEventListener("click", (e) => {
          e.preventDefault();
          // Show Bootstrap Modal
          const modalEl = document.getElementById('cancelModal');
          if (modalEl && window.bootstrap) {
            const modal = new window.bootstrap.Modal(modalEl);
            modal.show();

            const confirmBtn = document.getElementById('confirm-cancel-btn');
            // Remove old listener to prevent duplicates
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

            newBtn.addEventListener('click', () => {
              modal.hide();
              cancelSubscription();
            });
          }
        });
      }

      // Bind Update Payment Method (Mock)
      const btnUpdatePayment = document.querySelector("button.btn-outline-secondary");
      if (btnUpdatePayment) {
        btnUpdatePayment.onclick = null; // Remove inline
        btnUpdatePayment.addEventListener('click', () => {
          Toast.info("Payment Stripe Integration is coming soon!");
        });
      }

    } else {
      // Handle Error State (stop loading spinner)
      if (elements.planName) elements.planName.textContent = "Error";
      if (elements.planPrice) elements.planPrice.textContent = "-";
      Toast.error("Failed to load billing details.");
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  TinDogBilling.init();
});
