(function (window) {
  "use strict";

  let started = false;
  let saving = false;

  const state = {
    rw: null,
    editId: null,
    original: null
  };

  function form() {
    return document.querySelector(".news-form");
  }

  function field(id) {
    return document.getElementById(id);
  }

  function value(id) {
    return field(id)?.value?.trim() || "";
  }

  function editor() {
    return document.querySelector(
      '.editor-content[contenteditable="true"]'
    );
  }

  function notify(message, type = "info") {
    if (
      window.RWKita &&
      typeof window.RWKita.toast === "function"
    ) {
      window.RWKita.toast(message, type);
    } else {
      alert(message);
    }
  }

  function getToday() {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${date.getFullYear()}-${month}-${day}`;
  }

  function getDateOnly(dateValue) {
    if (!dateValue) {
      return getToday();
    }

    return String(dateValue).slice(0, 10);
  }

  function convertToDatetimeLocal(dateValue) {
    if (!dateValue) {
      return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return `${dateValue}T08:00`;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function createSlug(title) {
    return String(title || "berita")
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  function parseImages(value) {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed.filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  function updateCounter(input, counter, max) {
    if (!input || !counter) {
      return;
    }

    const update = () => {
      counter.textContent = `${input.value.length}/${max}`;
    };

    input.addEventListener("input", update);
    update();
  }

  function validateFile(file) {
    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    const allowedExtensions =
      /\.(jpg|jpeg|png|webp)$/i;

    const validType =
      allowedTypes.includes(file.type) ||
      allowedExtensions.test(file.name);

    if (!validType) {
      throw new Error(
        `Format file "${file.name}" tidak valid. Gunakan JPG, PNG, atau WebP.`
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error(
        `Ukuran file "${file.name}" maksimal 2MB.`
      );
    }
  }

  function setLoading(status, clickedButton) {
    const buttons = document.querySelectorAll(
      ".form-actions button"
    );

    buttons.forEach((button) => {
      button.disabled = status;
    });

    if (!clickedButton) {
      return;
    }

    if (status) {
      clickedButton.dataset.originalText =
        clickedButton.textContent;

      clickedButton.textContent = "Menyimpan...";
    } else {
      clickedButton.textContent =
        clickedButton.dataset.originalText ||
        clickedButton.textContent;
    }
  }

  function redirectToNews() {
    const nomorRW =
      state.rw?.nomor_rw || "RW 01";

    window.location.href =
      `berita.html?rw=${encodeURIComponent(nomorRW)}`;
  }

  async function loadExistingData() {
    const currentForm = form();

    if (!currentForm) {
      return;
    }

    if (!state.editId) {
      const tanggal = field("tanggal");

      if (tanggal && !tanggal.value) {
        tanggal.value = `${getToday()}T08:00`;
      }

      return;
    }

    const client = RWKita.requireClient();

    const result = await client
      .from("berita")
      .select("*")
      .eq("id", state.editId)
      .eq("rw_id", state.rw.id)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error(
        "Data berita tidak ditemukan."
      );
    }

    state.original = result.data;

    const judul = field("judul");
    const kategori = field("kategori");
    const ringkasan = field("ringkasan");
    const penulis = field("penulis");
    const tanggal = field("tanggal");
    const status = field("status");
    const content = editor();

    if (judul) {
      judul.value = result.data.judul || "";
    }

    if (kategori) {
      kategori.value = result.data.kategori || "";
    }

    if (ringkasan) {
      ringkasan.value = result.data.ringkasan || "";
    }

    if (penulis) {
      penulis.value =
        result.data.penulis ||
        state.rw.nama_ketua ||
        "Admin RW";
    }

    if (tanggal) {
      tanggal.value = convertToDatetimeLocal(
        result.data.tanggal_publikasi ||
        result.data.created_at
      );
    }

    if (status) {
      status.value =
        result.data.status === "draft"
          ? "draft"
          : "published";
    }

    if (content) {
      content.innerHTML = result.data.isi || "";
    }
  }

  function bindCounters() {
    const judul = field("judul");
    const ringkasan = field("ringkasan");

    const judulCounter = judul
      ?.closest(".input-counter")
      ?.querySelector("small");

    const ringkasanCounter = ringkasan
      ?.closest(".textarea-counter")
      ?.querySelector("small");

    updateCounter(judul, judulCounter, 100);
    updateCounter(
      ringkasan,
      ringkasanCounter,
      200
    );
  }

  function bindEditorToolbar() {
    const content = editor();
    const toolbar = document.querySelector(
      ".editor-toolbar"
    );

    if (!content || !toolbar) {
      return;
    }

    const paragraphSelect =
      toolbar.querySelector("select");

    paragraphSelect?.addEventListener(
      "change",
      function () {
        content.focus();

        document.execCommand(
          "formatBlock",
          false,
          `<${this.value}>`
        );
      }
    );

    toolbar
      .querySelectorAll("button")
      .forEach((button) => {
        button.addEventListener(
          "mousedown",
          (event) => {
            event.preventDefault();
          }
        );

        button.addEventListener(
          "click",
          () => {
            const title = (
              button.getAttribute("title") || ""
            ).toLowerCase();

            content.focus();

            if (title === "bold") {
              document.execCommand("bold");
            }

            if (title === "italic") {
              document.execCommand("italic");
            }

            if (title === "underline") {
              document.execCommand("underline");
            }

            if (title === "bullet list") {
              document.execCommand(
                "insertUnorderedList"
              );
            }

            if (title === "number list") {
              document.execCommand(
                "insertOrderedList"
              );
            }

            if (title === "align left") {
              document.execCommand("justifyLeft");
            }

            if (title === "align center") {
              document.execCommand(
                "justifyCenter"
              );
            }

            if (title === "align right") {
              document.execCommand(
                "justifyRight"
              );
            }

            if (title === "insert link") {
              const url = prompt(
                "Masukkan URL tautan:"
              );

              if (url) {
                document.execCommand(
                  "createLink",
                  false,
                  url
                );
              }
            }

            if (title === "insert image") {
              const url = prompt(
                "Masukkan URL gambar:"
              );

              if (url) {
                document.execCommand(
                  "insertImage",
                  false,
                  url
                );
              }
            }
          }
        );
      });
  }

  function bindStatus() {
    const currentForm = form();

    if (!currentForm) {
      return;
    }

    const statusSelect = field("status");
    const statusDescription =
      document.querySelector(".status-description");

    const draftButton =
      currentForm.querySelector(".btn-draft");

    const publishButton =
      currentForm.querySelector(".btn-publish");

    const cancelButton =
      currentForm.querySelector(".btn-cancel");

    let selectedStatus =
      statusSelect?.value === "draft"
        ? "draft"
        : "published";

    function setStatus(status) {
      selectedStatus =
        status === "draft"
          ? "draft"
          : "published";

      if (statusSelect) {
        statusSelect.value = selectedStatus;
      }

      if (statusDescription) {
        statusDescription.textContent =
          selectedStatus === "published"
            ? "Berita akan langsung tampil di website."
            : "Berita disimpan sebagai draft dan belum tampil di website.";
      }
    }

    // Menghapus redirect bawaan HTML
    draftButton?.removeAttribute("onclick");
    publishButton?.removeAttribute("onclick");
    cancelButton?.removeAttribute("onclick");

    // Dropdown status
    statusSelect?.addEventListener(
      "change",
      function () {
        setStatus(this.value);
      }
    );

    // Tombol draft
    draftButton?.addEventListener(
      "click",
      function (event) {
        event.preventDefault();

        setStatus("draft");

        saveNews("draft", draftButton);
      }
    );

    // Tombol publikasi
    publishButton?.addEventListener(
      "click",
      function () {
        setStatus("published");
      }
    );

    // Tombol batal
    cancelButton?.addEventListener(
      "click",
      function () {
        redirectToNews();
      }
    );

    // Submit form
    currentForm.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();

        saveNews(
          selectedStatus,
          publishButton
        );
      }
    );

    setStatus(selectedStatus);
  }

  async function saveNews(
    selectedStatus,
    clickedButton
  ) {
    if (saving) {
      return;
    }

    const currentForm = form();
    const content = editor();

    if (!currentForm || !content) {
      notify(
        "Form berita belum siap digunakan.",
        "error"
      );
      return;
    }

    const judul = value("judul");
    const kategori = value("kategori");
    const ringkasan = value("ringkasan");
    const isi = content.innerHTML.trim();
    const isiText = content.innerText.trim();
    const tanggal = value("tanggal");
    const penulis =
      value("penulis") ||
      state.rw.nama_ketua ||
      "Admin RW";

    const mainImage =
      field("gambar-utama")?.files?.[0] ||
      null;

    const additionalImages = Array.from(
      field("gambar-tambahan")?.files || []
    );

    if (!judul) {
      notify(
        "Judul berita wajib diisi.",
        "error"
      );
      field("judul")?.focus();
      return;
    }

    if (!kategori) {
      notify(
        "Kategori berita wajib dipilih.",
        "error"
      );
      field("kategori")?.focus();
      return;
    }

    if (!ringkasan) {
      notify(
        "Ringkasan berita wajib diisi.",
        "error"
      );
      field("ringkasan")?.focus();
      return;
    }

    if (!isiText) {
      notify(
        "Isi berita wajib diisi.",
        "error"
      );
      content.focus();
      return;
    }

    if (additionalImages.length > 5) {
      notify(
        "Gambar tambahan maksimal 5 file.",
        "error"
      );
      return;
    }

    try {
      validateFile(mainImage);

      additionalImages.forEach((file) => {
        validateFile(file);
      });
    } catch (error) {
      notify(error.message, "error");
      return;
    }

    if (!state.editId && !mainImage) {
      notify(
        "Gambar utama wajib dipilih.",
        "error"
      );
      return;
    }

    saving = true;
    setLoading(true, clickedButton);

    try {
      const client = RWKita.requireClient();

      const userId =
        RWKita.admin?.session?.user?.id ||
        null;

      let imageUrl =
        state.original?.gambar_url || null;

      if (mainImage) {
        imageUrl = await RWKita.uploadFile(
          mainImage,
          `berita/${state.rw.id}`
        );
      }

      let additionalImageUrls =
        parseImages(
          state.original?.gambar_tambahan_urls
        );

      if (additionalImages.length > 0) {
        additionalImageUrls =
          await Promise.all(
            additionalImages.map((file) =>
              RWKita.uploadFile(
                file,
                `berita/${state.rw.id}/tambahan`
              )
            )
          );
      }

      const oldTitle =
        state.original?.judul || "";

      const oldSlug =
        state.original?.slug || "";

      const slug =
        state.editId &&
        oldTitle === judul &&
        oldSlug
          ? oldSlug
          : `${createSlug(judul)}-${Date.now()}`;

      const payload = {
        rw_id: state.rw.id,
        judul,
        slug,
        kategori,
        ringkasan,
        isi,
        gambar_url: imageUrl,
        gambar_tambahan_urls: additionalImageUrls,
        penulis,
        tanggal_publikasi: getDateOnly(
          tanggal
        ),
        status:
          selectedStatus === "draft"
            ? "draft"
            : "published",
        updated_at: new Date().toISOString()
      };

      if (!state.editId && userId) {
        payload.created_by = userId;
      }

      let result;

      if (state.editId) {
        result = await client
          .from("berita")
          .update(payload)
          .eq("id", state.editId)
          .eq("rw_id", state.rw.id)
          .select()
          .single();
      } else {
        result = await client
          .from("berita")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      notify(
        state.editId
          ? "Berita berhasil diperbarui."
          : selectedStatus === "draft"
            ? "Berita berhasil disimpan sebagai draft."
            : "Berita berhasil dipublikasikan.",
        "success"
      );

      setTimeout(() => {
        redirectToNews();
      }, 700);
    } catch (error) {
      console.error(
        "Gagal menyimpan berita:",
        error
      );

      notify(
        error?.message ||
          "Berita gagal disimpan.",
        "error"
      );
    } finally {
      saving = false;
      setLoading(false, clickedButton);
    }
  }

  async function boot() {
    if (started) {
      return;
    }

    if (!form()) {
      return;
    }

    if (
      !window.RWKita ||
      !window.RWKita.admin
    ) {
      return;
    }

    if (!window.RWKita.admin.selectedRW) {
      return;
    }

    started = true;

    try {
      state.rw =
        await window.RWKita.admin.getRW();

      if (!state.rw) {
        throw new Error(
          "Data RW aktif tidak ditemukan."
        );
      }

      state.editId =
        new URLSearchParams(
          window.location.search
        ).get("edit");

      await loadExistingData();
      bindCounters();
      bindEditorToolbar();
      bindStatus();
    } catch (error) {
      started = false;

      console.error(
        "Gagal memuat form tambah berita:",
        error
      );

      notify(
        error?.message ||
          "Form berita gagal dimuat.",
        "error"
      );
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    boot
  );

  window.addEventListener(
    "rwkita:admin-ready",
    boot
  );
})(window);