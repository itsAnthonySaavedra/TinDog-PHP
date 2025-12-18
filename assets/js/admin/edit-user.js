document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("edit-user-form");
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id") || urlParams.get("user");
  const token = sessionStorage.getItem("userToken");

  if (!userId) {
    Toast.error("No user ID provided.");
    window.location.href = "./index.html";
    return;
  }

  if (!token) {
    window.location.href = "../../auth/admin.html";
    return;
  }

  // --- 1. Load User Data ---
  const loadUserData = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const result = await response.json();
      const user = result.data || result;

      // Populate Standard Fields
      document.getElementById("firstName").value = user.first_name || "";
      document.getElementById("lastName").value = user.last_name || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("accountStatus").value = user.status || "active";

      // Handle Role Specific UI
      const pageTitle = document.getElementById("pageTitle");
      const standardFields = document.getElementById("standard-user-fields");
      const adminFields = document.getElementById("admin-user-fields");
      const displayNameInput = document.getElementById("displayName");

      if (user.role === "admin") {
        pageTitle.innerText = `Edit Admin: ${user.first_name || "Admin"}`;
        standardFields.style.display = "none";
        adminFields.style.display = "block";
        displayNameInput.value = user.display_name || "";
      } else {
        pageTitle.innerText = `Edit User: ${user.first_name || ""} ${user.last_name || ""
          }`;
        standardFields.style.display = "block";
        adminFields.style.display = "none";
      }
    } catch (error) {
      console.error("Load Error:", error);
      Toast.error("Could not load user details. You might not have permission.");
      window.location.href = "./index.html";
    }
  };

  // --- 2. Handle Update ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Base payload for all users
    const payload = {
      email: document.getElementById("email").value,
      status: document.getElementById("accountStatus").value,
    };

    const adminFields = document.getElementById("admin-user-fields");

    // CONDITIONAL LOGIC:
    // 1. If editing an Admin, send 'display_name'
    // 2. If editing a User, send 'first_name' & 'last_name', but DO NOT send 'display_name' (preserve DB value)
    if (adminFields.style.display !== "none") {
      payload.display_name = document.getElementById("displayName").value;
    } else {
      payload.first_name = document.getElementById("firstName").value;
      payload.last_name = document.getElementById("lastName").value;
      // We intentionally omit payload.display_name here so Laravel doesn't set it to NULL
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Unauthorized: Only Master Admins can edit other Admins."
          );
        }
        throw new Error(data.message || "Update failed.");
      }

      Toast.success("User updated successfully!");
      window.location.href = "./index.html";
    } catch (error) {
      console.error("Update Error:", error);
      alert(`Error: ${error.message}`);
    }
  });

  // Initialize
  loadUserData();
});
