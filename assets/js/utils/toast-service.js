/**
 * TinDog Toast Service
 * Replaces native browser alerts with Bootstrap Toasts.
 */

const Toast = {
    container: null,

    init() {
        if (this.container) return;

        // Create container if not exists
        this.container = document.createElement('div');
        this.container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        this.container.style.zIndex = '1055'; // Above modals
        document.body.appendChild(this.container);
    },

    /**
     * Show a toast message
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'danger', 'warning', 'info'
     */
    show(message, type = 'success') {
        this.init();

        // Custom Tindog Theme Colors
        let bgStyle = '';
        let icon = '';

        // Tindog Primary (Pink/Red) for Success
        if (type === 'success') {
            bgStyle = 'background: linear-gradient(to right, #fe3c72, #ff655b); color: white;';
            icon = '<i class="bi bi-check-circle-fill me-2"></i>';
        }
        // Dark/Red for Error
        else if (type === 'danger') {
            bgStyle = 'background-color: #dc3545; color: white;';
            icon = '<i class="bi bi-exclamation-octagon-fill me-2"></i>';
        }
        // Warning
        else if (type === 'warning') {
            bgStyle = 'background-color: #ffc107; color: #000;';
            icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
        }
        // Info
        else if (type === 'match') {
            bgStyle = 'background: linear-gradient(to right, #fd297b, #ff655b); color: white; border: 2px solid white;';
            icon = '<i class="bi bi-heart-fill me-2 heartbeat"></i>';
        }
        else {
            bgStyle = 'background-color: #0dcaf0; color: #000;';
            icon = '<i class="bi bi-info-circle-fill me-2"></i>';
        }

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center border-0 shadow-lg`;
        toastEl.style.cssText = bgStyle;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center fs-6">
          ${icon}
          <span class="fw-medium">${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

        this.container.appendChild(toastEl);

        if (window.bootstrap && window.bootstrap.Toast) {
            const bsToast = new window.bootstrap.Toast(toastEl, { delay: 4000 });
            bsToast.show();
            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
        } else {
            // Fallback if bootstrap JS isn't loaded for some reason
            toastEl.style.display = 'block';
            toastEl.classList.add('show');
            setTimeout(() => {
                toastEl.remove();
            }, 4000);
        }
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'danger'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); },
    match(msg) { this.show(msg, 'match'); }
};

// Expose globally
window.Toast = Toast;
