(function () {
  "use strict";

  const PAGE_SIZE = 8;
  const FALLBACK_IMAGE = "../static/image/bergotong royong.jpg";

  let allStories = [];
  let filteredStories = [];
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", async () => {
    const listGrid = document.getElementById("ceritaGrid");
    const homeGrid = document.querySelector(".story-grid");

    if (!listGrid && !homeGrid) return;

    try {
      allStories = await loadStories();
      filteredStories = allStories;

      renderHomeStories(homeGrid, allStories.slice(0, 4));
      renderListStories();
      bindSearch();
    } catch (error) {
      console.error("Gagal memuat cerita warga:", error);

      if (listGrid) {
        listGrid.innerHTML =
          '<p class="empty-state">Cerita warga belum dapat dimuat.</p>';
        hidePagination();
      }

if (homeGrid) {
  // Jangan hapus card statis di beranda
  // Card tetap ditampilkan jika database belum berisi data
}
    }
  });

  async function loadStories() {
    const client = RWKita.requireClient();
    let lastError = null;

    for (const table of ["cerita_warga", "cerita"]) {
      let result = await client
        .from(table)
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (result.error) {
        result = await client
          .from(table)
          .select("*")
          .eq("status", "published")
          .order("tanggal", { ascending: false });
      }

      if (!result.error) {
        return result.data || [];
      }

      lastError = result.error;
    }

    throw lastError || new Error("Tabel cerita warga tidak ditemukan.");
  }

  function bindSearch() {
    const search = document.getElementById("searchCerita");
    if (!search) return;

    search.addEventListener("input", () => {
      const keyword = search.value.toLowerCase().trim();

      filteredStories = allStories.filter((row) => {
        const text = [
          row.judul,
          row.isi,
          row.ringkasan,
          row.lokasi,
          row.nama_penulis,
          row.penulis
        ]
          .map((value) => String(value || ""))
          .join(" ")
          .toLowerCase();

        return text.includes(keyword);
      });

      currentPage = 1;
      renderListStories();
    });
  }

function renderHomeStories(grid, rows) {
  if (!grid) return;

  // Jika database kosong, pertahankan card statis dari index.html
  if (!rows.length) {
    return;
  }

  grid.innerHTML = rows
    .map((row) => {
      const id = encodeURIComponent(row.id);
      const title = safe(row.judul || "Cerita Warga");
      const text = safe(row.ringkasan || row.isi || "");
      const image = safe(getImage(row));

      return `
        <article class="story-card">
          <div class="story-image">
            <img src="${image}" alt="${title}" loading="lazy">
          </div>

          <div class="story-content">
            <h3>${title}</h3>
            <p>${text.slice(0, 150)}</p>

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
    if (!grid) return;

    const total = document.querySelector(".total-cerita");

    if (total) {
      total.textContent = `Total ${filteredStories.length} cerita`;
    }

    if (!filteredStories.length) {
      grid.innerHTML =
        '<p class="empty-state">Belum ada cerita warga.</p>';
      hidePagination();
      return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filteredStories.slice(start, start + PAGE_SIZE);

    grid.innerHTML = rows
      .map((row) => {
        const id = encodeURIComponent(row.id);
        const title = safe(row.judul || "Cerita Warga");
        const text = safe(row.ringkasan || row.isi || "");
        const date = safe(
          formatDate(row.tanggal || row.tanggal_kegiatan || row.created_at)
        );
        const image = safe(getImage(row));

        return `
          <article class="cerita-card">
            <div class="cerita-card-image">
              <img src="${image}" alt="${title}" loading="lazy">
            </div>

            <div class="cerita-card-content">
              <h2>${title}</h2>
              <p>${text.slice(0, 180)}</p>
              <div class="cerita-date">${date}</div>

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

  function renderPagination() {
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;

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

      ${Array.from({ length: totalPages }, (_, index) => {
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
      }).join("")}

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
      ?.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderListStories();
        }
      });

    pagination
      .querySelector(".pagination-next")
      ?.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderListStories();
        }
      });

    pagination.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        currentPage = Number(button.dataset.page);
        renderListStories();
      });
    });
  }

  function hidePagination() {
    const pagination = document.querySelector(".pagination");

    if (pagination) {
      pagination.hidden = true;
      pagination.innerHTML = "";
    }
  }

  function getImage(row) {
    return (
      row.foto_utama_url ||
      row.gambar_url ||
      FALLBACK_IMAGE
    );
  }

  function formatDate(value) {
    if (window.RWKita?.formatDate) {
      return RWKita.formatDate(value);
    }

    if (!value) return "-";

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
    if (window.RWKita?.escapeHTML) {
      return RWKita.escapeHTML(value);
    }

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();