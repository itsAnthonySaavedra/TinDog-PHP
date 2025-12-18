/**
 * Profile Modal Service
 * Shared utility to open the premium "Hero" profile modal from anywhere.
 * Requires: bootstrap.js, app.css (with hero-modal styles), DataService
 */

const ProfileModal = {
  modalId: 'profileDetailModal',

  /**
   * Open the profile modal for a given user ID.
   * Fetches fresh data and renders the premium layout.
   * @param {string|number} userId 
   * @param {object} options { showMessageButton: boolean }
   */
  open: async (userId, options = {}) => {
    const { showMessageButton = false } = options;
    const token = DataService.getToken();
    if (!token) return;

    // 1. Get Modal Elements
    // We expect the modal HTML to exist in the DOM (footer/layout)
    // If not, we could dynamically create it, but for now let's assume it's in the shared layout.
    // If it's missing, we log error.
    let modalEl = document.getElementById(ProfileModal.modalId);
    if (!modalEl) {
      console.warn("Profile Details Modal not found in DOM via ID 'profileDetailModal'. Creating it...");
      modalEl = ProfileModal.createModalDOM();
    }

    modalEl.classList.add('profile-hero-modal');

    // 2. Render Skeleton State
    const modalContent = modalEl.querySelector('.modal-content');
    modalContent.innerHTML = `
            <div class="hero-image-container skeleton"></div>
            <div class="profile-content-body">
                <div class="skeleton skeleton-text" style="height: 3rem; width: 60%"></div>
                <div class="d-flex gap-2 my-3">
                    <div class="skeleton skeleton-text" style="width: 80px; height: 30px; border-radius: 50rem"></div>
                    <div class="skeleton skeleton-text" style="width: 60px; height: 30px; border-radius: 50rem"></div>
                </div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text w-75"></div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="position:absolute; top:1.5rem; right:1.5rem; z-index:20;"></button>
        `;

    // 3. Show Modal
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    // 4. Fetch Details
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();

      if (json.success) {
        const u = json.data;
        const name = u.dog_name || u.name || 'Dog';
        const breed = u.dog_breed || u.breed;
        const age = u.dog_age || u.age;
        const owner = (u.first_name && u.last_name) ? `${u.first_name} ${u.last_name}` : u.owner_name;
        const bio = u.bio || u.dog_bio || "No bio available.";
        const sex = u.dog_sex || 'Unknown';

        const imgSrc = (u.dog_avatar || u.avatar)
          ? DataService.resolvePath(u.dog_avatar || u.avatar)
          : "../../assets/images/default-avatar.png";

        // 5. Render Content based on Mode
        if (options.mode === 'full') {
          // --- FULL PROFILE MODE (Facebook Style) ---
          const coverSrc = (u.dog_cover_photo || u.cover_photo)
            ? DataService.resolvePath(u.dog_cover_photo || u.cover_photo)
            : "../../assets/images/default-cover.jpg"; // Need a default cover? Or use gradient.

          modalContent.innerHTML = `
                <div class="full-profile-wrapper">
                    <div class="profile-cover" style="height: 180px; background-color: #ddd; background-image: url('${coverSrc}'); background-size: cover; background-position: center; position: relative;">
                         <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" style="position:absolute; top:1.5rem; right:1.5rem; z-index:20; background-color: rgba(0,0,0,0.5); border-radius: 50%; padding: 0.8rem;"></button>
                    </div>
                    <div class="profile-header px-4 position-relative" style="margin-top: -60px; margin-bottom: 1rem;">
                        <div class="d-flex align-items-end">
                            <img src="${imgSrc}" class="rounded-circle border border-4 border-white shadow-sm" style="width: 120px; height: 120px; object-fit: cover; background: #fff;">
                            <div class="ms-3 mb-2">
                                <h2 class="mb-0 fw-bold">${name}</h2>
                                <p class="text-muted mb-0 small"><i class="bi bi-geo-alt-fill text-danger"></i> ${u.location || u.distance_km + ' km away' || 'Nearby'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-body px-4 pb-4">
                        <div class="row g-2 mb-4 text-center">
                            <div class="col-3">
                                <div class="p-2 rounded bg-light h-100">
                                    <small class="d-block text-muted text-uppercase" style="font-size:0.65rem; letter-spacing:1px; font-weight:700;">Breed</small>
                                    <span class="fw-bold small">${breed || '-'}</span>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="p-2 rounded bg-light h-100">
                                    <small class="d-block text-muted text-uppercase" style="font-size:0.65rem; letter-spacing:1px; font-weight:700;">Age</small>
                                    <span class="fw-bold small">${age || '-'}</span>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="p-2 rounded bg-light h-100">
                                    <small class="d-block text-muted text-uppercase" style="font-size:0.65rem; letter-spacing:1px; font-weight:700;">Sex</small>
                                    <span class="fw-bold small">${sex}</span>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="p-2 rounded bg-light h-100">
                                    <small class="d-block text-muted text-uppercase" style="font-size:0.65rem; letter-spacing:1px; font-weight:700;">Size</small>
                                    <span class="fw-bold small">${u.dog_size || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <h5 class="fw-bold mb-2">About</h5>
                        <p class="text-muted mb-4" style="line-height: 1.7;">${bio}</p>

                        ${owner ? `
                        <h5 class="fw-bold mb-2">Owner</h5>
                        <div class="d-flex align-items-center p-3 border rounded mb-4 hover-shadow transition-all">
                             <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style="width:50px; height:50px; min-width: 50px;">
                                ${owner.charAt(0)}
                             </div>
                             <div class="ms-3">
                                <h6 class="mb-0 fw-bold">${owner}</h6>
                                <small class="text-muted">Parent</small>
                             </div>
                        </div>` : ''}

                        <a href="../messages.html?user=${u.id}" class="btn btn-tindog-primary w-100 py-3 rounded-pill fw-bold shadow">
                            <i class="bi bi-chat-dots-fill me-2"></i> Message Now
                        </a>
                    </div>
                </div>
            `;
        } else {
          // --- GLIMPSE MODE (Card Style) ---
          modalContent.innerHTML = `
                <div class="hero-image-container">
                    <img src="${imgSrc}" style="object-fit:cover; width:100%; height:100%;" alt="${name}">
                    <div class="hero-overlay"></div>
                </div>
                
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="position:absolute; top:1.5rem; right:1.5rem; z-index:20;"></button>

                <div class="profile-content-body">
                    <h2 class="profile-title-large">${name}</h2>
                    <div class="profile-badges">
                        ${breed ? `<div class="profile-badge badge-breed"><i class="bi bi-paw"></i> ${breed}</div>` : ''}
                        ${age ? `<div class="profile-badge badge-age"><i class="bi bi-hourglass-split"></i> ${age} y/o</div>` : ''}
                        ${sex ? `<div class="profile-badge badge-owner"><i class="bi bi-gender-${sex.toLowerCase() === 'female' ? 'female' : 'male'}"></i> ${sex}</div>` : ''}
                    </div>

                    <p class="modal-bio-text">${bio}</p>

                    ${showMessageButton ? `
                    <div class="mt-4">
                        <a href="../messages.html?user=${u.id}" class="btn btn-tindog-primary w-100 py-3 rounded-pill fw-bold shadow-sm">
                            <i class="bi bi-chat-dots-fill me-2"></i> Message Now
                        </a>
                    </div>
                    ` : ''}

                    ${owner ? `
                    <div class="owner-mini-row mt-4 pt-3 border-top">
                            <div class="d-flex align-items-center">
                            <div class="bg-light rounded-circle d-flex align-items-center justify-content-center" style="width:40px; height:40px; margin-right: 12px; font-weight:700; color:#555;">
                                ${owner.charAt(0)}
                            </div>
                            <div>
                                <small class="text-muted d-block" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Owner</small>
                                <span style="font-weight:600; color:#1f2937;">${owner}</span>
                            </div>
                            </div>
                    </div>` : ''}
                </div>
            `;
        }
      } else {
        throw new Error(json.message || "Failed to load user");
      }
    } catch (e) {
      console.error("ProfileModal Error", e);
      modalContent.innerHTML = `
                <div class="p-5 text-center">
                    <i class="bi bi-exclamation-circle text-danger display-4 mb-3"></i>
                    <h5>Failed to load profile.</h5>
                    <p class="text-muted">${e.message || 'Network error'}</p>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="position:absolute; top:1.5rem; right:1.5rem; z-index:20;"></button>
            `;
    }
  },

  /**
   * Dynamically injects modal DOM if missing
   */
  createModalDOM: () => {
    const div = document.createElement('div');
    div.className = "modal fade";
    div.id = ProfileModal.modalId;
    div.tabIndex = -1;
    div.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content glass-modal overflow-hidden border-0">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `;
    document.body.appendChild(div);
    return div;
  }
};

// Expose globally
window.ProfileModal = ProfileModal;
