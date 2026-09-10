(function () {
  "use strict";

  const FALLBACK_IMAGE =
    "../static/image/bergotong royong.jpg";

  document.addEventListener("DOMContentLoaded", async function () {
    const id = new URLSearchParams(
      window.location.search
    ).get("id");

    const content =
      document.getElementById("detailContent");

    setPageState("loading");
    clearStaticStory();
    bindShareButton();

    if (!id) {
      showError("Cerita tidak ditemukan.");
      return;
    }

    try {
      const row = await loadStory(id);

      if (!row) {
        showError(
          "Cerita tidak ditemukan atau belum dipublikasikan."
        );
        return;
      }

      renderStory(row);
      await renderOtherStories(row.id);

      setPageState("ready");
    } catch (error) {
      console.error(
        "Gagal memuat detail cerita:",
        error
      );

      if (content) {
        content.innerHTML =
          "<p>Cerita tidak dapat dimuat.</p>";
      }

      setPageState("error");
    }
  });

  async function loadStory(id) {
    const client = RWKita.requireClient();

    const result = await client
      .from("cerita_warga")
      .select("*")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data || null;
  }

  function renderStory(row) {
    const title =
      row.judul || "Cerita Warga";

    const date = formatDate(
      row.tanggal || row.created_at
    );

    const location =
      row.lokasi || "Lokasi belum tersedia";

    const image =
      row.foto_utama_url || FALLBACK_IMAGE;

    setText("breadcrumbTitle", title);
    setText("detailTitle", title);
    setText("detailDate", date);
    setText("detailLocation", location);
    setText("activityDate", date);
    setText(
  "activityTime",
  row.waktu || "Waktu belum tersedia"
);
    setText("activityLocation", location);

    const detailImage =
      document.getElementById("detailImage");

    if (detailImage) {
      detailImage.src = image;
      detailImage.alt = title;
      detailImage.hidden = false;
    }

    const content =
      document.getElementById("detailContent");

    if (content) {
      const text =
        row.isi || "Cerita belum memiliki isi.";

      content.innerHTML = String(text)
        .split(/\n{2,}|\n/)
        .filter(Boolean)
        .map(function (paragraph) {
          return `<p>${safe(paragraph)}</p>`;
        })
        .join("");
    }

    renderDocumentation(row);

    document.title = `RW KITA | ${title}`;
  }

  async function renderOtherStories(currentId) {
    const list =
      document.getElementById("otherStories");

    if (!list) {
      return;
    }

    const result = await RWKita.requireClient()
      .from("cerita_warga")
      .select(
        "id, judul, isi, foto_utama_url, tanggal, created_at"
      )
      .eq("status", "published")
      .neq("id", currentId)
      .order("created_at", {
        ascending: false
      })
      .limit(5);

    if (result.error) {
      console.error(
        "Gagal memuat cerita lainnya:",
        result.error
      );

      list.innerHTML =
        '<p class="empty-state">Belum ada cerita lainnya.</p>';

      return;
    }

    if (
      !result.data ||
      result.data.length === 0
    ) {
      list.innerHTML =
        '<p class="empty-state">Belum ada cerita lainnya.</p>';

      return;
    }

    list.innerHTML = result.data
      .map(function (row) {
        const title = safe(
          row.judul || "Cerita Warga"
        );

        const description = safe(
          row.isi || ""
        ).slice(0, 100);

        const image = safe(
          row.foto_utama_url || FALLBACK_IMAGE
        );

        return `
          <a
            href="detail-cerita.html?id=${encodeURIComponent(
              row.id
            )}"
            class="other-story"
          >
            <div class="other-story-image">
              <img
                src="${image}"
                alt="${title}"
                loading="lazy"
              >
            </div>

            <div class="other-story-content">
              <h3>${title}</h3>
              <p>${description}</p>
            </div>

            <span class="other-story-arrow">›</span>
          </a>
        `;
      })
      .join("");
  }

  function renderDocumentation(row) {
    const grid = document.querySelector(
      ".documentation-grid"
    );

    const section = grid
      ? grid.closest(".documentation-section")
      : null;

    if (!grid) {
      return;
    }

    let files = row.dokumentasi_urls || [];

    if (typeof files === "string") {
      try {
        files = JSON.parse(files);
      } catch (error) {
        files = files
          .split(",")
          .map(function (item) {
            return item.trim();
          });
      }
    }

    if (!Array.isArray(files)) {
      files = [files];
    }

    files = files.filter(Boolean);

    if (files.length === 0) {
      grid.innerHTML = "";

      if (section) {
        section.hidden = true;
      }

      return;
    }

    if (section) {
      section.hidden = false;
    }

    grid.innerHTML = files
      .map(function (url, index) {
        return `
          <div class="documentation-image">
            <img
              src="${safe(url)}"
              alt="Dokumentasi ${index + 1}"
              loading="lazy"
            >
          </div>
        `;
      })
      .join("");
  }

  function bindShareButton() {
    const button =
      document.getElementById("shareButton");

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      async function () {
        try {
          if (
            navigator.clipboard &&
            navigator.clipboard.writeText
          ) {
            await navigator.clipboard.writeText(
              window.location.href
            );
          } else {
            const textarea =
              document.createElement("textarea");

            textarea.value =
              window.location.href;

            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
          }

          notify(
            "Tautan cerita berhasil disalin."
          );
        } catch (error) {
          notify(window.location.href);
        }
      }
    );
  }

  function clearStaticStory() {
    setText("breadcrumbTitle", "Memuat cerita...");
    setText("detailTitle", "Memuat cerita...");
    setText("detailDate", "-");
    setText("detailLocation", "-");
    setText("activityDate", "-");
    setText("activityLocation", "-");

    const detailImage =
      document.getElementById("detailImage");

    if (detailImage) {
      detailImage.removeAttribute("src");
      detailImage.alt = "";
      detailImage.hidden = true;
    }

    const content =
      document.getElementById("detailContent");

    if (content) {
      content.innerHTML =
        "<p>Memuat cerita...</p>";
    }

    const documentationGrid =
      document.querySelector(
        ".documentation-grid"
      );

    if (documentationGrid) {
      documentationGrid.innerHTML = "";
    }

    const documentation =
      document.querySelector(
        ".documentation-section"
      );

    if (documentation) {
      documentation.hidden = true;
    }

    const otherStories =
      document.getElementById("otherStories");

    if (otherStories) {
      otherStories.innerHTML =
        '<p class="empty-state">Memuat cerita lainnya...</p>';
    }
  }

  function showError(message) {
    setText("breadcrumbTitle", "Cerita Warga");
    setText("detailTitle", "Cerita tidak ditemukan");
    setText("detailDate", "-");
    setText("detailLocation", "-");
    setText("activityDate", "-");
    setText("activityLocation", "-");

    const content =
      document.getElementById("detailContent");

    if (content) {
      content.innerHTML =
        `<p>${safe(message)}</p>`;
    }

    const image =
      document.getElementById("detailImage");

    if (image) {
      image.removeAttribute("src");
      image.alt = "";
      image.hidden = true;
    }

    const documentation =
      document.querySelector(
        ".documentation-section"
      );

    if (documentation) {
      documentation.hidden = true;
    }

    const otherStories =
      document.getElementById("otherStories");

    if (otherStories) {
      otherStories.innerHTML = "";
    }

    setPageState("error");
  }

  function setPageState(state) {
    const page = document.querySelector(
      ".detail-cerita-page"
    );

    if (!page) {
      return;
    }

    page.classList.remove(
      "is-loading",
      "is-ready",
      "is-error"
    );

    page.classList.add(`is-${state}`);
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value || "-";
    }
  }

  function formatDate(value) {
    if (
      window.RWKita &&
      typeof window.RWKita.formatDate ===
        "function"
    ) {
      return window.RWKita.formatDate(value);
    }

    return value || "-";
  }

  function notify(message) {
    if (
      window.RWKita &&
      typeof window.RWKita.toast ===
        "function"
    ) {
      window.RWKita.toast(message);
      return;
    }

    alert(message);
  }

  function safe(value) {
    if (
      window.RWKita &&
      typeof window.RWKita.escapeHTML ===
        "function"
    ) {
      return window.RWKita.escapeHTML(value);
    }

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();