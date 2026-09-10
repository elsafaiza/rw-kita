document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const passwordIcon = document.querySelector(".password-icon");

  if (!passwordInput || !passwordIcon) {
    return;
  }

  passwordIcon.addEventListener("click", () => {
    passwordInput.type =
      passwordInput.type === "password"
        ? "text"
        : "password";
  });
});