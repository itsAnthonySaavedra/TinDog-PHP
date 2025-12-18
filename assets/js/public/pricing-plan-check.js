document.addEventListener("DOMContentLoaded", () => {
    const identifyCurrentPlan = async () => {
        // Ensure DataService is loaded
        if (typeof DataService === 'undefined') {
            console.error("DataService not found!");
            document.querySelectorAll('.pricing-card-body-content').forEach(el => el.style.visibility = 'visible');
            return;
        }

        const token = DataService.getToken();

        // --- 1. BACK BUTTON LOGIC ---
        if (token) {
            const container = document.querySelector('.container');
            if (container && !document.getElementById('back-to-dashboard-btn')) {
                const backBtn = document.createElement('a');
                backBtn.id = 'back-to-dashboard-btn';
                backBtn.href = "../app/dashboard.html";
                backBtn.className = "btn btn-outline-secondary mb-3";
                backBtn.innerHTML = '<i class="bi bi-arrow-left"></i> Back to Dashboard';
                container.insertBefore(backBtn, container.firstChild);
            }
        }

        // --- 2. PLAN CHECK LOGIC ---
        try {
            if (!token) {
                // Not logged in: defaults are fine
                return;
            }

            let currentPlan = sessionStorage.getItem("userPlan");

            // Fetch fresh if needed or always to be safe
            try {
                const response = await fetch("http://127.0.0.1:8000/api/user/me", {
                    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.plan) {
                        currentPlan = data.data.plan;
                        sessionStorage.setItem("userPlan", currentPlan);
                    }
                }
            } catch (e) {
                console.warn("Pricing: Failed to refresh plan from API, using storage", e);
            }

            if (!currentPlan) return; // Fallback to defaults

            currentPlan = currentPlan.toLowerCase().trim();
            console.log("Current Plan Identified:", currentPlan);

            const prices = { 'chihuahua': 0, 'labrador': 49, 'mastiff': 99 };
            const currentPrice = prices[currentPlan] ?? 0;

            const planLinks = document.querySelectorAll("a[href*='?plan=']");

            planLinks.forEach(link => {
                // Rewrite HREF for logged-in users to point to checkout
                const href = link.getAttribute('href');
                const url = new URL(href, window.location.origin);
                const targetPlan = url.searchParams.get('plan').toLowerCase().trim();
                const targetPrice = prices[targetPlan] ?? 0;

                // Default state is register.html, we change it to checkout.html if logged in
                const newHref = `../auth/checkout.html?plan=${targetPlan}`;
                link.href = newHref;
                link.dataset.originalHref = newHref;

                if (targetPlan === currentPlan) {
                    // Current Plan
                    link.classList.add("disabled", "btn-secondary");
                    link.classList.remove("btn-outline-dark", "btn-dark", "btn-tindog-primary", "btn-primary", "btn-tindog-outline");
                    link.textContent = "Current Plan";
                    link.style.pointerEvents = "none";
                    link.removeAttribute("href"); // Better than href="#"
                } else {
                    // Upgrade/Downgrade
                    link.classList.remove("disabled", "btn-secondary", "btn-outline-dark", "btn-tindog-primary", "btn-tindog-outline");
                    link.style.pointerEvents = "auto";

                    if (targetPrice > currentPrice) {
                        link.textContent = "Upgrade";
                        link.classList.add("btn-tindog-primary");
                    } else {
                        link.textContent = "Downgrade";
                        link.classList.add("btn-outline-dark");
                    }
                }
            });

        } catch (error) {
            console.error("Pricing Logic Error:", error);
        } finally {
            // Always reveal content
            document.querySelectorAll('.pricing-card-body-content').forEach(el => el.style.visibility = 'visible');
        }
    };

    identifyCurrentPlan();
});
