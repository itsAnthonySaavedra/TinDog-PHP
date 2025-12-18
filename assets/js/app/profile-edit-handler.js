document.addEventListener("DOMContentLoaded", () => {
  const editProfileForm = document.getElementById("edit-profile-form");
  const token = sessionStorage.getItem("userToken");

  // 1. Fetch and Populate Data
  const loadUserData = async () => {
    if (!token) return;

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
          populateForm(result.data.user);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const populateForm = (user) => {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    // Dog Info
    setVal("dogName", user.dog_name || user.display_name);
    setVal("dogBreed", user.dog_breed);
    setVal("dogAge", user.dog_age);
    setVal("dogSex", user.dog_sex);
    setVal("dogSize", user.dog_size);
    setVal("dogBio", user.dog_bio);
    setVal("dogPersonalities", user.dog_personalities);

    // Owner Info
    setVal("ownerFirstName", user.first_name || "");
    setVal("ownerLastName", user.last_name || "");
    setVal("ownerLocation", user.location);
    // Fallback to generic bio if specific owner_bio is missing (API consistency)
    setVal("ownerBio", user.owner_bio || user.bio);
  };

  // 2. Handle Submit
  if (editProfileForm) {
    editProfileForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!this.checkValidity()) {
        event.stopPropagation();
        this.classList.add("was-validated");
        return;
      }

      const userId = sessionStorage.getItem("loggedInUserId");
      if (!userId) {
        Toast.error("User ID not found. Please log in again.");
        return;
      }

      // Helper to read file as Base64
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      // Get File Inputs
      const dogAvatarFile = document.getElementById("dogAvatar").files[0];
      const dogCoverFile = document.getElementById("dogCoverPhoto").files[0];
      const ownerAvatarFile = document.getElementById("ownerAvatar").files[0];

      let dogAvatarBase64 = null;
      let dogCoverBase64 = null;
      let ownerAvatarBase64 = null;

      try {
        if (dogAvatarFile) dogAvatarBase64 = await toBase64(dogAvatarFile);
        if (dogCoverFile) dogCoverBase64 = await toBase64(dogCoverFile);
        if (ownerAvatarFile) ownerAvatarBase64 = await toBase64(ownerAvatarFile);
      } catch (e) {
        console.error("Error converting images", e);
        Toast.error("Error processing images.");
        return;
      }

      // Construct payload
      const payload = {
        dog_name: document.getElementById("dogName").value,
        dog_breed: document.getElementById("dogBreed").value,
        dog_age: document.getElementById("dogAge").value,
        dog_sex: document.getElementById("dogSex").value,
        dog_size: document.getElementById("dogSize").value,
        dog_bio: document.getElementById("dogBio").value,
        dog_personalities: document.getElementById("dogPersonalities").value,

        // Combine First/Last for name
        name: `${document.getElementById("ownerFirstName").value} ${document.getElementById("ownerLastName").value}`.trim(),
        location: document.getElementById("ownerLocation").value,
        owner_bio: document.getElementById("ownerBio").value,

        // Images (only send if changed)
        ...(dogAvatarBase64 && { dog_avatar: dogAvatarBase64 }),
        ...(dogCoverBase64 && { dog_cover_photo: dogCoverBase64 }),
        ...(ownerAvatarBase64 && { owner_avatar: ownerAvatarBase64 }),
      };

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Redirect back to profile
          window.location.href = "./index.html";
        } else {
          const err = await response.json();
          Toast.error("Failed to update profile: " + (err.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        Toast.error("An error occurred while saving.");
      }
    });
  }

  // Load data on init
  loadUserData();
});
