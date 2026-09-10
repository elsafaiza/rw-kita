(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      const form =
        document.getElementById("login-form");

      const emailInput =
        document.getElementById("username");

      const passwordInput =
        document.getElementById("password");

      const togglePassword =
        document.getElementById(
          "togglePassword"
        );

      const loginButton =
        document.querySelector(".login-button");

      const message =
        document.getElementById(
          "login-message"
        );

      const rememberInput =
        document.querySelector(
          'input[name="remember"]'
        );

      const forgotPassword =
        document.getElementById(
          "forgot-password"
        );

      if (
        !form ||
        !emailInput ||
        !passwordInput ||
        !loginButton
      ) {
        console.error(
          "Elemen form login belum lengkap."
        );

        return;
      }

      const savedEmail =
        localStorage.getItem(
          "rwKitaRememberedEmail"
        );

      if (savedEmail) {
        emailInput.value = savedEmail;

        if (rememberInput) {
          rememberInput.checked = true;
        }
      }

      if (togglePassword) {
        togglePassword.addEventListener(
          "click",
          function () {
            const sedangPassword =
              passwordInput.type === "password";

            passwordInput.type =
              sedangPassword
                ? "text"
                : "password";

            togglePassword.setAttribute(
              "aria-label",
              sedangPassword
                ? "Sembunyikan password"
                : "Tampilkan password"
            );
          }
        );
      }

      if (forgotPassword) {
        forgotPassword.addEventListener(
          "click",
          function (event) {
            event.preventDefault();

            tampilkanPesan(
              "Silakan hubungi Super Admin untuk mengatur ulang password.",
              "info"
            );
          }
        );
      }

      form.addEventListener(
        "submit",
        async function (event) {
          event.preventDefault();

          const email =
            emailInput.value.trim();

          const password =
            passwordInput.value;

          if (!email || !password) {
            tampilkanPesan(
              "Email dan password wajib diisi.",
              "error"
            );

            return;
          }

          if (!emailInput.checkValidity()) {
            tampilkanPesan(
              "Masukkan alamat email yang valid.",
              "error"
            );

            emailInput.focus();
            return;
          }

          if (
            rememberInput &&
            rememberInput.checked
          ) {
            localStorage.setItem(
              "rwKitaRememberedEmail",
              email
            );
          } else {
            localStorage.removeItem(
              "rwKitaRememberedEmail"
            );
          }

          loginButton.disabled = true;
          loginButton.textContent =
            "Memproses...";

          try {
            if (!window.supabaseClient) {
              throw new Error(
                "Supabase belum terhubung."
              );
            }

            const result =
              await window.supabaseClient.auth
                .signInWithPassword({
                  email: email,
                  password: password
                });

            if (result.error) {
              throw result.error;
            }

            tampilkanPesan(
              "Login berhasil. Mengarahkan ke dashboard...",
              "success"
            );

            setTimeout(function () {
              window.location.replace(
                "dashboard_admin.html"
              );
            }, 700);
          } catch (error) {
            console.error(
              "Login gagal:",
              error
            );

            tampilkanPesan(
              "Email atau password salah.",
              "error"
            );

            loginButton.disabled = false;
            loginButton.textContent = "Masuk";
          }
        }
      );

      function tampilkanPesan(teks, tipe) {
        if (!message) {
          alert(teks);
          return;
        }

        message.textContent = teks;
        message.className =
          `login-message ${tipe}`;
      }
    }
  );
})();