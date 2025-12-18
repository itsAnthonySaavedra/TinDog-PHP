document.addEventListener("DOMContentLoaded", function () {
  const renderProfile = (userData) => {
    if (userData) {
      document.getElementById("dog-name").textContent = `${userData.dog_name || 'Dog'}, ${userData.dog_age || '?'}`;
      document.getElementById("dog-breed").textContent = userData.dog_breed || 'Unknown';
      document.getElementById("dog-sex").textContent = userData.dog_sex || '-';
      document.getElementById("dog-size").textContent = userData.dog_size || '-';
      document.getElementById("dog-age").textContent = `${userData.dog_age || 0} years old`;
      document.getElementById("dog-bio").textContent = userData.dog_bio || userData.bio || "No bio provided.";

      document.getElementById("owner-name").textContent = `${userData.first_name} ${userData.last_name}`;
      document.getElementById("owner-location").textContent = userData.location || 'Unknown';
      document.getElementById("owner-bio").textContent = "No owner bio provided.";

      const messageUserBtn = document.getElementById("message-user-btn");
      if (messageUserBtn) {
        messageUserBtn.href = `../messages.html?user=${userData.id}`;
      }

      const profileAvatar = document.getElementById("profile-avatar");
      if (profileAvatar && userData.dog_avatar) {
        profileAvatar.src = DataService.resolvePath(userData.dog_avatar);
        profileAvatar.alt = `${userData.dog_name}'s profile avatar`;
      }

      const coverPhoto = document.getElementById("cover-photo");
      if (coverPhoto && userData.dog_cover_photo) {
        coverPhoto.src = DataService.resolvePath(userData.dog_cover_photo);
        coverPhoto.alt = `${userData.dog_name}'s cover photo`;
      }
    }
  };

  const loadUserProfile = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id");
    const token = sessionStorage.getItem("userToken");

    if (!userId || !token) {
      // Fallback or error?
      console.error("No User ID or Token found for view profile.");
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          renderProfile(result.data);
        }
      } else {
        console.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  if (document.querySelector(".page-profile")) {
    document.addEventListener("componentsLoaded", loadUserProfile);
  }
});
