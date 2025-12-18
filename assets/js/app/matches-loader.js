document.addEventListener("DOMContentLoaded", () => {
  const matchesContainer = document.querySelector("#matches-grid");
  const matchesCount = document.querySelector(".matches-count");

  const initMatchesLoader = async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    if (matchesContainer) {
      matchesContainer.innerHTML = `
            <div class="col-12 text-center mt-5">
                <div class="spinner-border text-danger" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Finding your matches...</p>
            </div>
        `;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/matches", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          renderMatches(result.data);
        }
      }
    } catch (error) {
      console.error("Matches Load Error:", error);
    }
  };

  const renderMatches = (matches) => {
    if (!matchesContainer) return;
    matchesContainer.innerHTML = "";

    if (matchesCount) {
      matchesCount.textContent = `${matches.length} Match${matches.length !== 1 ? 'es' : ''}`;
    }

    if (matches.length === 0) {
      matchesContainer.innerHTML = `
        <div class="col-12 text-center mt-5">
          <div class="empty-state">
            <i class="bi bi-heartbreak display-1 text-muted"></i>
            <h3 class="mt-3">No matches yet</h3>
            <p class="text-muted">Start swiping to find your pup's new best friend!</p>
            <a href="./find.html" class="btn btn-tindog-primary mt-3">Find Matches</a>
          </div>
        </div>
      `;
      return;
    }

    matches.forEach((match) => {
      const matchCard = document.createElement("div");
      matchCard.classList.add("col");

      // Calculate time ago (simple version)
      const matchDate = new Date(match.created_at);
      const now = new Date();
      const diffTime = Math.abs(now - matchDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const timeAgo = diffDays === 1 ? 'Today' : `${diffDays} days ago`;

      matchCard.innerHTML = `
        <a href="#" class="text-decoration-none" onclick="event.preventDefault(); window.ProfileModal.open('${match.user.id}', { mode: 'full' })">
          <div class="card h-100 match-card border-0 shadow-sm">
            <div class="position-relative">
              <img src="${DataService.resolvePath(match.user.avatar) || DataService.resolvePath('assets/images/default-avatar.png')}" class="card-img-top" alt="${match.user.name}" style="height: 200px; object-fit: cover;">
              <div class="match-badge">
                <span class="badge bg-tindog-primary position-absolute top-0 end-0 m-2">
                  <i class="bi bi-person-lines-fill me-1"></i> View Profile
                </span>
              </div>
            </div>
            <div class="card-body text-center">
              <h5 class="card-title text-dark mb-1">${match.user.name}</h5>
              <p class="card-text text-muted small mb-0">Matched ${timeAgo}</p>
            </div>
          </div>
        </a>
      `;

      matchesContainer.appendChild(matchCard);
    });
  };

  initMatchesLoader();
});
