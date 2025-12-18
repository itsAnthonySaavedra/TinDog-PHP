document.addEventListener("DOMContentLoaded", () => {
  console.log("Messages.js loaded");
  const chatContainerWrapper = document.querySelector(".chat-container-wrapper");
  if (!chatContainerWrapper) return;

  const convListBody = document.querySelector(".conv-list-body");
  const convListEmpty = document.getElementById("conv-list-empty");

  const chatHeader = document.getElementById("chat-header");
  const chatHeaderName = document.getElementById("chat-header-name");
  const chatHeaderAvatar = document.getElementById("chat-header-avatar");

  const chatEmptyState = document.getElementById("chat-empty-state");
  const chatContent = document.querySelector(".chat-content");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");

  const backButton = document.querySelector(".back-button");
  const reportButton = document.querySelector("[data-bs-target='#reportUserModal']");

  let currentConversationKey = null;
  let currentMatchUserId = null;
  let matches = [];

  // Helper to get logged in user ID (from token or session)
  // Since we don't have a direct way to get ID from token in JS without decoding,
  // we'll rely on the matches API to give us the context or just use local storage for messages keyed by match ID.
  const getLoggedInUserId = () => {
    // Use the standardized key from DataService
    return sessionStorage.getItem("loggedInUserId");
  };

  const loggedInUserId = getLoggedInUserId();

  // Helper to create message HTML
  const createMessageHTML = (message) => {
    // Loose equality to handle API (int) vs Session (string) mismatch
    const isMe = message.sender == loggedInUserId;
    const messageType = isMe ? "sent" : "received";
    return `<div class="message ${messageType}">
              <p>${message.text}</p>
              <span class="message-time">${message.time}</span>
            </div>`;
  };

  const loadConversation = async (matchUserId) => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    const match = matches.find((m) => m.user.id == matchUserId);
    if (!match) return;

    currentMatchUserId = matchUserId;
    // Removed legacy localStorage key generation

    // Update Header
    chatHeaderName.textContent = match.user.name;
    const avatarSrc =
      DataService.resolvePath(match.user.avatar) ||
      DataService.resolvePath("assets/images/default-avatar.png");
    chatHeaderAvatar.src = avatarSrc;

    if (reportButton) {
      reportButton.setAttribute("data-reported-user-id", matchUserId);
      reportButton.setAttribute("data-reported-user-name", match.user.name);
    }

    // Show Chat UI, Hide Empty State
    chatEmptyState.style.display = "none";
    chatHeader.style.display = "flex";
    chatContent.style.display = "block";
    messageForm.style.display = "flex";

    // Clear previous messages
    chatContent.innerHTML = '<div class="text-center p-3"><span class="spinner-border text-primary"></span></div>';

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/messages/${matchUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          chatContent.innerHTML = result.data.map(createMessageHTML).join("");
          chatContent.scrollTop = chatContent.scrollHeight;
        }
      } else {
        chatContent.innerHTML = '<p class="text-center text-danger">Failed to load messages.</p>';
      }
    } catch (error) {
      console.error("Load Messages Error:", error);
      chatContent.innerHTML = '<p class="text-center text-danger">Error loading conversation.</p>';
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    console.log("Submit intercepted. CurrentMatch:", currentMatchUserId);
    // alert("Submit intercepted!"); // Uncomment for hard debug


    const token = sessionStorage.getItem("userToken");
    const messageText = messageInput.value.trim();

    if (messageText === "") { console.log("Empty message"); return; }
    if (!currentMatchUserId) { console.error("No selected match ID"); return; }
    if (!token) { console.error("No token"); return; }

    // Optimistic UI update (optional) or loading state? 
    // Let's just disable input while sending to avoid double-send
    const submitBtn = messageForm.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch("http://127.0.0.1:8000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          receiver_id: currentMatchUserId,
          message: messageText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // result.data contains the new message object
          const newMessage = result.data;
          // The backend returns keys: 'sender', 'text', 'time' matching our createMessageHTML needs?
          // MessageController line 136: 'sender' => $message->sender_id...
          // createMessageHTML expects: message.sender, message.text, message.time
          // And compares message.sender === loggedInUserId.
          // loggedInUserId is set at top of file.

          chatContent.innerHTML += createMessageHTML(newMessage);
          chatContent.scrollTop = chatContent.scrollHeight;
          messageInput.value = "";
        }
      } else {
        console.error("Server Responded with Error:", response.status);
        try {
          const errorData = await response.json();
          console.error("ERROR JSON:", errorData);
          alert("Error: " + (errorData.message || "Unknown Server Error"));
          if (errorData.trace) console.log(errorData.trace);
        } catch (e) {
          alert("Server Error " + response.status + " (Cannot parse JSON)");
        }
      }
    } catch (error) {
      console.error("Send Message Error:", error);
      Toast.error("Failed to send message: " + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      messageInput.focus();
    }
  };

  const loadMatches = async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;

    // Show Loading State
    convListBody.innerHTML = `<div class="text-center p-4"><div class="spinner-border text-danger" role="status"></div></div>`;
    convListBody.style.display = "block";
    if (convListEmpty) convListEmpty.style.display = "none";

    try {
      const response = await fetch("http://127.0.0.1:8000/api/matches", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          matches = result.data;
          renderConversationList();
        }
      }
    } catch (error) {
      console.error("Matches Load Error:", error);
      convListBody.innerHTML = `<div class="text-center p-4 text-muted"><small>Failed to load matches.<br>Please refresh.</small></div>`;
    }
  };

  const renderConversationList = () => {
    convListBody.innerHTML = "";

    if (matches.length === 0) {
      convListBody.style.display = "none";
      if (convListEmpty) convListEmpty.style.display = "block";
      return;
    }

    convListBody.style.display = "block";
    if (convListEmpty) convListEmpty.style.display = "none";

    matches.forEach((match) => {
      const li = document.createElement("li");
      li.classList.add("conversation-item");
      li.dataset.userId = match.user.id;

      const avatarSrc = DataService.resolvePath(match.user.avatar) || DataService.resolvePath('assets/images/default-avatar.png');

      li.innerHTML = `
        <div class="avatar-wrapper">
          <img src="${avatarSrc}" alt="${match.user.name}" class="avatar" />
        </div>
        <div class="conv-details">
          <div class="conv-name">${match.user.name}</div>
          <div class="conv-preview">Click to start chatting</div>
        </div>
      `;

      li.addEventListener("click", () => {
        console.log("Conversation clicked:", match.user.id); // DEBUG
        document.querySelectorAll(".conversation-item").forEach(i => i.classList.remove("active"));
        li.classList.add("active");
        loadConversation(match.user.id);

        if (window.innerWidth < 768) {
          console.log("Mobile view detected, showing chat window."); // DEBUG
          chatContainerWrapper.classList.add("chat-active");
        }
      });

      convListBody.appendChild(li);
    });

    // Check URL params to auto-select a user
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('user');
    if (userIdParam) {
      const item = document.querySelector(`.conversation-item[data-user-id="${userIdParam}"]`);
      if (item) item.click();
    }
  };

  if (messageForm) {
    messageForm.addEventListener("submit", handleSendMessage);
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      chatContainerWrapper.classList.remove("chat-active");
      document.querySelectorAll(".conversation-item").forEach(i => i.classList.remove("active"));

      // Reset to empty state on mobile back? Maybe not necessary, but good for UX
      // chatEmptyState.style.display = "flex";
      // chatHeader.style.display = "none";
      // chatContent.style.display = "none";
      // messageForm.style.display = "none";
    });
  }

  loadMatches();
});
