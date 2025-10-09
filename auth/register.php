<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TinDog - Register</title>
    <link
      rel="icon"
      type="image/png"
      href="/assets/images/favicon-transparent.png"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"
    />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css"
    />
    <link rel="stylesheet" href="../assets/css/main.css" />
  </head>
  <body class="gradient-background d-flex flex-column min-vh-100">
    <header class="py-3 text-center">
      <a
        href="/index.html"
        class="navbar-brand fs-1 text-decoration-none"
        style="color: white"
        >tindog</a
      >
    </header>
    <main class="d-flex align-items-center justify-content-center flex-grow-1">
      <div class="tindog-card text-center" style="max-width: 450px">
        <h2 class="h3 mb-4">Create an Account</h2>
        <form id="register-form" action="process/register_process.php" method="POST" novalidate>
          <div class="mb-3 text-start">
            <label for="firstName" class="form-label">First Name</label>
            <input
              type="text"
              class="form-control"
              id="firstName"
              name="firstName"
              required
            />
            <div class="invalid-feedback">First name is required.</div>
          </div>
          <div class="mb-3 text-start">
            <label for="email" class="form-label">Email address</label>
            <input
              type="email"
              class="form-control"
              id="email"
              name="email"
              required
            />
            <div class="invalid-feedback">Please enter a valid email.</div>
          </div>
          <div class="mb-3 text-start">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              class="form-control"
              id="password"
              name="password"
              minlength="8"
              required
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            />
            <div class="invalid-feedback">
              Must contain at least one number, one uppercase and one lowercase
              letter, and be at least 8 characters long.
            </div>
            <div class="invalid-feedback">
              Must contain at least one number, one uppercase and one lowercase
              letter, and be at least 8 characters long.
            </div>
          </div>
          <div class="mb-3 form-check text-start">
            <input
              type="checkbox"
              class="form-check-input"
              id="terms"
              required
            />
            <label class="form-check-label" for="terms"
              >I agree to the
              <a href="#" data-bs-toggle="modal" data-bs-target="#termsModal"
                >Terms & Conditions</a
              ></label
            >
            <div class="invalid-feedback">
              You must agree before submitting.
            </div>
          </div>
          <span
            class="d-grid"
            data-bs-toggle="tooltip"
            data-bs-placement="bottom"
            title="Please agree to the Terms & Conditions to proceed."
          >
            <button
              type="submit"
              id="register-button"
              class="btn btn-tindog-primary w-100 btn-lg"
            >
              Register
            </button>
          </span>
          <div class="text-center mt-3">
            <p>
              Already have an account?
              <a href="../auth/index.php">Login here</a>
            </p>
          </div>
        </form>
        <hr />
        <a href="/index.html" class="text-decoration-none text-muted small"
          ><i class="bi bi-house-door me-2"></i>Back to Home</a
        >
      </div>
    </main>
    <div class="modal fade" id="termsModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Terms of Service</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body text-start"></div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-tindog-primary"
              data-bs-dismiss="modal"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/js/auth/form-validator.js"></script>
    <script src="../assets/js/auth/registration.js"></script>
    <script src="../assets/js/utils/initializer.js"></script>
  </body>
</html>
