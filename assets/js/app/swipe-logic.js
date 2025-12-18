/**
 * Swipe Logic
 * Handles the drag mechanics and API calls for swiping left/right.
 */

document.addEventListener("DOMContentLoaded", function () {
  const swipeDeck = document.querySelector(".swipe-deck");
  if (!swipeDeck) {
    console.error("Swipe Deck container not found!");
    return;
  }

  const dislikeButton = document.querySelector(".btn-swipe.dislike");
  const likeButton = document.querySelector(".btn-swipe.like");

  let activeCard = null;
  let startX, startY, moveX, moveY;
  let isDragging = false;

  // --- 1. Initialize Cards ---
  const initializeCards = () => {
    const cards = document.querySelectorAll(".match-card");
    if (cards.length > 0) {
      // Last one in DOM is top of stack (visually on top due to default stacking or z-index)
      activeCard = cards[cards.length - 1];
      console.log("Swipe Logic: Active card set to", activeCard.dataset.userId);
    } else {
      activeCard = null;
      console.log("Swipe Logic: No cards found");
    }
  };

  // --- 2. API Handler ---
  const handleSwipe = async (targetUserId, type, pupName) => {
    // If DataService is available, use it to get token? Or matches session storage.
    // Deck loader uses DataService.getToken(), let's match that if possible, or fallback.
    const token = sessionStorage.getItem("userToken");

    if (!token || !targetUserId) {
      console.error("Missing token or targetUserId");
      return;
    }

    console.log(`Swiping ${type} on ${targetUserId}`);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          target_user_id: targetUserId,
          type: type,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Show match modal
        if (result.success && result.is_match) {
          console.log("It's a Match!");
          const matchModalEl = document.getElementById("matchSuccessModal");
          if (matchModalEl && typeof bootstrap !== 'undefined') {
            document.getElementById("match-pup-name").textContent = pupName || "that pup";
            document.getElementById("match-message-btn").href = `../messages.html?userId=${targetUserId}`;

            const modal = new bootstrap.Modal(matchModalEl);
            modal.show();
          } else {
            // Fallback
            if (typeof Toast !== 'undefined') Toast.match(`It's a Match w/ ${pupName}!`);
          }
        }
      } else {
        console.warn("Swipe failed:", response.status);
      }
    } catch (error) {
      console.error("Swipe Error:", error);
    }
  };

  // --- 3. Drag Handlers ---
  const startDrag = (e) => {
    // Try to init if missing (recovery)
    if (!activeCard) initializeCards();

    if (!activeCard) return;
    if (e.target.closest('.info-button')) return; // Ignore clicks on info button

    isDragging = true;
    startX = e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
    startY = e.type === "mousedown" ? e.clientY : e.touches[0].clientY;

    activeCard.style.transition = "none";

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);
  };

  const onDrag = (e) => {
    if (!isDragging || !activeCard) return;

    // Prevent scrolling on mobile while swiping cards
    if (e.type === "touchmove") {
      e.preventDefault();
    }

    const currentX = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
    const currentY = e.type === "mousemove" ? e.clientY : e.touches[0].clientY;

    moveX = currentX - startX;
    moveY = currentY - startY;

    // Rotate and translate
    // Rotation proportional to X movement (max 30deg)
    const rotate = moveX * 0.1;
    activeCard.style.transform = `translate(${moveX}px, ${moveY * 0.2}px) rotate(${rotate}deg)`;

    // Opacity changes for stamps
    const likeStamp = activeCard.querySelector(".stamp.like");
    const nopeStamp = activeCard.querySelector(".stamp.dislike");

    if (moveX > 0) {
      if (likeStamp) likeStamp.style.opacity = Math.min(moveX / 100, 1);
      if (nopeStamp) nopeStamp.style.opacity = 0;
      swipeDeck.classList.add("swiping-right");
      swipeDeck.classList.remove("swiping-left");
    } else {
      if (nopeStamp) nopeStamp.style.opacity = Math.min(Math.abs(moveX) / 100, 1);
      if (likeStamp) likeStamp.style.opacity = 0;
      swipeDeck.classList.add("swiping-left");
      swipeDeck.classList.remove("swiping-right");
    }
  };

  const endDrag = (e) => {
    if (!isDragging || !activeCard) return;
    isDragging = false;

    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("touchend", endDrag);

    // Threshold for swipe
    const threshold = 100;

    if (Math.abs(moveX) > threshold) {
      const direction = moveX > 0 ? 1 : -1;
      const type = direction === 1 ? 'like' : 'nope';

      if (activeCard.dataset.userId) {
        const nameEl = activeCard.querySelector("h3");
        const rawName = nameEl ? nameEl.innerText.split(',')[0] : "that pup";
        handleSwipe(activeCard.dataset.userId, type, rawName);
      }
      dismissCard(direction);
    } else {
      resetActiveCard();
    }

    moveX = 0;
    moveY = 0;
    swipeDeck.classList.remove("swiping-left", "swiping-right");
  };

  // --- 4. Animation Helpers ---
  const dismissCard = (direction) => {
    if (!activeCard) return;

    // Remove listeners / draggable state immediately to prevent double swipe
    const currentCard = activeCard;
    activeCard = null; // Prevent further interaction with this card

    currentCard.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";

    // Fly out off screen
    const endX = direction * window.innerWidth;
    const rotate = direction * 45;

    currentCard.style.transform = `translate(${endX}px, 0px) rotate(${rotate}deg)`;
    currentCard.style.opacity = "0";

    // Remove from DOM after animation
    setTimeout(() => {
      currentCard.remove();
      initializeCards(); // Load next
    }, 500);
  };

  const resetActiveCard = () => {
    if (!activeCard) return;
    activeCard.style.transition = "transform 0.3s ease-out";
    activeCard.style.transform = "translate(0px, 0px) rotate(0deg)";

    const stamps = activeCard.querySelectorAll(".stamp");
    stamps.forEach(s => s.style.opacity = "0");
  };

  // --- 5. Button Listeners ---
  const triggerSwipe = (type) => {
    // Always try to refresh activeCard in case it was missed
    if (!activeCard) initializeCards();

    if (!activeCard) {
      console.warn("Cannot swipe: No active card found.");
      return;
    }

    const card = activeCard; // Capture ref
    const userId = card.dataset.userId;

    if (userId) {
      const nameEl = card.querySelector("h3");
      const rawName = nameEl ? nameEl.innerText.split(',')[0] : "that pup";
      handleSwipe(userId, type, rawName);
    }

    const direction = type === 'like' ? 1 : -1;

    // Programmatic animate
    card.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
    card.style.transform = `translate(${direction * window.innerWidth}px, 50px) rotate(${direction * 30}deg)`;
    card.style.opacity = "0";

    // Clear activeCard immediately so user can't click again on same one
    activeCard = null;

    setTimeout(() => {
      card.remove();
      initializeCards();
    }, 400);
  };

  if (dislikeButton) {
    dislikeButton.onclick = (e) => {
      e.preventDefault(); // Prevent focus issues
      triggerSwipe('nope');
    };
  }

  if (likeButton) {
    likeButton.onclick = (e) => {
      e.preventDefault();
      triggerSwipe('like');
    };
  }

  // --- 6. Event Binding ---
  // Wait for Loader to say "Ready"
  document.addEventListener("deckPopulated", () => {
    console.log("Event: deckPopulated received, initializing cards...");
    initializeCards();
  });

  // Bind drag to the Deck container, delegating to active card check
  // We bind these immediately on DOMContentLoaded.
  swipeDeck.addEventListener("mousedown", startDrag);
  swipeDeck.addEventListener("touchstart", startDrag, { passive: false });

  // Initial check (in case cards are already there)
  initializeCards();
});
