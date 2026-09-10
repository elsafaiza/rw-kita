(function () {
  "use strict";

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      initHalamanKontak();
    }
  );

  async function initHalamanKontak() {
    // Aktifkan form terlebih dahulu.
    // Form tetap berfungsi meskipun data RW gagal dimuat.
    aktifkanFormPesan();

    try {
      const rw = await ambilRW();

      if (rw) {
        tampilkanDataKontak(rw);
      }
    } catch (error) {
      console.error(
        "Gagal memuat data kontak:",
        error
      );
    }
  }

  function getClient() {
    if (
      window.RWKita &&
      typeof window.RWKita.requireClient ===
        "function"
    ) {
      return window.RWKita.requireClient();
    }

    if (window.supabaseClient) {
      return window.supabaseClient;
    }

    throw new Error(
      "Supabase client belum tersedia."
    );
  }

  async function ambilRW() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const nomorRW =
      params.get("rw") || "RW 01";

    const client = getClient();

    const result = await client
      .from("rws")
      .select(
        "id, nomor_rw, alamat, telepon, email"
      )
      .eq("nomor_rw", nomorRW)
      .eq("is_active", true)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data || null;
  }

  function tampilkanDataKontak(rw) {
    const title =
      document.getElementById("kontak-title");

    const description =
      document.getElementById(
        "kontak-description"
      );

    const alamat =
      document.getElementById("kontak-alamat");

    const telepon =
      document.getElementById("kontak-telepon");

    const email =
      document.getElementById("kontak-email");

    const footerEmail =
      document.getElementById("footer-email");

    if (title) {
      title.textContent =
        `Hubungi ${rw.nomor_rw}`;
    }

    if (description) {
      description.textContent =
        `Silakan hubungi pengurus ${rw.nomor_rw} untuk informasi, saran, dan kerja sama.`;
    }

    if (alamat) {
      alamat.textContent =
        rw.alamat || "Alamat belum tersedia.";
    }

    if (telepon) {
      telepon.textContent =
        rw.telepon ||
        "Nomor telepon belum tersedia.";
    }

    if (email) {
      email.textContent =
        rw.email || "Email belum tersedia.";
    }

    if (footerEmail) {
      footerEmail.textContent =
        rw.email || "Email belum tersedia.";
    }
  }

  function aktifkanFormPesan() {
    const form =
      document.getElementById("kontak-form");

    const namaInput =
      document.getElementById("nama");

    const emailInput =
      document.getElementById("email");

    const pesanInput =
      document.getElementById("pesan");

    const submitButton =
      document.getElementById("kirim-pesan");

    if (
      !form ||
      !namaInput ||
      !emailInput ||
      !pesanInput ||
      !submitButton
    ) {
      console.error(
        "Elemen form kontak belum lengkap."
      );

      return;
    }

    if (
      form.dataset.contactBound === "true"
    ) {
      return;
    }

    form.dataset.contactBound = "true";

    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();

        const nama =
          namaInput.value.trim();

        const email =
          emailInput.value.trim();

        const pesan =
          pesanInput.value.trim();

        if (!nama || !email || !pesan) {
          tampilkanPesan(
            "Nama, email, dan pesan wajib diisi.",
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

        const teksAwal =
          submitButton.textContent;

        submitButton.disabled = true;
        submitButton.textContent =
          "Mengirim...";

        try {
          const client = getClient();

          const result = await client
            .from("pesan_kontak")
            .insert({
              nama_pengirim: nama,
              email: email,
              subjek:
                "Pesan dari Website RW KITA",
              pesan: pesan,
              status: "unread"
            });

          if (result.error) {
            throw result.error;
          }

          form.reset();

          tampilkanPesan(
            "Pesan berhasil dikirim. Terima kasih.",
            "success"
          );
        } catch (error) {
          console.error(
            "Gagal menyimpan pesan:",
            error
          );

          tampilkanPesan(
            "Pesan gagal dikirim. Silakan coba lagi.",
            "error"
          );
        } finally {
          submitButton.disabled = false;
          submitButton.textContent =
            teksAwal;
        }
      }
    );
  }

  function tampilkanPesan(teks, tipe) {
    const message =
      document.getElementById(
        "form-message"
      );

    if (message) {
      message.textContent = teks;
      message.className =
        `form-message ${tipe}`;
    }

    if (
      window.RWKita &&
      typeof window.RWKita.toast ===
        "function"
    ) {
      window.RWKita.toast(
        teks,
        tipe === "error"
          ? "error"
          : "success"
      );
    } else {
      alert(teks);
    }
  }
})();