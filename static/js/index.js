(function () {
  "use strict";

  const ACCESS_KEY = "rwKitaSelectedRW";

  const MICROSITE_PAGES = new Set([
    "beranda_RW.html",
    "profilRW.html",
    "informasi.html",
    "potensi.html",
    "produk_hukum.html",
    "arsip_digital.html",
    "hubungi_kami.html"
  ]);

  function simpanAksesRW(nomorRW) {
    try {
      sessionStorage.setItem(
        ACCESS_KEY,
        JSON.stringify({
          nomor_rw: nomorRW,
          granted_at: Date.now()
        })
      );
    } catch (error) {
      console.warn(
        "Session storage tidak tersedia:",
        error
      );
    }
  }

  function ambilAksesRW() {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(ACCESS_KEY) || "null"
      );

      return saved && saved.nomor_rw
        ? saved.nomor_rw
        : null;
    } catch (error) {
      sessionStorage.removeItem(ACCESS_KEY);
      return null;
    }
  }

  function mintaPilihRW() {
    alert(
      "Silakan pilih RW terlebih dahulu untuk membuka microsite."
    );

    document
      .getElementById("rw-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
  }

  function namaFile(href) {
    return String(href || "")
      .split("?")[0]
      .split("#")[0]
      .split("/")
      .pop();
  }

  function arahkanKeMicrosite(link, nomorRW) {
    const href = link.getAttribute("href");

    if (!href) {
      return;
    }

    const url = new URL(
      href,
      window.location.href
    );

    url.searchParams.set("rw", nomorRW);
    link.href = url.href;
  }

  function getSupabaseClient() {
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

    return null;
  }

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      const selectRW =
        document.querySelector(".rw-select");

      const tombolRW =
        document.querySelector(".rw-button");

      if (!selectRW || !tombolRW) {
        return;
      }

      document
        .querySelectorAll("a[href]")
        .forEach(function (link) {
          const target = namaFile(
            link.getAttribute("href")
          );

          if (!MICROSITE_PAGES.has(target)) {
            return;
          }

          link.addEventListener(
            "click",
            function (event) {
              const nomorRW = ambilAksesRW();

              if (!nomorRW) {
                event.preventDefault();
                mintaPilihRW();
                return;
              }

              arahkanKeMicrosite(link, nomorRW);
            }
          );
        });

      tombolRW.addEventListener(
        "click",
        async function (event) {
          event.preventDefault();

          const nilaiRW = String(
            selectRW.value || ""
          ).trim();

          if (!nilaiRW) {
            mintaPilihRW();
            return;
          }

          const nomorRW = /^RW\s/i.test(nilaiRW)
            ? nilaiRW
            : `RW ${nilaiRW}`;

          const client = getSupabaseClient();

          if (!client) {
            alert(
              "Koneksi database belum tersedia."
            );
            return;
          }

          const teksAwal =
            tombolRW.textContent;

          tombolRW.disabled = true;
          tombolRW.textContent = "Memuat...";
          tombolRW.classList.add("is-loading");

          try {
            const result = await client
              .from("rws")
              .select(
                "id, nomor_rw, is_active"
              )
              .eq("nomor_rw", nomorRW)
              .eq("is_active", true)
              .maybeSingle();

            if (result.error) {
              throw result.error;
            }

            if (!result.data) {
              alert(
                `${nomorRW} belum tersedia atau belum aktif.`
              );
              return;
            }

            simpanAksesRW(
              result.data.nomor_rw
            );

            window.location.href =
              `beranda_RW.html?rw=${encodeURIComponent(
                result.data.nomor_rw
              )}`;
          } catch (error) {
            console.error(
              "Gagal memeriksa data RW:",
              error
            );

            alert(
              "Koneksi ke database gagal. Silakan coba lagi."
            );
          } finally {
            tombolRW.disabled = false;
            tombolRW.textContent = teksAwal;
            tombolRW.classList.remove(
              "is-loading"
            );
          }
        }
      );
    }
  );
})();