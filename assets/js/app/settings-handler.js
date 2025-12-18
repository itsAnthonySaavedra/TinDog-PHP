document.addEventListener("DOMContentLoaded", async () => {
  const token = DataService.getToken();
  const userId = DataService.getLoggedInUserId();

  if (!token || !userId) return;

  // --- Elements ---
  const distanceRange = document.getElementById("distanceRange");
  const distanceValue = document.getElementById("distance-value");
  const ageRange = document.getElementById("ageRange");
  const ageValue = document.getElementById("age-value");
  const sexFilter = document.getElementById("filterDogSex");
  const sizeFilter = document.getElementById("filterDogSize");
  const showOnTindogToggle = document.getElementById("show-on-tindog");

  // Advanced Filters UI
  const fieldset = document.getElementById("advanced-filters-fieldset");
  const upgradePrompt = document.getElementById("upgrade-for-filters");

  // --- Load Settings from API ---
  const loadSettings = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const res = await response.json();

      if (res.success) {
        const user = res.data;
        updateUI(user);
        checkPlanPermissions(user.plan);
      }
    } catch (e) {
      console.error("Settings load error:", e);
    }
  };

  const updateUI = (user) => {
    // Range Sliders
    if (distanceRange) {
      distanceRange.value = user.discovery_distance || 50;
      distanceValue.textContent = `${distanceRange.value} km`;
    }
    if (ageRange) {
      ageRange.value = user.discovery_age_max || 8;
      ageValue.textContent = `1 - ${ageRange.value} years`;
    }

    // Selects
    if (sexFilter) sexFilter.value = user.discovery_dog_sex || 'any';
    if (sizeFilter) sizeFilter.value = user.discovery_dog_size || 'any';

    // Toggle
    if (showOnTindogToggle) showOnTindogToggle.checked = (user.is_visible == 1); // Ensure boolean check
  };

  const checkPlanPermissions = (plan) => {
    const isPremium = (plan === 'mastiff' || plan === 'great-dane'); // Assuming great-dane exists or just mastiff

    if (fieldset && upgradePrompt) {
      if (isPremium) {
        fieldset.disabled = false;
        upgradePrompt.style.display = "none";
      } else {
        fieldset.disabled = true;
        upgradePrompt.style.display = "block";
      }
    }
  };

  // --- Save Logic ---
  const saveQueue = {};
  let saveTimeout = null;

  const queueSave = (key, value) => {
    saveQueue[key] = value;

    if (saveTimeout) clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async () => {
      try {
        await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(saveQueue)
        });
        console.log("Settings saved remotely.");
      } catch (e) {
        console.error("Settings save failed:", e);
      }
    }, 1000); // Debounce saves by 1s
  };

  // --- Listeners ---
  if (distanceRange) {
    distanceRange.addEventListener("input", (e) => {
      distanceValue.textContent = `${e.target.value} km`;
      queueSave('discovery_distance', e.target.value);
    });
  }

  if (ageRange) {
    ageRange.addEventListener("input", (e) => {
      ageValue.textContent = `1 - ${e.target.value} years`;
      queueSave('discovery_age_max', e.target.value);
    });
  }

  if (sexFilter) sexFilter.addEventListener("change", (e) => queueSave('discovery_dog_sex', e.target.value));
  if (sizeFilter) sizeFilter.addEventListener("change", (e) => queueSave('discovery_dog_size', e.target.value));
  if (showOnTindogToggle) showOnTindogToggle.addEventListener("change", (e) => queueSave('is_visible', e.target.checked));

  // Init
  loadSettings();
});
