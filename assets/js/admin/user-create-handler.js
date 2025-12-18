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
  const createUserForm = document.getElementById("create-user-form");
  const roleSelect = document.getElementById("userRole");
  const standardUserFields = document.getElementById("standard-user-fields");

  // Toggle Visibility Logic (Moved from deleted user-create.js)
  const toggleUserFields = () => {
    if (roleSelect && standardUserFields) {
      if (roleSelect.value === "user") {
        standardUserFields.style.display = "block";
      } else {
        standardUserFields.style.display = "none";
      }
    }
  };

  if (roleSelect) {
    roleSelect.addEventListener("change", toggleUserFields);
    toggleUserFields(); // Init
  }

  if (createUserForm) {
    // Permission Check: Only Master Admin can create Admins
    const currentAdminIsMaster = sessionStorage.getItem("isMasterAdmin") === "true";

    if (roleSelect && !currentAdminIsMaster) {
      // Remove "Administrator" option
      for (let i = 0; i < roleSelect.options.length; i++) {
        if (roleSelect.options[i].value === "admin") {
          roleSelect.remove(i);
          break;
        }
      }
    }

    createUserForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!this.checkValidity()) {
        event.stopPropagation();
        this.classList.add("was-validated");
        return;
      }

      const newUserData = {
        role: document.getElementById("userRole").value,
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      };

      if (newUserData.role === "admin") {
        newUserData.displayName = `${newUserData.firstName} ${newUserData.lastName}`;
      } else {
        newUserData.location = document.getElementById("ownerLocation").value;
        newUserData.dogName = document.getElementById("dogName").value;
        newUserData.dogBreed = document.getElementById("dogBreed").value;
        newUserData.dogSex = document.getElementById("dogSex").value;
        newUserData.dogSize = document.getElementById("dogSize").value;
        newUserData.plan = document.getElementById("subscriptionPlan").value;
      }

      try {
        const token = sessionStorage.getItem("userToken");
        const response = await fetch("http://127.0.0.1:8000/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          },
          body: JSON.stringify(newUserData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          Toast.success("User created successfully. Redirecting...");
          setTimeout(() => {
            window.location.href = `${getBasePath()}admin/users/record.html?user=${result.userId}`;
          }, 1500);
        } else {
          Toast.error(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error("Failed to create user:", error);
        Toast.error("An unexpected error occurred. Please check the console.");
      }
    });
  }
});
