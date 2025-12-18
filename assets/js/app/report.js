document.addEventListener("DOMContentLoaded", () => {
  const reportModalEl = document.getElementById("reportUserModal");
  if (!reportModalEl) return;

  const reportForm = document.getElementById("reportUserForm");
  const submitBtn = document.getElementById("submitReportBtn");
  const otherReasonContainer = document.getElementById("otherReasonContainer");
  const otherReasonText = document.getElementById("otherReasonText");
  const reportRadios = reportForm.querySelectorAll(
    'input[name="reportReason"]'
  );
  const reportUserNameEl = document.getElementById("reportUserName");

  let reportedUserId = null;
  let reportedUserName = null;

  reportModalEl.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;
    reportedUserId = button.getAttribute("data-reported-user-id");
    reportedUserName = button.getAttribute("data-reported-user-name");
    reportUserNameEl.textContent = reportedUserName;
  });

  reportRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      submitBtn.disabled = false;
      otherReasonContainer.style.display =
        radio.value === "Other" ? "block" : "none";
    });
  });

  submitBtn.addEventListener("click", async () => {
    const selectedReason = reportForm.querySelector(
      'input[name="reportReason"]:checked'
    );
    if (!selectedReason || !reportedUserId) return;

    let reasonText =
      selectedReason.value === "Other"
        ? otherReasonText.value.trim()
        : selectedReason.value;
    if (!reasonText) {
      Toast.warning("Please describe the issue for 'Other'.");
      return;
    }

    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    // Freeze UI
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason: reasonText,
        }),
      });

      if (response.ok) {
        // Success flow
        const reportModal = bootstrap.Modal.getInstance(reportModalEl);
        reportModal.hide();

        reportForm.reset();
        otherReasonContainer.style.display = "none";

        // Prompt to block
        const blockModalEl = document.getElementById("blockUserModal");
        if (blockModalEl) {
          const blockUserNameEl = document.getElementById("blockUserName");
          blockUserNameEl.textContent = reportedUserName;
          blockModalEl.setAttribute("data-user-to-block", reportedUserId);

          const blockModal = new bootstrap.Modal(blockModalEl);
          blockModal.show();
        } else {
          Toast.success("Report submitted successfully.");
        }

      } else {
        const err = await response.json();
        Toast.error("Failed to submit report: " + (err.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Report Error:", error);
      Toast.error("An error occurred. Please try again.");
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false; // logic in listener usually keeps it disabled until change, but enable here for retry
    }
  });

  const confirmBlockBtn = document.getElementById("confirmBlockBtn");
  if (confirmBlockBtn) {
    confirmBlockBtn.addEventListener("click", async () => {
      const blockModalEl = document.getElementById("blockUserModal");
      const userToBlock = blockModalEl.getAttribute("data-user-to-block");
      const token = sessionStorage.getItem("userToken");

      if (!userToBlock || !token) return;

      confirmBlockBtn.disabled = true;
      confirmBlockBtn.textContent = "Blocking...";

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/users/${userToBlock}/block`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const blockModal = bootstrap.Modal.getInstance(blockModalEl);
          blockModal.hide();
          Toast.success(`${reportedUserName} has been blocked.`);
          window.location.reload(); // Refresh to remove user from view
        } else {
          const err = await response.json();
          Toast.error("Failed to block user: " + (err.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Block Error:", error);
        Toast.error("An error occurred while blocking.");
      } finally {
        confirmBlockBtn.disabled = false;
        confirmBlockBtn.textContent = "Yes, Block User";
      }
    });
  }
});
