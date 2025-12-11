// frontend/js/home.js

(function initHome() {
  const raw = localStorage.getItem("aara_current_user");

  // If no user in storage, go back to login
  if (!raw) {
    window.location.href = "./index.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(raw);
  } catch {
    window.location.href = "./index.html";
    return;
  }

  const welcomeEmailEl = document.getElementById("welcomeEmail");
  welcomeEmailEl.textContent = user.email || "Guest";

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("aara_current_user");
    window.location.href = "./index.html";
  });
})();
