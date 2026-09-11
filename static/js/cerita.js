(function () {
  "use strict";

  const PAGE_SIZE = 8;
  const FALLBACK_IMAGE =
    "../static/image/bergotong royong.jpg";

  let allStories = [];
  let filteredStories = [];
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", async function () {
    const listGrid = document.getElementById("ceritaGrid");
    const homeGrid = document.querySelector(".story-grid");

    if (!listGrid && !homeGrid) {
      return;
    }

    try {
      allStories = await loadStories();
      filteredStories = [...allStories];

      renderHomeStories(homeGrid, allStories.slice(0, 4));
      renderListStories();
      bindSearch();
    } catch (error) {
      console.error("Gagal memuat cerita warga:", error);

      if (homeGrid) {
        homeGrid.innerHTML =
          '<p class="empty-state">Cerita warga belum dapat dimuat.</p>';
      }

      if (listGrid) {
        listGrid.innerHTML =
          '<p class="empty-state">Cerita warga belum dapat dimuat.</p>';

        hidePagination();
      }
    }
  });

  async function loadStories() {
    const client = RWKita.requireClient();

    const result = await client
      .from("cerita_warga")
      .select("*")
      .eq("status", "published")
      .order("created_at", {
        ascending: false
      });

    if (result.error) {
      throw result.error;
    }

    return result.data || [];
  }

  function renderHomeStories(grid, rows) {
    if (!grid) {
      return;
    }

    if (!rows.length) {
      grid.innerHTML =
        '<p class="empty-state">Belum ada cerita warga.</p>';
      return;
    }

    grid.innerHTML = rows
      .map(function (row) {
        const id = encodeURIComponent(row.id);
        const title = safe(row.judul || "Cerita Warga");
        const description = safe(
          row.ringkasan || row.isi || ""
        );
        const image = safe(
          row.foto_utama_url || FALLBACK_IMAGE
        );

        return `
          <article class="story-card">
            <div class="story-image">
              <img
                src="${image}"
                alt="${title}"
                loading="lazy"
              >
            </div>

            <div class="story-content">
              <h3>${title}</h3>

              <p>
                ${description.slice(0, 150)}
              </p>

              <a href="detail-cerita.html?id=${id}">
                Baca cerita →
              </a>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderListStories() {
    const grid = document.getElementById("ceritaGrid");

    if (!grid) {
      return;
    }

    const total = document.querySelector(".total-cerita");

    if (total) {
      total.textContent =
        `Total ${filteredStories.length} cerita`;
    }

    if (!filteredStories.length) {
      grid.innerHTML =
        '<p class="empty-state">Belum ada cerita warga.</p>';

      hidePagination();
      return;
    }

    const start =
      (currentPage - 1) * PAGE_SIZE;

    const rows = filteredStories.slice(
      start,
      start + PAGE_SIZE
    );

    grid.innerHTML = rows
      .map(function (row) {
        const id = encodeURIComponent(row.id);
        const title = safe(row.judul || "Cerita Warga");
        const description = safe(
          row.ringkasan || row.isi || ""
        );
        const date = safe(
          formatDate(
            row.tanggal ||
            row.tanggal_kegiatan ||
            row.created_at
          )
        );
        const image = safe(
          row.foto_utama_url || FALLBACK_IMAGE
        );

        return `
          <article class="cerita-card">
            <div class="cerita-card-image">
              <img
                src="${image}"
                alt="${title}"
                loading="lazy"
              >
            </div>

            <div class="cerita-card-content">
              <h2>${title}</h2>

              <p>
                ${description.slice(0, 180)}
              </p>

              <div class="cerita-date">
                ${date}
              </div>

              <a
                href="detail-cerita.html?id=${id}"
                class="baca-cerita"
              >
                Baca selengkapnya
                <span>→</span>
              </a>
            </div>
          </article>
        `;
      })
      .join("");

    renderPagination();
  }

  function bindSearch() {
    const search =
      document.getElementById("searchCerita");

    if (!search) {
      return;
    }

    search.addEventListener("input", function () {
      const keyword =
        search.value.toLowerCase().trim();

      filteredStories = allStories.filter(function (row) {
        const text = [
          row.judul,
          row.isi,
          row.ringkasan,
          row.lokasi,
          row.nama_penulis
        ]
          .map(function (value) {
            return String(value || "");
          })
          .join(" ")
          .toLowerCase();

        return text.includes(keyword);
      });

      currentPage = 1;
      renderListStories();
    });
  }

  function renderPagination() {
    const pagination =
      document.querySelector(".pagination");

    if (!pagination) {
      return;
    }

    const totalPages = Math.ceil(
      filteredStories.length / PAGE_SIZE
    );

    if (totalPages <= 1) {
      hidePagination();
      return;
    }

    pagination.hidden = false;

    pagination.innerHTML = `
      <button
        type="button"
        class="pagination-prev"
        ${currentPage === 1 ? "disabled" : ""}
      >
        ‹
      </button>

      ${Array.from(
        { length: totalPages },
        function (_, index) {
          const page = index + 1;

          return `
            <button
              type="button"
              class="page-number ${
                page === currentPage ? "active" : ""
              }"
              data-page="${page}"
            >
              ${page}
            </button>
          `;
        }
      ).join("")}

      <button
        type="button"
        class="pagination-next"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        ›
      </button>
    `;

    pagination
      .querySelector(".pagination-prev")
      ?.addEventListener("click", function () {
        if (currentPage > 1) {
          currentPage--;
          renderListStories();
        }
      });

    pagination
      .querySelector(".pagination-next")
      ?.addEventListener("click", function () {
        if (currentPage < totalPages) {
          currentPage++;
          renderListStories();
        }
      });

    pagination
      .querySelectorAll("[data-page]")
      .forEach(function (button) {
        button.addEventListener("click", function () {
          currentPage =
            Number(button.dataset.page);

          renderListStories();
        });
      });
  }

  function hidePagination() {
    const pagination =
      document.querySelector(".pagination");

    if (!pagination) {
      return;
    }

    pagination.hidden = true;
    pagination.innerHTML = "";
  }

  function formatDate(value) {
    if (
      window.RWKita &&
      typeof window.RWKita.formatDate === "function"
    ) {
      return window.RWKita.formatDate(value);
    }

    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function safe(value) {
    if (
      window.RWKita &&
      typeof window.RWKita.escapeHTML === "function"
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