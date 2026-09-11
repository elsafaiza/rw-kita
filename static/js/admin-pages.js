(function (window) {
  "use strict";

  let loaded = false;

  const pages = {
    "berita.html": {
      table: "berita",
      target: ".berita-table",
      row: ".berita-row",
      order: "tanggal_publikasi"
    },

    "artikel_admin.html": {
      table: "artikel",
      target: ".article-table tbody",
      row: "tr",
      order: "tanggal_publikasi"
    },

    "pengumuman.html": {
      table: "pengumuman",
      target: ".announcement-table tbody",
      row: "tr",
      order: "tanggal_publikasi"
    },

    "agenda.html": {
      table: "agenda",
      target: ".agenda-table tbody",
      row: "tr",
      order: "tanggal"
    },

    "cerita_warga.html": {
      table: "cerita_warga",
      target: ".story-table tbody",
      row: "tr",
      order: "created_at"
    }
  };

  function getRWKita() {
    return window.RWKita;
  }

  function getPageName() {
    return window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();
  }

  function getCurrentRW() {
    return (
      getRWKita()?.admin?.selectedRW?.nomor_rw ||
      "RW 01"
    );
  }

  function escapeText(value) {
    return String(value ?? "");
  }

  function formatDate(value) {
    const RWKita = getRWKita();

    if (
      RWKita &&
      typeof RWKita.formatDate === "function"
    ) {
      return RWKita.formatDate(value);
    }

    return value || "-";
  }

  function getStatusLabel(status) {
    const labels = {
      published: "Dipublikasikan",
      draft: "Draft",
      pending: "Menunggu",
      rejected: "Ditolak",
      archived: "Diarsipkan"
    };

    return labels[status] || status || "-";
  }

  function getEditPage(table) {
    const editPages = {
      berita: "tambah-berita.html",
      artikel: "tambah-artikel.html",
      pengumuman: "tambah-pengumuman.html",
      agenda: "tambah-agnda.html",
      cerita_warga: "detail-cerita.html"
    };

    return editPages[table] || "#";
  }

  async function boot() {
    if (loaded) {
      return;
    }

    const RWKita = getRWKita();

    if (
      !RWKita ||
      !RWKita.admin ||
      !RWKita.admin.selectedRW
    ) {
      return;
    }

    loaded = true;

    const page = getPageName();

    try {
      if (page === "dashboard_admin.html") {
        await loadDashboard();
        return;
      }

      const config = pages[page];

      if (config) {
        await loadPage(config);
      }
    } catch (error) {
      loaded = false;

      console.error(
        "Gagal memuat halaman admin:",
        error
      );

      if (
        RWKita.toast &&
        typeof RWKita.toast === "function"
      ) {
        RWKita.toast(
          error.message ||
            "Halaman admin gagal dimuat.",
          "error"
        );
      }
    }
  }

  window.addEventListener(
    "rwkita:admin-ready",
    boot
  );

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      setTimeout(boot, 100);
    }
  );

  async function loadDashboard() {
    const RWKita = getRWKita();
    const rw = await RWKita.admin.getRW();

    if (!rw) {
      throw new Error(
        "RW aktif tidak ditemukan."
      );
    }

    const tables = [
      "berita",
      "artikel",
      "pengumuman",
      "agenda",
      "cerita_warga"
    ];

    const counts = await Promise.all(
      tables.map(async function (table) {
        try {
          const rows =
            await RWKita.admin.query(
              table,
              rw.id,
              {
                order: "created_at",
                ascending: false,
                limit: 500
              }
            );

          return rows.length;
        } catch {
          return 0;
        }
      })
    );

    document
      .querySelectorAll(
        ".statistics-grid .stat-card strong"
      )
      .forEach(function (element, index) {
        if (counts[index] !== undefined) {
          element.textContent = counts[index];
        }
      });
  }

async function loadPage(config) {
  const RWKita = window.RWKita;
  const target = document.querySelector(
    config.target
  );

  if (!target) {
    return;
  }

  const rw = await RWKita.admin.getRW();

  if (!rw) {
    throw new Error(
      "RW aktif tidak ditemukan."
    );
  }

  let data = await RWKita.admin.query(
    config.table,
    rw.id,
    config.order
  );

  const search = document.querySelector(
    ".search-box input, .agenda-search input, .announcement-search input"
  );

  const tabs =
    config.table === "berita"
      ? Array.from(
          document.querySelectorAll(
            ".berita-tab"
          )
        )
      : Array.from(
          document.querySelectorAll(
            "[data-status]"
          )
        );

  const statusValues = [
    "all",
    "published",
    "draft"
  ];

  tabs.forEach(function (tab, index) {
    if (!tab.dataset.status) {
      tab.dataset.status =
        statusValues[index] || "all";
    }

    tab.onclick = function (event) {
      event.preventDefault();

      tabs.forEach(function (item) {
        item.classList.remove("active");
      });

      tab.classList.add("active");

      render();
    };
  });

  function render() {
    const keyword =
      search?.value
        ?.toLowerCase()
        ?.trim() || "";

    const activeTab = tabs.find(function (tab) {
      return tab.classList.contains("active");
    });

    const selectedStatus =
      activeTab?.dataset.status || "all";

    const filtered = data.filter(function (item) {
      const searchableText =
        JSON.stringify(item).toLowerCase();

      const matchesSearch =
        searchableText.includes(keyword);

      const matchesStatus =
        selectedStatus === "all" ||
        item.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    updateExistingLayout(
      target,
      config,
      filtered
    );
  }

  search?.addEventListener(
    "input",
    render
  );

  render();

  window.addEventListener(
    "rwkita:refresh",
    async function () {
      data = await RWKita.admin.query(
        config.table,
        rw.id,
        config.order
      );

      render();
    }
  );
}

  function updateExistingLayout(
    target,
    config,
    data
  ) {
    const existingRows =
      target.querySelectorAll(config.row);

    if (!existingRows.length) {
      return;
    }

    const template =
      existingRows[0].cloneNode(true);

    existingRows.forEach(function (row) {
      row.remove();
    });

    if (!data.length) {
      const emptyRow =
        template.cloneNode(true);

      emptyRow
        .querySelectorAll(
          "h2, h3, strong, p, small, .table-text, .status"
        )
        .forEach(function (element) {
          element.textContent =
            "Belum ada data.";
        });

      const image =
        emptyRow.querySelector("img");

      if (image) {
        image.removeAttribute("src");
        image.style.visibility = "hidden";
      }

      const actions =
        emptyRow.querySelector(
          ".action-buttons"
        );

      if (actions) {
        actions.style.visibility = "hidden";
      }

      target.appendChild(emptyRow);
      return;
    }

    data.forEach(function (item, index) {
      const row = template.cloneNode(true);

      fillExistingRow(
        row,
        item,
        index + 1,
        config
      );

      target.appendChild(row);
    });
  }

  function fillExistingRow(
    row,
    item,
    number,
    config
  ) {
    const title =
      item.judul ||
      item.nama_kegiatan ||
      item.nama_potensi ||
      "Tanpa judul";

    const description =
      item.ringkasan ||
      item.isi ||
      item.deskripsi ||
      "";

    const date =
      item.tanggal_publikasi ||
      item.tanggal ||
      item.tanggal_kegiatan ||
      item.created_at ||
      "";

    const image =
      item.gambar_url ||
      item.foto_utama_url ||
      "../static/image/placeholder.png";

    row.dataset.id = item.id;

    const titleElement = row.querySelector(
      "h2, h3, .announcement-info strong, .article-info strong"
    );

    if (titleElement) {
      titleElement.textContent = title;
    }

    const descriptionElement =
      row.querySelector(
        ".berita-detail p, .article-info small, p, small"
      );

    if (descriptionElement) {
      descriptionElement.textContent =
        description;
    }

    const imageElement =
      row.querySelector("img");

    if (imageElement) {
      imageElement.src = image;
      imageElement.alt = title;
    }

    const tableTexts = Array.from(
      row.querySelectorAll(".table-text")
    );

    const authorElement =
      row.querySelector(".col-penulis") ||
      tableTexts[0];

    if (authorElement) {
      authorElement.textContent =
        item.penulis ||
        item.nama_penulis ||
        "Admin RW";
    }

    const dateElement =
      row.querySelector(
        ".announcement-date, .col-tanggal, .date-info, time"
      ) ||
      (config.table === "berita"
        ? tableTexts[1]
        : null);

    if (dateElement) {
      dateElement.textContent =
        formatDate(date);
    }

    const statusValue =
      item.status || "draft";

    const statusElement =
      row.querySelector(".status");

    if (statusElement) {
      statusElement.textContent =
        getStatusLabel(statusValue);

      statusElement.className =
        `status ${statusValue}`;
    } else {
      const statusColumn =
        row.querySelector(".col-status");

      if (statusColumn) {
        statusColumn.textContent =
          getStatusLabel(statusValue);
      }
    }

    const numberElement =
      row.querySelector(
        ".number, .col-no"
      );

    if (numberElement) {
      numberElement.textContent = number;
    }

    const editButton =
      row.querySelector(
        ".action-edit, [title='Edit berita'], [title='Edit artikel']"
      ) ||
      row.querySelector(
        ".action-buttons a:nth-of-type(2)"
      );

    if (editButton) {
      const editPage =
        getEditPage(config.table);

      editButton.href =
        `${editPage}?edit=${encodeURIComponent(
          item.id
        )}&rw=${encodeURIComponent(
          getCurrentRW()
        )}`;
    }

    const deleteButton =
      row.querySelector(
        "[data-delete], .action-delete, .delete"
      );

    if (deleteButton) {
      deleteButton.onclick =
        async function (event) {
          event.preventDefault();

          const confirmed = window.confirm(
            "Hapus data ini?"
          );

          if (!confirmed) {
            return;
          }

          try {
            const RWKita = getRWKita();

            await RWKita.admin.remove(
              config.table,
              item.id
            );

            if (
              RWKita.toast &&
              typeof RWKita.toast === "function"
            ) {
              RWKita.toast(
                "Data berhasil dihapus.",
                "success"
              );
            }

            window.location.reload();
          } catch (error) {
            console.error(
              "Gagal menghapus data:",
              error
            );

            const RWKita = getRWKita();

            if (
              RWKita.toast &&
              typeof RWKita.toast === "function"
            ) {
              RWKita.toast(
                error.message ||
                  "Data gagal dihapus.",
                "error"
              );
            }
          }
        };
    }

    if (config.table === "cerita_warga") {
      bindStoryStatusButtons(
        row,
        item,
        config
      );
    }
  }

  function bindStoryStatusButtons(
    row,
    item,
    config
  ) {
    const RWKita = getRWKita();

    const acceptButton =
      row.querySelector(
        "[data-status-update='published']"
      );

    const rejectButton =
      row.querySelector(
        "[data-status-update='rejected']"
      );

    acceptButton?.addEventListener(
      "click",
      async function (event) {
        event.preventDefault();

        await RWKita.admin.update(
          config.table,
          item.id,
          {
            status: "published"
          }
        );

        window.location.reload();
      }
    );

    rejectButton?.addEventListener(
      "click",
      async function (event) {
        event.preventDefault();

        await RWKita.admin.update(
          config.table,
          item.id,
          {
            status: "rejected"
          }
        );

        window.location.reload();
      }
    );
  }
})(window);