const API_BASE = "http://localhost:4000";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");

const emailErr = document.getElementById("emailErr");
const pwdErr = document.getElementById("pwdErr");
const toast = document.getElementById("toast");

const loginBtn = document.getElementById("loginBtn");
const btnText = loginBtn.querySelector(".btn-text");
const loader = loginBtn.querySelector(".loader");
const forgotLink = document.getElementById("forgotLink");

// ---- helpers ----
function setLoading(isLoading) {
  if (isLoading) {
    loginBtn.disabled = true;
    loader.style.display = "inline-block";
    btnText.textContent = "LOGGING IN...";
  } else {
    loginBtn.disabled = false;
    loader.style.display = "none";
    btnText.textContent = "LOGIN";
  }
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.display = "block";
  toast.style.background = isError ? "#ffe6e6" : "#f5f5f5";
  toast.style.color = isError ? "#b00020" : "#333";
}

// restore remembered email
(function restoreRememberedEmail() {
  const savedEmail = localStorage.getItem("aara_login_email");
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberInput.checked = true;
  }
})();

// ---- login submit ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  emailErr.textContent = "";
  pwdErr.textContent = "";
  toast.style.display = "none";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let hasError = false;
  if (!email) {
    emailErr.textContent = "Email required";
    hasError = true;
  }
  if (!password) {
    pwdErr.textContent = "Password required";
    hasError = true;
  }
  if (hasError) return;

  try {
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Login failed", true);
      return;
    }

    // remember email if requested
    if (rememberInput.checked) {
      localStorage.setItem("aara_login_email", email);
    } else {
      localStorage.removeItem("aara_login_email");
    }

    // store current user for home page
    localStorage.setItem("aara_current_user", JSON.stringify(data.user));

    showToast("Login success! Redirecting...");
    setTimeout(() => {
      window.location.href = "./homePage.html";
    }, 800);
  } catch (err) {
    console.error(err);
    showToast("Network error. Please try again.", true);
  } finally {
    setLoading(false);
  }
});

// ---- forgot password ----
forgotLink.addEventListener("click", async (e) => {
  e.preventDefault();
  toast.style.display = "none";
  emailErr.textContent = "";

  const email = emailInput.value.trim();
  if (!email) {
    emailErr.textContent = "Enter your email first";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    showToast(
      data.message ||
        "If this email is registered, a reset link has been generated (check backend console)."
    );
  } catch (err) {
    console.error(err);
    showToast("Network error. Please try again.", true);
  }
});
