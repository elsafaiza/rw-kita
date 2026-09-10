(function (window) {
  "use strict";

  const RWKita = window.RWKita || {};

  RWKita.escapeHTML = function (value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  RWKita.requireClient = function () {
    if (
      !window.supabaseClient ||
      typeof window.supabaseClient.from !== "function"
    ) {
      throw new Error(
        "Supabase client belum tersedia."
      );
    }

    return window.supabaseClient;
  };

  RWKita.getParam = function (name, fallback = "") {
    return (
      new URLSearchParams(window.location.search).get(name) ||
      fallback
    );
  };

  RWKita.getRWNumber = function () {
    return (
      RWKita.getParam("rw", "RW 01").trim() ||
      "RW 01"
    );
  };

  RWKita.formatDate = function (value, fallback = "-") {
    if (!value) return fallback;

    let date;

    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      date = new Date(`${value}T00:00:00`);
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return fallback;
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  RWKita.getRW = async function (
    nomorRW = RWKita.getRWNumber()
  ) {
    const client = RWKita.requireClient();

    const { data, error } = await client
      .from("rws")
      .select("*")
      .eq("nomor_rw", nomorRW)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  };

  RWKita.getActiveRWs = async function () {
    const client = RWKita.requireClient();

    const { data, error } = await client
      .from("rws")
      .select(
        "id, nomor_rw, nama_rw, kelurahan, kecamatan"
      )
      .eq("is_active", true)
      .order("nomor_rw", {
        ascending: true
      });

    if (error) {
      throw error;
    }

    return data || [];
  };

  RWKita.uploadFile = async function (
    file,
    folder = "media"
  ) {
    if (!file) return null;

    const client = RWKita.requireClient();

    const extension = (
      file.name.split(".").pop() || "bin"
    ).toLowerCase();

    const filename =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}.${extension}`;

    const filePath = `${folder}/${filename}`;

    const bucketCandidates = [
      "rw-kita",
      "rwkita",
      "media",
      "uploads",
      "public"
    ];

    let lastError = null;

    for (const bucket of bucketCandidates) {
      const result = await client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined
        });

      if (!result.error) {
        const publicURL = client.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return publicURL.data.publicUrl;
      }

      lastError = result.error;
    }

    throw (
      lastError ||
      new Error(
        "Tidak ada bucket storage Supabase yang dapat digunakan."
      )
    );
  };

  RWKita.toast = function (
    message,
    type = "info"
  ) {
    let toast = document.getElementById(
      "rwkita-toast"
    );

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "rwkita-toast";

      toast.style.cssText = `
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 99999;
        max-width: 360px;
        padding: 14px 18px;
        border-radius: 10px;
        color: #ffffff;
        font: 500 14px/1.4 system-ui, sans-serif;
        box-shadow: 0 8px 24px rgba(0,0,0,.18);
        transition: opacity .2s ease;
      `;

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.background =
      type === "error"
        ? "#b42318"
        : type === "success"
        ? "#087443"
        : "#2457a6";

    toast.style.opacity = "1";

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
    }, 3500);
  };

  RWKita.setBusy = function (
    button,
    busy,
    busyText = "Memproses..."
  ) {
    if (!button) return;

    if (busy) {
      button.dataset.originalText =
        button.textContent;

      button.disabled = true;
      button.textContent = busyText;
    } else {
      button.disabled = false;

      if (button.dataset.originalText) {
        button.textContent =
          button.dataset.originalText;
      }
    }
  };

  RWKita.handleError = function (
    error,
    fallback = "Terjadi kesalahan. Silakan coba lagi."
  ) {
    console.error(error);

    RWKita.toast(
      error?.message || fallback,
      "error"
    );
  };

  window.RWKita = RWKita;
})(window);