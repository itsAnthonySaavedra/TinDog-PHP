function getBasePath() {
  const path = window.location.pathname;
  const repoName = "/TinDog-PHP/";
  const repoIndex = path.indexOf(repoName);
  if (repoIndex > -1) {
    return path.substring(0, repoIndex + repoName.length);
  }
  return "/";
}

const handleRegistration = async (event) => {
  event.preventDefault();

  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get("plan");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("terms").checked;

  if (!terms) {
    Toast.warning("Please agree to the Terms & Conditions.");
    return;
  }

  if (password !== confirmPassword) {
    Toast.error("Passwords do not match!");
    return;
  }

  const registerBtn = document.getElementById("registerBtn");
  const originalBtnText = registerBtn.innerHTML;
  registerBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
  registerBtn.disabled = true;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        first_name: "New", // Placeholder
        last_name: "User", // Placeholder
        email: email,
        password: password,
        password_confirmation: confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed.");
    }

    // Auto-login after successful registration
    const loginResponse = await fetch("http://127.0.0.1:8000/api/user-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();

    if (loginData.success) {
      sessionStorage.setItem("loggedInUserId", loginData.userId);
      sessionStorage.setItem("userToken", loginData.token);
      if (plan) {
        window.location.href = `./new-profile.html?plan=${plan}`;
      } else {
        window.location.href = "./new-profile.html";
      }
    } else {
      throw new Error("Registration successful but auto-login failed.");
    }

  } catch (error) {
    console.error("Registration Error:", error);
    Toast.error(error.message);
    registerBtn.disabled = false;
    registerBtn.innerHTML = originalBtnText;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("form");
  const showPasswordCheckbox = document.getElementById("showPassword");

  if (showPasswordCheckbox) {
    showPasswordCheckbox.addEventListener("change", function () {
      const passwordInput = document.getElementById("password");
      const confirmPasswordInput = document.getElementById("confirmPassword");
      const type = this.checked ? "text" : "password";
      if (passwordInput) passwordInput.type = type;
      if (confirmPasswordInput) confirmPasswordInput.type = type;
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", handleRegistration);
  }

  // Terms Modal Logic
  const termsCheckbox = document.getElementById("terms");
  const termsModal = document.getElementById("termsModal");
  const agreeToTermsBtn = document.getElementById("agreeToTermsBtn");
  let termsContent = null;

  const fetchTermsContent = () => {
    const modalBody = termsModal.querySelector(".modal-body");

    if (termsContent) {
      modalBody.innerHTML = termsContent;
      return;
    }

    fetch("../public/terms.html")
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const contentElement = doc.querySelector("#terms-main-content");

        if (contentElement) {
          termsContent = contentElement.innerHTML;
          modalBody.innerHTML = termsContent;
        } else {
          modalBody.innerHTML = "Could not load the terms and conditions.";
        }
      })
      .catch((error) => {
        console.error("Error fetching terms:", error);
        modalBody.innerHTML = "Could not load the terms and conditions.";
      });
  };

  if (termsModal) {
    termsModal.addEventListener("show.bs.modal", fetchTermsContent);
  }

  if (agreeToTermsBtn) {
    agreeToTermsBtn.addEventListener("click", () => {
      if (termsCheckbox) {
        termsCheckbox.checked = true;
      }
    });
  }
});
