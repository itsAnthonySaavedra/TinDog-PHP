document.addEventListener("DOMContentLoaded", () => {
  const initHeaderNotifications = async () => {
    const badge = document.getElementById("notification-badge");
    const itemsContainer = document.getElementById("notification-items");
    const token = DataService.getToken();

    if (!badge || !itemsContainer || !token) return;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const res = await response.json();

      const notifications = res.data || [];

      if (notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = "block";
      } else {
        badge.style.display = "none";
      }

      if (notifications.length === 0) {
        itemsContainer.innerHTML = `<li><p class="text-muted text-center my-2">No new notifications</p></li>`;
      } else {
        itemsContainer.innerHTML = notifications.map((n) => {
          const isMatch = n.type === "match";
          const iconClass = isMatch
            ? "bi-heart-fill text-danger"
            : "bi-chat-dots-fill text-primary";

          const link = isMatch
            ? "./matches/index.html" // Simplified path, assumes relative from current page might need absolute
            : `./messages.html?user=${n.user.id}`; // Assumes messages.html is in same dir or root app dir.
          // Better to use absolute paths:
          const absoluteLink = isMatch ? "/app/matches/index.html" : `/app/messages.html?user=${n.user.id}`;

          return `
                <li>
                  <a class="dropdown-item d-flex align-items-start py-2" href="${absoluteLink}">
                    <i class="bi ${iconClass} me-2 mt-1"></i>
                    <div>
                      ${n.message}
                      <small class="d-block text-muted">${n.time}</small>
                    </div>
                  </a>
                </li>
              `;
        }).join("");
      }
    } catch (e) {
      console.error("Notification load failed", e);
      itemsContainer.innerHTML = `<li><p class="text-danger text-center my-2">Failed to load</p></li>`;
    }
  };

  document.addEventListener("componentsLoaded", initHeaderNotifications, {
    once: true,
  });
});
