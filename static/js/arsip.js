document.addEventListener("DOMContentLoaded", async () => {
  const rw = await ambilRW();

  if (!rw) return;

  tampilkanIdentitas(rw);
  await tampilkanStatistik(rw.id);
  await tampilkanArsip(rw.id);
});

async function ambilRW() {
  const params = new URLSearchParams(window.location.search);
  const nomorRW = params.get("rw") || "RW 01";

  const { data, error } = await supabaseClient
    .from("rws")
    .select(`
      id,
      nomor_rw
    `)
    .eq("nomor_rw", nomorRW)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil data RW:", error);
    return null;
  }

  if (!data) {
    console.error(`${nomorRW} tidak ditemukan.`);
    return null;
  }

  return data;
}

function tampilkanIdentitas(rw) {
  const title = document.getElementById("arsip-title");
  const description = document.getElementById("arsip-description");

  if (title) {
    title.textContent = `Arsip Digital ${rw.nomor_rw}`;
  }

  if (description) {
    description.textContent =
      `Pusat penyimpanan dokumen, laporan, dan dokumentasi kegiatan ${rw.nomor_rw}.`;
  }

  document.title = `RW KITA | Arsip Digital ${rw.nomor_rw}`;
}

async function tampilkanStatistik(rwId) {
  const { data, error } = await supabaseClient
    .from("arsip_digital")
    .select(`
      tipe_file,
      tahun
    `)
    .eq("rw_id", rwId)
    .eq("status", "published");

  if (error) {
    console.error("Gagal mengambil statistik arsip:", error);
    return;
  }

  const totalArsip = data?.length || 0;

  const jumlahJenisFile = new Set(
    data
      .map(item => item.tipe_file)
      .filter(Boolean)
  ).size;

  const tahunTerbaru = data?.length
    ? Math.max(...data.map(item => Number(item.tahun)))
    : "-";

  const jenisElement = document.getElementById("jenis-file");
  const tahunElement = document.getElementById("tahun-terbaru");
  const totalElement = document.getElementById("total-arsip");

  if (jenisElement) {
    jenisElement.textContent = jumlahJenisFile;
  }

  if (tahunElement) {
    tahunElement.textContent = tahunTerbaru;
  }

  if (totalElement) {
    totalElement.textContent = totalArsip;
  }
}

async function tampilkanArsip(rwId) {
  const container = document.getElementById("arsip-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("arsip_digital")
    .select(`
      judul,
      kategori,
      deskripsi,
      tahun,
      tipe_file,
      nama_file,
      file_url,
      ukuran_file,
      created_at
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Gagal mengambil arsip:", error);

    container.innerHTML = `
      <p>Data arsip gagal dimuat.</p>
    `;

    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada arsip digital untuk RW ini.</p>
    `;

    return;
  }

  renderArsip(data);
}

function renderArsip(data) {
  const container = document.getElementById("arsip-list");
  const searchInput = document.getElementById("arsip-search");
  const kategoriSelect = document.getElementById("arsip-kategori");
  const tahunSelect = document.getElementById("arsip-tahun");

  function render() {
    const kataKunci =
      searchInput?.value.toLowerCase().trim() || "";

    const kategoriDipilih =
      kategoriSelect?.value || "";

    const tahunDipilih =
      tahunSelect?.value || "";

    const hasil = data.filter(item => {
      const cocokKataKunci =
        item.judul?.toLowerCase().includes(kataKunci) ||
        item.deskripsi?.toLowerCase().includes(kataKunci) ||
        item.nama_file?.toLowerCase().includes(kataKunci);

      const cocokKategori =
        !kategoriDipilih ||
        item.kategori === kategoriDipilih;

      const cocokTahun =
        !tahunDipilih ||
        String(item.tahun) === tahunDipilih;

      return (
        cocokKataKunci &&
        cocokKategori &&
        cocokTahun
      );
    });

    if (hasil.length === 0) {
      container.innerHTML = `
        <p>Arsip tidak ditemukan.</p>
      `;

      return;
    }

    container.innerHTML = hasil.map(item => `
      <article class="arsip-card">

        <div class="arsip-card-top">
          <img
            src="${iconFile(item.tipe_file)}"
            alt="${item.tipe_file || "File"}"
          >

          <div class="arsip-card-title">
            <h3>${item.judul}</h3>

            <span class="arsip-label">
              ${item.kategori || "Dokumen"}
            </span>
          </div>
        </div>

        <div class="arsip-meta">
          <span>
            <img
              class="gambar"
              src="../static/icon/calendar1.png"
              alt="Tahun"
            >
            ${item.tahun || "-"}
          </span>

          <span>
            ${item.tipe_file || "File"}
          </span>
        </div>

        <hr>

        <p>
          ${item.deskripsi || "Tidak ada deskripsi arsip."}
        </p>

        <span class="arsip-size">
          ${formatUkuran(item.ukuran_file)}
        </span>

        <div class="arsip-actions">

          <a
            href="${item.file_url || "#"}"
            target="_blank"
            class="arsip-detail"
          >
            👁 Lihat Detail
          </a>

          <a
            href="${item.file_url || "#"}"
            target="_blank"
            download="${item.nama_file || item.judul}"
            class="arsip-download"
          >
            <img
              src="../static/icon/download_putih.png"
              alt="Download"
            >
            Unduh
          </a>

        </div>

      </article>
    `).join("");
  }

  searchInput?.addEventListener("input", render);
  kategoriSelect?.addEventListener("change", render);
  tahunSelect?.addEventListener("change", render);

  render();
}

function formatUkuran(bytes) {
  if (!bytes) return "Ukuran tidak tersedia";

  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  }

  return `${(bytes / 1000).toFixed(1)} KB`;
}

function iconFile(tipeFile) {
  const tipe = (tipeFile || "").toLowerCase();

  if (tipe.includes("pdf")) {
    return "../static/icon/pdf.png";
  }

  if (
    tipe.includes("doc") ||
    tipe.includes("word")
  ) {
    return "../static/icon/doc.png";
  }

  if (
    tipe.includes("xls") ||
    tipe.includes("excel")
  ) {
    return "../static/icon/xls.png";
  }

  if (
    tipe.includes("ppt") ||
    tipe.includes("powerpoint")
  ) {
    return "../static/icon/ppt.png";
  }

  if (
    tipe.includes("jpg") ||
    tipe.includes("jpeg") ||
    tipe.includes("png")
  ) {
    return "../static/icon/jpg.png";
  }

  if (tipe.includes("zip")) {
    return "../static/icon/zip.png";
  }

  return "../static/icon/document.png";
}