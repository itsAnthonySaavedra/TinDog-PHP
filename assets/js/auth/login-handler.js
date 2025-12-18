function getBasePath() {
  // Dynamic Path Detection for Team/GitHub Compatibility
  // Finds the path segment ending with "TinDog-PHP" regardless of parent folders
  const path = window.location.pathname;

  // Regex to find ".../TinDog-PHP/" case-insensitive
  const match = path.match(/^(.*\/TinDog-PHP\/)/i);

  if (match) {
    return match[1]; // Returns everything up to and including /TinDog-PHP/
  }

  // Fallback for root-level serving or unexpected names
  // If we are in /auth/, go up one level
  if (path.includes('/auth/')) {
    return path.substring(0, path.lastIndexOf('/auth/')) + '/';
  }

  return "/";
}

document.addEventListener("DOMContentLoaded", () => {
  const handleUserLogin = (form) => {
    const email = form.querySelector("#email").value;
    const password = form.querySelector("#password").value;
    const errorAlert = document.getElementById("login-error-alert");
    errorAlert.style.display = "none";

    fetch("http://127.0.0.1:8000/api/user-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw errorData;
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          DataService.saveSession(data);

          const basePath = getBasePath();
          if (data.role === 'admin') {
            window.location.href = basePath + "admin/dashboard.html";
          } else if (data.status === "new") {
            window.location.href = basePath + "auth/new-profile.html";
          } else {
            window.location.href = basePath + "app/dashboard.html";
          }
        } else {
          errorAlert.textContent = data.message;
          errorAlert.style.display = "block";
        }
      })
      .catch((error) => {
        console.error("Login Error:", error);
        errorAlert.textContent =
          error.message || "An unexpected error occurred.";
        errorAlert.style.display = "block";
      });
  };

  if (window.initializeFormValidation) {
    window.initializeFormValidation("auth-login-form", handleUserLogin);
  }
});
