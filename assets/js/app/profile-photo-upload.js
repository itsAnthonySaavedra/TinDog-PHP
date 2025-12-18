/**
 * Profile Photo Upload Handler
 * Handles instant upload of cover photo and avatar from the profile page
 */
document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("userToken");
    const userId = sessionStorage.getItem("loggedInUserId");

    // Cover Photo Upload
    const editCoverBtn = document.getElementById("edit-cover-btn");
    const coverPhotoInput = document.getElementById("cover-photo-input");
    const profileCover = document.getElementById("profile-cover");

    // Avatar Upload
    const editAvatarBtn = document.getElementById("edit-avatar-btn");
    const avatarInput = document.getElementById("avatar-input");
    const profileAvatar = document.getElementById("profile-avatar");

    // Helper to convert file to Base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // Upload function
    const uploadImage = async (fieldName, base64Data) => {
        if (!token || !userId) {
            Toast.error("Please log in to update profile.");
            return false;
        }

        try {
            const payload = {};
            payload[fieldName] = base64Data;

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
                Toast.success("Photo updated successfully!");
                return true;
            } else {
                const err = await response.json();
                Toast.error("Failed to update: " + (err.message || "Unknown error"));
                return false;
            }
        } catch (error) {
            console.error("Upload error:", error);
            Toast.error("An error occurred while uploading.");
            return false;
        }
    };

    // Cover Photo Handler
    if (editCoverBtn && coverPhotoInput) {
        editCoverBtn.addEventListener("click", () => {
            coverPhotoInput.click();
        });

        coverPhotoInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show loading state
            editCoverBtn.disabled = true;
            editCoverBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Uploading...';

            try {
                const base64 = await toBase64(file);

                // Optimistically update the UI
                profileCover.src = base64;

                // Upload to server
                const success = await uploadImage("dog_cover_photo", base64);

                if (!success) {
                    // Revert if failed (would need to store original, but for simplicity just keep new)
                    console.log("Upload failed but keeping preview");
                }
            } catch (err) {
                console.error("Error processing cover photo:", err);
                Toast.error("Error processing image.");
            } finally {
                editCoverBtn.disabled = false;
                editCoverBtn.innerHTML = '<i class="bi bi-camera-fill me-1"></i> Edit Cover';
                coverPhotoInput.value = ""; // Reset for next upload
            }
        });
    }

    // Avatar Handler
    if (editAvatarBtn && avatarInput) {
        editAvatarBtn.addEventListener("click", () => {
            avatarInput.click();
        });

        avatarInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show loading state
            editAvatarBtn.disabled = true;

            try {
                const base64 = await toBase64(file);

                // Optimistically update the UI
                profileAvatar.src = base64;

                // Upload to server
                await uploadImage("dog_avatar", base64);
            } catch (err) {
                console.error("Error processing avatar:", err);
                Toast.error("Error processing image.");
            } finally {
                editAvatarBtn.disabled = false;
                avatarInput.value = ""; // Reset for next upload
            }
        });
    }
});
