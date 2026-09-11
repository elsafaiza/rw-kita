(function () {
  "use strict";

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const MAX_DOCUMENTATION_FILES = 5;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const ACCESS_KEY = "rwKitaSelectedRW";

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ceritaForm");
    if (!form) return;

    const submit = form.querySelector(
      "button[type=submit]"
    );

    const mainInput =
      document.getElementById("fotoUtama");

    const extraInput =
      document.getElementById("dokumentasiCerita");

    const textInput =
      document.getElementById("isiCerita");

    const counter =
      document.getElementById("characterCount");

    textInput?.addEventListener("input", () => {
      if (counter) {
        counter.textContent =
          `${textInput.value.length} / 3000`;
      }
    });

    mainInput?.addEventListener("change", () => {
      try {
        validateFiles(mainInput.files, 1);
        previewMain(mainInput.files?.[0]);
      } catch (error) {
        mainInput.value = "";
        RWKita.toast(error.message, "error");
      }
    });

    extraInput?.addEventListener("change", () => {
      try {
        validateFiles(
          extraInput.files,
          MAX_DOCUMENTATION_FILES
        );

        previewExtras(extraInput.files || []);
      } catch (error) {
        extraInput.value = "";
        document.getElementById(
          "documentationPreview"
        ).innerHTML = "";

        RWKita.toast(error.message, "error");
      }
    });

    document
      .getElementById("removeMainImage")
      ?.addEventListener("click", () => {
        if (mainInput) mainInput.value = "";

        document
          .getElementById("mainImagePreview")
          ?.classList.remove("show");
      });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const get = (id) =>
        document.getElementById(id)?.value.trim() || "";

      const nama = get("namaPenulis");
      const judul = get("judulCerita");
      const tanggal = get("tanggalCerita");
      const lokasi = get("lokasiCerita");
      const isi = get("isiCerita");

      const consent =
        document.getElementById("persetujuan")?.checked;

      const mainFile =
        mainInput?.files?.[0] || null;

      const extraFiles =
        Array.from(extraInput?.files || []);

      if (
        !nama ||
        !judul ||
        !tanggal ||
        !lokasi ||
        !isi ||
        !consent
      ) {
        RWKita.toast(
          "Lengkapi seluruh data dan persetujuan publikasi.",
          "error"
        );
        return;
      }

      if (!mainFile) {
        RWKita.toast(
          "Foto utama wajib dipilih.",
          "error"
        );
        return;
      }

      try {
        validateFiles([mainFile], 1);
        validateFiles(
          extraFiles,
          MAX_DOCUMENTATION_FILES
        );

        const rwNumber = getSelectedRWNumber();

        if (!rwNumber) {
          RWKita.toast(
            "Pilih RW terlebih dahulu dari beranda utama.",
            "error"
          );
          return;
        }

        RWKita.setBusy(submit, true, "Mengirim...");

        const rw = await RWKita.getRW(rwNumber);

        if (!rw) {
          throw new Error(
            "RW yang dipilih tidak ditemukan atau tidak aktif."
          );
        }

        const mainUrl = await RWKita.uploadFile(
          mainFile,
          `cerita/${rw.id}`
        );

        const extraUrls = [];

        for (const file of extraFiles) {
          extraUrls.push(
            await RWKita.uploadFile(
              file,
              `cerita/${rw.id}`
            )
          );
        }

const payload = {
  rw_id: rw.id,
  nama_penulis: nama,
  judul,
  tanggal,
  lokasi,
  isi,
  foto_utama_url: mainUrl,
  dokumentasi_urls: extraUrls,
  status: "pending"
};

const result = await RWKita.requireClient()
  .from("cerita_warga")
  .insert(payload);

if (result.error) {
  throw result.error;
}

        RWKita.toast(
          "Cerita berhasil dikirim dan menunggu moderasi admin.",
          "success"
        );

        form.reset();

        if (counter) {
          counter.textContent = "0 / 3000";
        }

        document
          .getElementById("mainImagePreview")
          ?.classList.remove("show");

        document.getElementById(
          "documentationPreview"
        ).innerHTML = "";

        setTimeout(() => {
          window.location.href = "cerita.html";
        }, 900);
      } catch (error) {
        RWKita.handleError(
          error,
          "Cerita gagal dikirim."
        );
      } finally {
        RWKita.setBusy(submit, false);
      }
    });
  });

  function getSelectedRWNumber() {
    const fromURL =
      new URLSearchParams(window.location.search)
        .get("rw");

    if (fromURL) return fromURL.trim();

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

  function validateFiles(files, maxCount) {
    const selected = Array.from(files || []);

    if (selected.length > maxCount) {
      throw new Error(
        `Maksimal ${maxCount} foto yang dapat dipilih.`
      );
    }

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
          "Format foto harus JPG, PNG, atau WEBP."
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `Ukuran ${file.name} melebihi 5 MB.`
        );
      }
    }
  }

  function previewMain(file) {
    if (!file) return;

    const image =
      document.getElementById("mainPreviewImage");

    const box =
      document.getElementById("mainImagePreview");

    if (!image || !box) return;

    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    box.classList.add("show");
  }

  function previewExtras(files) {
    const preview =
      document.getElementById("documentationPreview");

    if (!preview) return;

    preview.innerHTML = Array.from(files)
      .map(
        (file, index) => `
          <div class="documentation-preview-item">
            <img
              src="${URL.createObjectURL(file)}"
              alt="Dokumentasi ${index + 1}"
            >

            <button
              type="button"
              data-remove-extra="${index}"
            >
              ×
            </button>
          </div>
        `
      )
      .join("");
  }
})();