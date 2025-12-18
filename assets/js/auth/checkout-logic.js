document.addEventListener("DOMContentLoaded", () => {
  // Input Formatting Logic
  const setupInputFormatting = () => {
    const cardInput = document.getElementById('cardNumber');
    const cvcInput = document.getElementById('cvc');

    if (cardInput) {
      cardInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
      });
    }

    if (cvcInput) {
      cvcInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
      });
    }
  };

  setupInputFormatting();
  const planDetails = {
    labrador: {
      name: "Labrador Plan",
      monthly: {
        price: "₱49.00",
        billed: "₱49.00",
        cycleText: "/mo",
      },
      annual: {
        price: "₱490.00",
        billed: "₱490.00",
        cycleText: "/yr",
      },
      features: ["Unlimited Matches", "Unlimited Messages", "Advanced Filters"],
    },
    mastiff: {
      name: "Mastiff Plan",
      monthly: {
        price: "₱99.00",
        billed: "₱99.00",
        cycleText: "/mo",
      },
      annual: {
        price: "₱990.00",
        billed: "₱990.00",
        cycleText: "/yr",
      },
      features: [
        "Unlimited Matches & Messages",
        "Advanced Filters",
        "Priority Listing",
      ],
    },
  };

  const getUrlParameter = (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  };

  const updateTextContent = (elementId, text) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    }
  };

  const updateFeaturesList = (features) => {
    const featuresListElement = document.getElementById("plan-features");
    if (!featuresListElement) return;
    featuresListElement.innerHTML = "";
    features.forEach((featureText) => {
      const listItem = document.createElement("li");
      listItem.className = "mb-2";
      listItem.innerHTML = `<i class="bi bi-check-circle-fill text-success me-2"></i>${featureText}`;
      featuresListElement.appendChild(listItem);
    });
  };

  const initializeCheckoutPage = () => {
    const selectedPlanKey = getUrlParameter("plan") || "labrador";
    const selectedBilling = getUrlParameter("billing") || "monthly";
    const currentPlan = planDetails[selectedPlanKey];

    if (currentPlan) {
      const planData = currentPlan[selectedBilling] || currentPlan.monthly;

      updateTextContent("plan-name", currentPlan.name);
      updateTextContent("plan-price", planData.price);
      updateTextContent("price-cycle", planData.cycleText);
      updateTextContent("billed-now", planData.billed);
      updateFeaturesList(currentPlan.features);
    }
  };

  const handleCheckout = async () => {
    // 1. Get Token
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      Toast.error("Session expired. Please log in again.");
      window.location.href = "../auth/index.html";
      return;
    }

    // 2. Identify the selected plan parameters
    const selectedPlanKey = getUrlParameter("plan") || "labrador";
    const selectedBilling = getUrlParameter("billing") || "monthly";

    const submitBtn = document.querySelector("#checkout-form button[type='submit']");
    const originalBtnText = submitBtn ? submitBtn.textContent : "Confirm Payment";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';
    }

    try {
      // 3. Call API
      const response = await fetch("http://127.0.0.1:8000/api/subscription/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlanKey,
          billing_cycle: selectedBilling,
          billing: selectedBilling, // Fix: Sending both to satisfy backend validation "billing field is required"
          payment_method: "credit_card" // Mock payment method
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // 4. Update Session Storage (Immediate Effect)
        sessionStorage.setItem("userPlan", selectedPlanKey);

        const successMsg = result.message || "Payment successful! Your plan has been upgraded.";
        Toast.success(successMsg);

        // Wait a small moment for toast then redirect
        setTimeout(() => {
          window.location.href = "../app/dashboard.html";
        }, 1500);
      } else {
        throw new Error(result.message || "Subscription failed.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      Toast.error(error.message || "An error occurred during checkout.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  };

  initializeCheckoutPage();

  if (window.initializeFormValidation) {
    window.initializeFormValidation("checkout-form", handleCheckout);
  }
});
