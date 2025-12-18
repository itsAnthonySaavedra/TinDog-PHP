document.addEventListener("DOMContentLoaded", () => {
  const initUserProfile = async () => {
    const token = sessionStorage.getItem("userToken");
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
          populateProfile(result.data.user);
        }
      }
    } catch (error) {
      console.error("Profile Load Error:", error);
    }
  };

  const populateProfile = (user) => {
    const setText = (id, text) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text || "N/A";
      }
    };

    // Dog Profile Data
    setText("dog-name", user.dog_name || "Your Dog");
    setText("dog-breed", user.dog_breed || "Breed not set");
    setText("dog-sex", user.dog_sex ? (user.dog_sex.charAt(0).toUpperCase() + user.dog_sex.slice(1)) : "Sex not set");
    setText("dog-size", user.dog_size ? (user.dog_size.charAt(0).toUpperCase() + user.dog_size.slice(1)) : "Size not set");
    setText("dog-age", user.dog_age ? `${user.dog_age} years old` : "Age not set");
    setText("dog-bio", user.dog_bio || "No bio yet.");

    // Owner Profile Data
    setText("owner-name", user.name);
    setText("owner-location", user.location || "Location not set");
    setText("owner-bio", user.owner_bio || "No bio yet.");

    // Images
    const coverPhoto = document.getElementById("profile-cover");
    const mainAvatar = document.getElementById("profile-avatar");

    // Default Images
    const defaultCover = "../../assets/images/default-cover.jpg";
    const defaultDogAvatar = "../../assets/images/default-avatar.png";
    const defaultPersonAvatar = "../../assets/images/default-avatar.png";

    // Set Cover Photo (API Only)
    if (coverPhoto) {
      coverPhoto.src = user.dog_cover_photo || defaultCover;
    }

    // STRICT PFP SEPARATION (API Only)
    // Owner = user.owner_avatar OR user.avatar
    // Dog = user.dog_avatar
    const dogAvatarSrc = user.dog_avatar || defaultDogAvatar;
    const ownerAvatarSrc = user.owner_avatar || user.avatar || defaultPersonAvatar;

    // Set Initial Avatar (Defaults to Dog Tab)
    if (mainAvatar) {
      mainAvatar.src = dogAvatarSrc;
    }

    // Setup PFP Switching Logic
    const dogTabLink = document.getElementById("dog-tab-link");
    const ownerTabLink = document.getElementById("owner-tab-link");

    if (dogTabLink) {
      dogTabLink.setAttribute("data-avatar-src", dogAvatarSrc);
    }
    if (ownerTabLink) {
      ownerTabLink.setAttribute("data-avatar-src", ownerAvatarSrc);
    }

    // Listen for Tab Changes
    const tabLinks = document.querySelectorAll('a[data-bs-toggle="tab"]');
    tabLinks.forEach(tab => {
      tab.addEventListener('shown.bs.tab', (e) => {
        const newAvatarSrc = e.target.getAttribute('data-avatar-src');
        if (mainAvatar && newAvatarSrc) {
          mainAvatar.src = newAvatarSrc;
        }
      });
    });

    // PERSONALITIES LOGIC (API Only)
    const personalitiesContainer = document.getElementById("dog-personalities");
    if (personalitiesContainer) {
      const rawPersonalities = user.dog_personalities || user.personalities;

      if (rawPersonalities) {
        const personalities = rawPersonalities.split(',').filter(p => p.trim());
        if (personalities.length > 0) {
          personalitiesContainer.innerHTML = personalities.map(p =>
            `<span class="badge badge-gradient rounded-pill me-1 mb-1">${p.trim()}</span>`
          ).join('');
        } else {
          personalitiesContainer.innerHTML = '<span class="text-muted small">No personalities added yet.</span>';
        }
      } else {
        personalitiesContainer.innerHTML = '<span class="text-muted small">No personalities added yet.</span>';
      }
    }

    // GALLERY LOGIC (API Only)
    const photoGallery = document.getElementById("dog-photos");
    if (photoGallery) {
      photoGallery.innerHTML = ''; // Clear existing content

      // Add "Add Photo" button
      const addBtn = document.createElement('div');
      addBtn.className = 'd-inline-block m-1 align-top';
      addBtn.innerHTML = `
            <div class="bg-light border rounded d-flex align-items-center justify-content-center" style="width: 100px; height: 100px; cursor: pointer;" id="add-photo-btn">
                <i class="bi bi-plus-lg fs-3 text-muted"></i>
            </div>
            <input type="file" id="gallery-upload" accept="image/*" style="display: none;">
        `;
      photoGallery.appendChild(addBtn);

      // Render existing photos
      let photos = [];
      if (user.dog_photos) {
        if (Array.isArray(user.dog_photos)) {
          photos = user.dog_photos;
        } else if (typeof user.dog_photos === 'string') {
          try {
            photos = JSON.parse(user.dog_photos);
          } catch (e) {
            if (user.dog_photos.includes(',')) {
              photos = user.dog_photos.split(',');
            } else {
              photos = [user.dog_photos];
            }
          }
        }
      }

      photos.forEach(photoSrc => {
        if (!photoSrc) return;
        const imgContainer = document.createElement('div');
        imgContainer.className = 'd-inline-block m-1 align-top';
        imgContainer.innerHTML = `<img src="${photoSrc}" class="rounded shadow-sm" style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;" onclick="openGalleryModal('${photoSrc}')">`;
        photoGallery.appendChild(imgContainer);
      });

      // Handle click
      const btn = document.getElementById('add-photo-btn');
      const input = document.getElementById('gallery-upload');
      if (btn && input) {
        btn.onclick = () => input.click();
        input.onchange = handleGalleryUpload;
      }
    }
  };

  // Upload Handlers
  const handleCoverUpload = (e) => handleImageUpload(e, ['dog_cover_photo'], '#profile-cover');

  const handleAvatarUpload = (e) => {
    // Determine active tab (Scoped to profile tabs to avoid sidebar conflict)
    const activeTab = document.querySelector('#profileTabs .nav-link.active');
    const isOwnerTab = activeTab && activeTab.getAttribute('href') === '#owner-profile';

    const tabLinkId = isOwnerTab ? 'owner-tab-link' : 'dog-tab-link';

    // STRICT SEPARATION:
    // If Owner Tab -> update 'owner_avatar' AND 'avatar' (for sidebar)
    // If Dog Tab -> update 'dog_avatar' ONLY
    if (isOwnerTab) {
      handleImageUpload(e, ['owner_avatar', 'avatar'], '#profile-avatar', tabLinkId);
    } else {
      handleImageUpload(e, ['dog_avatar'], '#profile-avatar', tabLinkId);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;
      const token = sessionStorage.getItem("userToken");
      const userId = sessionStorage.getItem("loggedInUserId");

      try {
        // 1. Get current photos from API
        const getResponse = await fetch(`http://127.0.0.1:8000/api/user/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let currentPhotos = [];
        if (getResponse.ok) {
          const data = await getResponse.json();
          let rawPhotos = data.data.user.dog_photos;
          if (Array.isArray(rawPhotos)) {
            currentPhotos = rawPhotos;
          } else if (typeof rawPhotos === 'string') {
            try {
              currentPhotos = JSON.parse(rawPhotos);
            } catch (e) {
              if (rawPhotos.includes(',')) {
                currentPhotos = rawPhotos.split(',');
              } else {
                currentPhotos = rawPhotos ? [rawPhotos] : [];
              }
            }
          }
        }

        // 2. Append
        currentPhotos.push(base64String);

        // 3. Update API
        const updateResponse = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: JSON.stringify({
            dog_photos: currentPhotos
          }),
        });

        if (updateResponse.ok) {
          // 4. Update UI
          const photoGallery = document.getElementById("dog-photos");
          const newImgCol = document.createElement('div');
          newImgCol.className = 'd-inline-block m-1 align-top';
          newImgCol.innerHTML = `
                      <img src="${base64String}" class="rounded shadow-sm" style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;" onclick="openGalleryModal('${base64String}')">
                  `;
          photoGallery.appendChild(newImgCol);
        } else {
          console.error("Failed to upload gallery photo");
          Toast.error("Failed to upload photo. Backend may not support this field.");
        }
      } catch (error) {
        console.error("Error uploading gallery photo:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async (e, fieldNames, imgSelector, tabLinkId = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target.result;

      // Optimistic update
      const img = document.querySelector(imgSelector);
      if (img) img.src = base64String;

      // Update Tab Data Attribute if applicable
      if (tabLinkId) {
        const tabLink = document.getElementById(tabLinkId);
        if (tabLink) {
          tabLink.setAttribute('data-avatar-src', base64String);
        }
      }

      const token = sessionStorage.getItem("userToken");
      const userId = sessionStorage.getItem("loggedInUserId");

      // Construct payload
      const payload = {};
      fieldNames.forEach(field => {
        payload[field] = base64String;
      });

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

        if (!response.ok) {
          console.error("Failed to update image");
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Failed to save image.";
          Toast.error(errorMessage);
        } else {
          // If we updated 'avatar', update sidebar immediately
          if (fieldNames.includes('avatar')) {
            const sidebarAvatar = document.getElementById("sidebar-user-avatar");
            const headerAvatar = document.querySelector(".header-avatar");
            if (sidebarAvatar) sidebarAvatar.src = base64String;
            if (headerAvatar) headerAvatar.src = base64String;
          }
        }
      } catch (error) {
        console.error("Error updating image:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  function setupEditButtons() {
    // Cover Edit
    const coverBtn = document.getElementById('edit-cover-btn');
    const coverInput = document.getElementById('cover-photo-input');

    if (coverBtn && coverInput) {
      // Remove any existing listeners (clone node trick if needed, but here we just attach fresh)
      // The button in HTML is just a button.
      // We attach the click to open the file dialog
      coverBtn.onclick = (e) => {
        // e.preventDefault(); // Not needed for type=button
        coverInput.click();
      };

      // Handle file selection
      coverInput.onchange = handleCoverUpload;
    }

    // Avatar Edit
    const avatarBtn = document.getElementById('edit-avatar-btn');
    const avatarInput = document.getElementById('avatar-input');

    if (avatarBtn && avatarInput) {
      avatarBtn.onclick = (e) => {
        // e.preventDefault();
        avatarInput.click();
      };
      avatarInput.onchange = handleAvatarUpload;
    }
  }

  // Initialize
  if (document.querySelector(".page-profile")) {
    initUserProfile();
    setupEditButtons();

    document.addEventListener("componentsLoaded", () => {
      initUserProfile();
      setupEditButtons();
    });
  }
});
