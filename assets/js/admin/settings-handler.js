document.addEventListener("DOMContentLoaded", async () => {
  const token = sessionStorage.getItem("userToken");
  if (!token) {
    window.location.href = "../../auth/admin.html";
    return;
  }

  const apiBase = "http://127.0.0.1:8000/api";
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Content-Type": "application/json"
  };

  // --- Load Settings ---
  const loadSettings = async () => {
    try {
      const response = await fetch(`${apiBase}/settings`, { headers });
      const result = await response.json();

      if (result.success) {
        const settings = result.data;

        // Map settings to inputs
        const inputs = document.querySelectorAll('[data-setting]');
        inputs.forEach(input => {
          const key = input.dataset.setting;
          if (settings[key] !== undefined) {
            if (input.type === 'checkbox') {
              input.checked = settings[key] === 'true' || settings[key] === true;
            } else {
              input.value = settings[key];
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  // --- Save Settings ---
  const saveSettings = async () => {
    const inputs = document.querySelectorAll('[data-setting]');
    const settings = {};

    inputs.forEach(input => {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') {
        settings[key] = input.checked ? 'true' : 'false';
      } else {
        settings[key] = input.value;
      }
    });

    try {
      const response = await fetch(`${apiBase}/settings`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ settings })
      });

      const result = await response.json();
      if (result.success) {
        Toast.success("Settings saved successfully!");
      } else {
        Toast.error("Failed to save settings.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      Toast.error("An error occurred while saving.");
    }
  };

  // Bind Save Buttons
  document.getElementById('saveSystemSettingsBtn')?.addEventListener('click', saveSettings);
  document.getElementById('saveSecuritySettingsBtn')?.addEventListener('click', saveSettings);

  // --- Theme Toggle (Client Side) ---
  const themeOptions = document.querySelectorAll('.theme-option');

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    themeOptions.forEach(opt => {
      if (opt.dataset.theme === theme) opt.classList.add('active');
      else opt.classList.remove('active');
    });
  };

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      localStorage.setItem('theme', theme);
      applyTheme(theme);
    });
  });

  // --- Initial Load ---
  await loadSettings();
});
