// frontend/js/signup.js

const API_BASE = "http://localhost:4000";

const form = document.getElementById("signupForm");
const emailInput = document.getElementById("suEmail");
const pwdInput = document.getElementById("suPassword");
const confirmInput = document.getElementById("suConfirm");

const emailErr = document.getElementById("suEmailErr");
const pwdErr = document.getElementById("suPwdErr");
const confirmErr = document.getElementById("suConfirmErr");
const toast = document.getElementById("suToast");

const signupBtn = document.getElementById("signupBtn");
const btnText = signupBtn.querySelector(".btn-text");
const loader = signupBtn.querySelector(".loader");

function setLoading(isLoading) {
  if (isLoading) {
    signupBtn.disabled = true;
    loader.style.display = "inline-block";
    btnText.textContent = "CREATING...";
  } else {
    signupBtn.disabled = false;
    loader.style.display = "none";
    btnText.textContent = "CREATE ACCOUNT";
  }
}

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.display = "block";
  toast.style.background = isError ? "#ffe6e6" : "#f5f5f5";
  toast.style.color = isError ? "#b00020" : "#333";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  emailErr.textContent = "";
  pwdErr.textContent = "";
  confirmErr.textContent = "";
  toast.style.display = "none";

  const email = emailInput.value.trim();
  const password = pwdInput.value.trim();
  const confirm = confirmInput.value.trim();

  let hasError = false;
  if (!email) {
    emailErr.textContent = "Email required";
    hasError = true;
  }

  if (!password) {
    pwdErr.textContent = "Password required";
    hasError = true;
  } else if (password.length < 6) {
    pwdErr.textContent = "Password must be at least 6 characters";
    hasError = true;
  }

  if (!confirm) {
    confirmErr.textContent = "Confirm your password";
    hasError = true;
  } else if (confirm !== password) {
    confirmErr.textContent = "Passwords do not match";
    hasError = true;
  }

  if (hasError) return;

  try {
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Could not create account", true);
      return;
    }

    // store email so login page can prefill
    localStorage.setItem("aara_login_email", email);

// 🔥 treat new user as logged in and store for home page
    if (data && data.id && data.email) {
      localStorage.setItem(
        "aara_current_user",
        JSON.stringify({ id: data.id, email: data.email })
      );
    } else {
      // fallback – still store something
      localStorage.setItem(
        "aara_current_user",
        JSON.stringify({ email })
      );
    }

    

    showToast("Account created! Redirecting to login...");
    setTimeout(() => {
      window.location.href = "./homePage.html";
    }, 900);
  } catch (err) {
    console.error(err);
    showToast("Network error. Please try again.", true);
  } finally {
    setLoading(false);
  }
});
