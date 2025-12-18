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
  const form = document.getElementById("create-profile-form");
  if (!form) return;

  const nextButtons = document.querySelectorAll(".btn-next");
  const backButtons = document.querySelectorAll(".btn-back");
  const progressBar = document.querySelector(".progress-bar");
  const formSteps = document.querySelectorAll(".wizard-form-step");
  let currentStepIndex = 0;

  const updateWizardState = () => {
    formSteps.forEach((step, index) => {
      step.style.display = index === currentStepIndex ? "flex" : "none";
    });
    const progressPercentage =
      (currentStepIndex / (formSteps.length - 1)) * 100;
    progressBar.style.width = `${progressPercentage}%`;
  };

  const validateStep = (stepIndex) => {
    const currentStep = formSteps[stepIndex];
    const inputs = currentStep.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );
    let isStepValid = true;

    inputs.forEach((input) => {
      if (!input.checkValidity()) {
        isStepValid = false;
      }
    });

    return isStepValid;
  };

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateStep(currentStepIndex)) {
        form.classList.add("was-validated");
        return;
      }
      form.classList.remove("was-validated");
      if (currentStepIndex < formSteps.length - 1) {
        currentStepIndex++;
        updateWizardState();
      }
    });
  });

  backButtons.forEach((button) => {
    button.addEventListener("click", () => {
      form.classList.remove("was-validated");
      if (currentStepIndex > 0) {
        currentStepIndex--;
        updateWizardState();
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      event.stopPropagation();
      return;
    }

    const userId = sessionStorage.getItem("loggedInUserId");
    const token = sessionStorage.getItem("userToken");

    if (!userId || !token) {
      Toast.error("Session expired. Please login again.");
      window.location.href = "./index.html";
      return;
    }

    // Collect personality tags
    const personalityTags = [];
    document.querySelectorAll('#personality-tags-container input[type="checkbox"]:checked').forEach(checkbox => {
      personalityTags.push(checkbox.value);
    });

    // Get dog photo base64 string if available
    const dogPhotoPreview = document.getElementById("dog-photo-preview");
    const dogPhotoBase64 = dogPhotoPreview && dogPhotoPreview.src.startsWith("data:") ? dogPhotoPreview.src : null;

    // Map form fields to backend expected fields
    const profileData = {
      first_name: document.getElementById("ownerFirstName").value,
      last_name: document.getElementById("ownerLastName").value,
      location: document.getElementById("location").value,
      // Dog Fields
      dog_name: document.getElementById("dogName").value,
      dog_breed: document.getElementById("dogBreed").value,
      dog_sex: document.getElementById("dogSex").value,
      dog_size: document.getElementById("dogSize").value,
      dog_age: document.getElementById("dogAge").value,
      dog_bio: document.getElementById("dogBio").value,
      dog_personalities: personalityTags.join(','),
      dog_avatar: dogPhotoBase64,
    };

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(profileData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get("plan");

        if (plan && (plan === 'labrador' || plan === 'mastiff')) {
          window.location.href = `../auth/checkout.html?plan=${plan}`;
        } else {
          window.location.href = getBasePath() + "app/dashboard.html";
        }
      } else {
        Toast.error(`Error: ${result.message || "Failed to update profile."}`);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      Toast.error("An unexpected error occurred. Please check the console.");
    }
  });

  updateWizardState();
});
