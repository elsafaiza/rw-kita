document.addEventListener("DOMContentLoaded", async () => {
  const rw = await ambilRW();

  if (!rw) return;

  tampilkanIdentitas(rw);
  await tampilkanStatistik(rw.id);
  await tampilkanProdukHukum(rw.id);
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
  const title = document.getElementById("produk-title");
  const description = document.getElementById("produk-description");

  if (title) {
    title.textContent = `Produk Hukum ${rw.nomor_rw}`;
  }

  if (description) {
    description.textContent =
      `Dokumen resmi sebagai dasar tata kelola dan administrasi ${rw.nomor_rw}.`;
  }

  document.title = `RW KITA | Produk Hukum ${rw.nomor_rw}`;
}

async function tampilkanStatistik(rwId) {
  const { data, error } = await supabaseClient
    .from("produk_hukum")
    .select(`
      tahun,
      jenis_dokumen
    `)
    .eq("rw_id", rwId)
    .eq("status", "published");

  if (error) {
    console.error("Gagal mengambil statistik:", error);
    return;
  }

  const totalDokumen = data?.length || 0;

  const tahunTerbaru = data?.length
    ? Math.max(...data.map(item => Number(item.tahun)))
    : "-";

  const jumlahJenis = new Set(
    data
      .map(item => item.jenis_dokumen)
      .filter(Boolean)
  ).size;

  const totalElement = document.getElementById("total-dokumen");
  const tahunElement = document.getElementById("tahun-terbaru");
  const jenisElement = document.getElementById("jumlah-kategori");

  if (totalElement) {
    totalElement.textContent = totalDokumen;
  }

  if (tahunElement) {
    tahunElement.textContent = tahunTerbaru;
  }

  if (jenisElement) {
    jenisElement.textContent = jumlahJenis;
  }
}

async function tampilkanProdukHukum(rwId) {
  const container = document.getElementById("produk-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("produk_hukum")
    .select(`
      judul,
      nomor_dokumen,
      jenis_dokumen,
      tahun,
      deskripsi,
      file_url
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tahun", {
      ascending: false
    });

  if (error) {
    console.error("Gagal mengambil produk hukum:", error);

    container.innerHTML = `
      <p>Data produk hukum gagal dimuat.</p>
    `;

    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada produk hukum untuk RW ini.</p>
    `;

    return;
  }

  renderProduk(data);
}

function renderProduk(data) {
  const container = document.getElementById("produk-list");
  const searchInput = document.getElementById("produk-search");
  const jenisSelect = document.getElementById("produk-kategori");
  const tahunSelect = document.getElementById("produk-tahun");

  function render() {
    const kataKunci =
      searchInput?.value.toLowerCase().trim() || "";

    const jenisDipilih =
      jenisSelect?.value || "";

    const tahunDipilih =
      tahunSelect?.value || "";

    const hasil = data.filter(item => {
      const cocokKataKunci =
        item.judul?.toLowerCase().includes(kataKunci) ||
        item.nomor_dokumen?.toLowerCase().includes(kataKunci) ||
        item.deskripsi?.toLowerCase().includes(kataKunci);

      const cocokJenis =
        !jenisDipilih ||
        item.jenis_dokumen === jenisDipilih;

      const cocokTahun =
        !tahunDipilih ||
        String(item.tahun) === tahunDipilih;

      return cocokKataKunci && cocokJenis && cocokTahun;
    });

    if (hasil.length === 0) {
      container.innerHTML = `
        <p>Dokumen tidak ditemukan.</p>
      `;

      return;
    }

    container.innerHTML = hasil.map(item => `
      <article class="produk-card">

        <span class="produk-label">
          ${item.jenis_dokumen || "Dokumen"}
        </span>

        <h3>
          ${item.judul}
        </h3>

        <p>
          Nomor: ${item.nomor_dokumen || "-"}<br>
          Tahun: ${item.tahun || "-"}
        </p>

        <hr>

        <p class="produk-description">
          ${item.deskripsi || "Tidak ada deskripsi dokumen."}
        </p>

        <div class="produk-actions">

          <a
            href="${item.file_url || "#"}"
            target="_blank"
            class="btn-detail"
          >
            👁 Lihat Detail
          </a>

          <a
            href="${item.file_url || "#"}"
            target="_blank"
            download
            class="btn-unduh"
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
  jenisSelect?.addEventListener("change", render);
  tahunSelect?.addEventListener("change", render);

  render();
}