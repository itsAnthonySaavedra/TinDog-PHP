function getBasePath() {
  const path = window.location.pathname;
  const repoName = "/TinDog-PHP/";
  const repoIndex = path.indexOf(repoName);
  if (repoIndex > -1) {
    return path.substring(0, repoIndex + repoName.length);
  }
  return "/";
}

document.addEventListener("DOMContentLoaded", () => {
  const initAdminProfile = async () => {
    const adminProfileSection = document.querySelector(".page-header");
    if (!adminProfileSection) return;

    const loggedInAdminId = sessionStorage.getItem("loggedInUserId");
    const token = sessionStorage.getItem("userToken");

    if (!loggedInAdminId || !token) {
      window.location.href = getBasePath() + "auth/admin.html";
      return;
    }

    let adminUser;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${loggedInAdminId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to load admin data.");
      }

      const result = await response.json();
      adminUser = result.data || result;
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      document.querySelector(".main-content").innerHTML =
        '<p class="text-danger p-4">Error loading admin profile. Please try again.</p>';
      return;
    }

    const profileForm = document.getElementById("admin-profile-form");
    if (!profileForm) return;

    const passwordForm = document.getElementById("change-password-form");
    const passwordModal = new bootstrap.Modal(
      document.getElementById("changePasswordModal")
    );

    const avatar = document.getElementById("admin-avatar");
    const displayName = document.getElementById("admin-displayname");
    const displayNameInput = document.getElementById("displayName");
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const emailInput = document.getElementById("email");
    const adminRole = document.getElementById("admin-role");

    const loadAdminData = () => {
      avatar.textContent =
        adminUser.first_name.charAt(0) + adminUser.last_name.charAt(0);
      displayName.textContent = adminUser.display_name;
      displayNameInput.value = adminUser.display_name;
      firstNameInput.value = adminUser.first_name;
      lastNameInput.value = adminUser.last_name;
      emailInput.value = adminUser.email;
      adminRole.textContent = adminUser.is_master_admin
        ? "Master Admin"
        : "Administrator";
    };

    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const userId = sessionStorage.getItem("loggedInUserId");
      const token = sessionStorage.getItem("userToken");
      const saveBtn = profileForm.querySelector("button[type='submit']");

      const payload = {
        first_name: firstNameInput.value,
        last_name: lastNameInput.value,
        email: emailInput.value,
        display_name: displayNameInput.value
      };

      try {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;

        const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          Toast.success("Profile updated successfully.");
          // Update local UI
          adminUser = data.data || data; // Update local user object
          loadAdminData(); // Refresh UI
        } else {
          Toast.error(data.message || "Failed to update profile.");
        }

        saveBtn.textContent = originalText;
        saveBtn.disabled = false;

      } catch (error) {
        console.error("Profile Save Error:", error);
        Toast.error("An error occurred while saving.");
        saveBtn.textContent = "Save Changes";
        saveBtn.disabled = false;
      }
    });

    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmNewPassword = document.getElementById("confirmNewPassword").value;
      const userId = sessionStorage.getItem("loggedInUserId");
      const token = sessionStorage.getItem("userToken");

      // Client-side validation
      if (newPassword !== confirmNewPassword) {
        Toast.error("New passwords do not match.");
        return;
      }

      const saveBtn = passwordForm.querySelector("button[type='submit']");
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Updating...";
      saveBtn.disabled = true;

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          },
          body: JSON.stringify({
            current_password: currentPassword,
            password: newPassword,
            password_confirmation: confirmNewPassword
          })
        });

        const data = await response.json();

        if (response.ok) {
          Toast.success("Password changed successfully.");
          passwordForm.reset();
          passwordModal.hide();
        } else {
          Toast.error(data.message || "Failed to update password.");
        }

      } catch (error) {
        console.error("Password Change Error:", error);
        Toast.error("An error occurred while changing password.");
      } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
      }
    });

    loadAdminData();
  };

  document.addEventListener("componentsLoaded", initAdminProfile, {
    once: true,
  });
});
