const UserHandler = {
    init: async () => {
        const token = sessionStorage.getItem("userToken");
        if (!token) {
            return;
        }

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
                    // Start Caching for global reuse
                    sessionStorage.setItem("dashboard_cache", JSON.stringify(result.data));
                    sessionStorage.setItem("dashboard_cache_time", Date.now());

                    UserHandler.updateHeader(result.data.user);
                    // Sidebar is handled by sidebar-handler.js
                }
            }
        } catch (error) {
            console.error("UserHandler Error:", error);
        }
    },

    updateHeader: (user) => {
        const headerAvatar = document.querySelector(".header-avatar");
        const headerName = document.querySelector("#navbarUserDropdown span");

        if (headerAvatar) {
            // Determine correct path to assets based on current location
            // If we are in a sub-sub folder (like profile/index.html or matches/index.html), go up 2 levels.
            // If we are in a sub folder (like dashboard.html), go up 1 level.
            const path = window.location.pathname;
            const isDeep = path.includes('/profile/') || path.includes('/matches/') || path.includes('/admin/users/');
            const assetsPath = isDeep ? '../../assets' : '../assets';
            const defaultAvatar = `${assetsPath}/images/default-avatar.png`;

            headerAvatar.src = user.owner_avatar || user.avatar || defaultAvatar;
        }
        if (headerName) headerName.textContent = user.name;
    },
};

document.addEventListener("componentsLoaded", () => {
    UserHandler.init();
});
