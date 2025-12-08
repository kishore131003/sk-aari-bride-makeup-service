const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const remember = document.getElementById("remember");
const togglePwd = document.getElementById("togglePwd");
const loginBtn = document.getElementById("loginBtn");

const emailErr = document.getElementById("emailErr");
const pwdErr = document.getElementById("pwdErr");
const toast = document.getElementById("toast");

const rememberedEmail = localStorage.getItem("rememberEmail");
if (rememberedEmail) {
  email.value = rememberedEmail;
  remember.checked = true;
}

togglePwd.addEventListener("click", () => {
  password.type = password.type === "password" ? "text" : "password";
});

function validate() {
  let ok = true;
  emailErr.textContent = "";
  pwdErr.textContent = "";

  const vEmail = email.value.trim();
  const vPwd = password.value;

  if (!vEmail) { emailErr.textContent = "Email is required"; ok = false; }
  else if (!/^\S+@\S+\.\S+$/.test(vEmail)) { emailErr.textContent = "Enter a valid email"; ok = false; }

  if (!vPwd) { pwdErr.textContent = "Password is required"; ok = false; }
  else if (vPwd.length < 6) { pwdErr.textContent = "Minimum 6 characters"; ok = false; }

  return ok;
}

function loading(on) {
  loginBtn.disabled = on;
  loginBtn.querySelector(".loader").style.display = on ? "inline-block" : "none";
  loginBtn.querySelector(".btn-text").textContent = on ? "LOGGING..." : "LOGIN";
}

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => (toast.style.display = "none"), 2200);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validate()) return;

  if (remember.checked) localStorage.setItem("rememberEmail", email.value.trim());
  else localStorage.removeItem("rememberEmail");

  loading(true);
  setTimeout(() => {
    sessionStorage.setItem("accessToken", "demo_access_token");
    loading(false);
    showToast("Login successful ✅ (demo)");
  }, 900);
});
