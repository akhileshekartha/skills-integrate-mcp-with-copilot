document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const authHint = document.getElementById("auth-hint");

  const userMenuToggle = document.getElementById("user-menu-toggle");
  const userMenuPanel = document.getElementById("user-menu-panel");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const cancelLoginButton = document.getElementById("cancel-login");
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  const registerModal = document.getElementById("register-modal");
  const registerForm = document.getElementById("register-form");
  const registerActivityName = document.getElementById("register-activity-name");
  const registerEmailInput = document.getElementById("register-email");
  const cancelRegisterButton = document.getElementById("cancel-register");

  let teacherToken = localStorage.getItem("teacherToken") || "";
  let teacherUsername = localStorage.getItem("teacherUsername") || "";
  let pendingRegisterActivity = "";

  function isTeacherLoggedIn() {
    return Boolean(teacherToken);
  }

  function updateAuthUI() {
    const loggedIn = isTeacherLoggedIn();

    loginButton.classList.toggle("hidden", loggedIn);
    logoutButton.classList.toggle("hidden", !loggedIn);
    userMenuToggle.textContent = loggedIn
      ? `Teacher: ${teacherUsername}`
      : "User";

    authHint.textContent = loggedIn
      ? "Teacher logged in. Use the register button on each activity card."
      : "Teacher login is required to register or unregister students. Use the button on each card after login.";
  }

  function setMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      const loggedIn = isTeacherLoggedIn();

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        loggedIn
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">Remove</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="card-actions">
            <button class="register-btn" data-activity="${name}">Register Student</button>
          </div>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);
      });

      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", handleRegisterClick);
      });

      // Add event listeners to delete buttons
      if (loggedIn) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function handleRegisterClick(event) {
    const activity = event.target.getAttribute("data-activity");
    if (!isTeacherLoggedIn()) {
      setMessage("Please log in as a teacher to register students.", "error");
      loginModal.classList.remove("hidden");
      usernameInput.focus();
      return;
    }

    pendingRegisterActivity = activity;
    registerActivityName.textContent = activity;
    registerForm.reset();
    registerModal.classList.remove("hidden");
    registerEmailInput.focus();
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!isTeacherLoggedIn()) {
      setMessage("Please log in as a teacher.", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            "X-Teacher-Token": teacherToken,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  userMenuToggle.addEventListener("click", () => {
    userMenuPanel.classList.toggle("hidden");
  });

  loginButton.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
    userMenuPanel.classList.add("hidden");
    usernameInput.focus();
  });

  cancelLoginButton.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
  });

  cancelRegisterButton.addEventListener("click", () => {
    registerModal.classList.add("hidden");
    registerForm.reset();
    pendingRegisterActivity = "";
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: {
          "X-Teacher-Token": teacherToken,
        },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }

    teacherToken = "";
    teacherUsername = "";
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUsername");
    updateAuthUI();
    fetchActivities();
    userMenuPanel.classList.add("hidden");
    setMessage("Logged out.", "success");
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isTeacherLoggedIn()) {
      setMessage("Please log in as a teacher.", "error");
      registerModal.classList.add("hidden");
      return;
    }

    const email = registerEmailInput.value.trim();
    if (!pendingRegisterActivity || !email) {
      setMessage("Please provide a valid student email.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          pendingRegisterActivity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            "X-Teacher-Token": teacherToken,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessage(result.message, "success");
        registerModal.classList.add("hidden");
        registerForm.reset();
        pendingRegisterActivity = "";
        fetchActivities();
      } else {
        setMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      setMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput.value,
          password: passwordInput.value,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setMessage(result.detail || "Login failed.", "error");
        return;
      }

      teacherToken = result.token;
      teacherUsername = result.username;
      localStorage.setItem("teacherToken", teacherToken);
      localStorage.setItem("teacherUsername", teacherUsername);

      loginModal.classList.add("hidden");
      loginForm.reset();
      updateAuthUI();
      fetchActivities();
      setMessage(`Welcome, ${teacherUsername}.`, "success");
    } catch (error) {
      setMessage("Unable to log in right now.", "error");
      console.error("Error logging in:", error);
    }
  });

  document.addEventListener("click", (event) => {
    if (!document.getElementById("user-menu").contains(event.target)) {
      userMenuPanel.classList.add("hidden");
    }

    if (event.target === loginModal) {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }

    if (event.target === registerModal) {
      registerModal.classList.add("hidden");
      registerForm.reset();
      pendingRegisterActivity = "";
    }
  });

  // Initialize app
  updateAuthUI();
  fetchActivities();
});
