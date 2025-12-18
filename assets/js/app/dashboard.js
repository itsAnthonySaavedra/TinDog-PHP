document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("userToken");
  if (!token) {
    window.location.href = "../auth/index.html";
    return;
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/user/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          updateDashboardUI(result.data);
        }
      } else {
        console.error("Failed to fetch dashboard data");
        if (response.status === 401) {
          // Token invalid or expired
          sessionStorage.removeItem("userToken");
          // Go up one level from /app/ to root, then to /auth/
          window.location.href = "../auth/index.html";
        }
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  const updateDashboardUI = (data) => {
    // 1. Greeting
    const greetingElement = document.getElementById("welcome-greeting");
    if (greetingElement) greetingElement.textContent = data.greeting;

    // 2. Stats
    document.querySelector(".kpi-card.matches .kpi-value").textContent = data.stats.newMatches;
    document.querySelector(".kpi-card.messages .kpi-value").textContent = data.stats.unreadMessages;
    document.querySelector(".kpi-card.messages .kpi-caption").textContent = `from ${data.stats.unreadConversations} conversations`;
    document.querySelector(".kpi-card.views .kpi-value").textContent = data.stats.profileViews;
    document.querySelector(".kpi-card.plan .kpi-value").textContent = data.stats.currentPlan;

    // 3. Pups Nearby
    renderPupsNearby(data.pupsNearby);

    // 4. Tip of the Day
    const tipElement = document.getElementById("dog-tip-of-the-day");
    if (tipElement) tipElement.textContent = data.tip;

    // 5. Update Sidebar (if handler exists)
    if (typeof SidebarHandler !== 'undefined') {
      SidebarHandler.updateUI(data.user);
    }
  };

  const renderPupsNearby = (pups) => {
    const container = document.getElementById("pups-nearby-component");
    if (!container) return;

    if (!pups || pups.length === 0) {
      container.innerHTML = `
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-transparent border-0">
                <h5 class="mb-0 fw-bold">Pups Nearby</h5>
            </div>
            <div class="card-body text-center d-flex flex-column align-items-center justify-content-center py-5">
                <div class="mb-3 p-3 bg-light rounded-circle">
                    <i class="bi bi-geo-alt-fill text-muted fs-1"></i>
                </div>
                <h6 class="text-muted mb-1">No pups nearby right now</h6>
                <p class="text-muted small mb-3">Expand your search area or try again later.</p>
                <a href="./find.html" class="btn btn-sm btn-outline-tindog-primary rounded-pill px-4">Find Matches</a>
            </div>
        </div>
      `;
      return;
    }

    const pupsList = pups
      .map(
        (pup) => `
      <div class="d-flex align-items-center justify-content-between mb-3">
        <div class="d-flex align-items-center">
          <img src="${pup.avatar || '../assets/images/default-avatar.png'}" class="rounded-circle me-3" width="50" height="50" style="object-fit: cover;">
          <div>
            <h6 class="mb-0">${pup.name}</h6>
            <small class="text-muted">${pup.distance}</small>
          </div>
        </div>
        <button class="btn btn-sm btn-tindog-primary rounded-pill px-3">View</button>
      </div>
    `
      )
      .join("");

    container.innerHTML = `
      <div class="card h-100">
        <div class="card-header bg-transparent border-0">
          <h5 class="mb-0">Pups Nearby</h5>
        </div>
        <div class="card-body">
          ${pupsList}
        </div>
      </div>
    `;
  };

  fetchDashboardData();
});
