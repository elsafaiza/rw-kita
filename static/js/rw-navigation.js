(() => {
  "use strict";

  const ACCESS_KEY = "rwKitaSelectedRW";

  const HALAMAN_MICROSITE = new Set([
    "beranda_RW.html",
    "profilRW.html",
    "informasi.html",
    "potensi.html",
    "produk_hukum.html",
    "arsip_digital.html",
    "hubungi_kami.html"
  ]);

  function namaHalamanSaatIni() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function ambilAksesRW() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(ACCESS_KEY) || "null"
      );

      return saved?.nomor_rw || null;
    } catch {
      sessionStorage.removeItem(ACCESS_KEY);
      return null;
    }
  }

  function simpanAksesRW(nomorRW) {
    sessionStorage.setItem(
      ACCESS_KEY,
      JSON.stringify({
        nomor_rw: nomorRW,
        granted_at: Date.now()
      })
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const halamanSekarang = namaHalamanSaatIni();
    const parameterURL = new URLSearchParams(
      window.location.search
    );

    const aksesRW = ambilAksesRW();

    if (
      HALAMAN_MICROSITE.has(halamanSekarang) &&
      !aksesRW
    ) {
      window.location.replace("index.html");
      return;
    }

    if (!HALAMAN_MICROSITE.has(halamanSekarang)) {
      return;
    }

    const nomorRW = aksesRW || parameterURL.get("rw");

    if (!nomorRW) {
      window.location.replace("index.html");
      return;
    }

    if (parameterURL.get("rw") !== nomorRW) {
      parameterURL.set("rw", nomorRW);

      const query = parameterURL.toString();

      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`
      );
    }

    simpanAksesRW(nomorRW);

    document.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http")
      ) {
        return;
      }

      const url = new URL(href, window.location.href);
      const target = url.pathname.split("/").pop();

      if (!HALAMAN_MICROSITE.has(target)) return;

      url.searchParams.set("rw", nomorRW);
      link.href = url.href;
    });
  });
})();