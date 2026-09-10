document.addEventListener("DOMContentLoaded", async () => {
  const rw = await ambilRWInformasi();

  if (!rw) return;

  await tampilkanBannerInformasi(rw);
  await tampilkanBeritaInformasi(rw.id);
  await tampilkanPengumuman(rw.id);
  await tampilkanAgendaInformasi(rw.id);
  await tampilkanGaleriInformasi(rw.id);
  await tampilkanArtikel(rw.id);
  await tampilkanPublikasi(rw.id);
});

async function ambilRWInformasi() {
  const params = new URLSearchParams(window.location.search);
  const nomorRW = params.get("rw") || "RW 01";

  const { data, error } = await supabaseClient
    .from("rws")
    .select(`
      id,
      nomor_rw,
      deskripsi
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

  document.title = `RW KITA | Informasi ${data.nomor_rw}`;

  return data;
}

async function tampilkanBannerInformasi(rw) {
  const title = document.getElementById("informasi-title");
  const description = document.getElementById("informasi-description");
  const image = document.getElementById("informasi-banner-image");

  const { data: banner, error } = await supabaseClient
    .from("banner_informasi")
    .select(`
      judul,
      deskripsi,
      gambar_url
    `)
    .eq("rw_id", rw.id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil banner:", error);
  }

  if (title) {
    title.textContent =
      banner?.judul || `Informasi ${rw.nomor_rw}`;
  }

  if (description) {
    description.textContent =
      banner?.deskripsi ||
      rw.deskripsi ||
      `Temukan berbagai informasi terbaru dari ${rw.nomor_rw}.`;
  }

  if (image && banner?.gambar_url) {
    image.src = banner.gambar_url;
  }
}

async function tampilkanBeritaInformasi(rwId) {
  const container = document.getElementById("informasi-news-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("berita")
    .select(`
      judul,
      ringkasan,
      isi,
      gambar_url,
      tanggal_publikasi
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tanggal_publikasi", {
      ascending: false
    })
    .limit(6);

  if (error) {
    console.error("Gagal mengambil berita:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada berita untuk RW ini.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <article class="news-card">
      <img
        src="${item.gambar_url || "../static/image/informasi.jpg"}"
        alt="${item.judul}"
      >

      <div class="news-body">
        <h3>${item.judul}</h3>
        <p>${item.ringkasan || item.isi || ""}</p>
        <a href="#">Lihat Selengkapnya →</a>
      </div>
    </article>
  `).join("");
}

async function tampilkanPengumuman(rwId) {
  const container = document.getElementById("pengumuman-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("pengumuman")
    .select(`
      judul,
      isi,
      tanggal_publikasi
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tanggal_publikasi", {
      ascending: false
    })
    .limit(4);

  if (error) {
    console.error("Gagal mengambil pengumuman:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada pengumuman.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="announcement-card">
      <div class="announcement-icon">
        <img src="../static/icon/marketing.png" alt="Pengumuman">
      </div>

      <div class="announcement-text">
        <h3>${item.judul}</h3>
        <p>${item.isi}</p>
      </div>

      <span class="announcement-date">
        ${formatTanggal(item.tanggal_publikasi)}
      </span>
    </div>
  `).join("");
}

async function tampilkanAgendaInformasi(rwId) {
  const container = document.getElementById("informasi-agenda-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("agenda")
    .select(`
      nama_kegiatan,
      tanggal,
      waktu_mulai,
      waktu_selesai,
      lokasi
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tanggal", {
      ascending: true
    })
    .limit(6);

  if (error) {
    console.error("Gagal mengambil agenda:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada agenda untuk RW ini.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="agenda-item">
      <div class="agenda-date">
        <strong>${item.tanggal.split("-")[2]}</strong>
        <span>${formatBulan(item.tanggal)}</span>
      </div>

      <div class="agenda-detail">
        <h3>${item.nama_kegiatan}</h3>

        <p>
          <img src="../static/icon/clock 1.png" alt="Waktu">
          ${formatWaktu(item.waktu_mulai)} -
          ${formatWaktu(item.waktu_selesai)} WIB
        </p>

        <p>
          <img src="../static/icon/maps-and-flags 1.png" alt="Lokasi">
          ${item.lokasi || "Lokasi belum ditentukan"}
        </p>
      </div>
    </div>
  `).join("");
}

async function tampilkanGaleriInformasi(rwId) {
  const container = document.getElementById("informasi-galeri-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("galeri")
    .select(`
      judul,
      gambar_url
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tanggal_kegiatan", {
      ascending: false
    })
    .limit(9);

  if (error) {
    console.error("Gagal mengambil galeri:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada dokumentasi kegiatan.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <img
      src="${item.gambar_url || "../static/image/placeholder.png"}"
      alt="${item.judul || "Dokumentasi kegiatan"}"
    >
  `).join("");
}

async function tampilkanArtikel(rwId) {
  const container = document.getElementById("artikel-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("artikel")
    .select(`
      judul,
      ringkasan,
      gambar_url,
      tanggal_publikasi
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tanggal_publikasi", {
      ascending: false
    })
    .limit(3);

  if (error) {
    console.error("Gagal mengambil artikel:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada artikel.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="article-item">
      <img
        src="${item.gambar_url || "../static/image/informasi.jpg"}"
        alt="${item.judul}"
      >

      <div>
        <h3>${item.judul}</h3>
        <p>${formatTanggal(item.tanggal_publikasi)}</p>
        <span>${item.ringkasan || ""}</span>
      </div>
    </div>
  `).join("");
}

async function tampilkanPublikasi(rwId) {
  const container = document.getElementById("publikasi-list");

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("publikasi_rw")
    .select(`
      judul,
      tipe_file,
      ukuran_file,
      file_url
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tahun", {
      ascending: false
    })
    .limit(3);

  if (error) {
    console.error("Gagal mengambil publikasi:", error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Belum ada publikasi RW.</p>";
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="publication-item">
      <img src="../static/icon/document.png" alt="Dokumen">

      <div>
        <h3>${item.judul}</h3>
        <p>
          ${item.tipe_file || "Dokumen"},
          ${formatUkuran(item.ukuran_file)}
        </p>
      </div>

      <a href="${item.file_url || "#"}" target="_blank" download>
        <img src="../static/icon/download (1).png" alt="Download">
      </a>
    </div>
  `).join("");
}

function formatTanggal(tanggal) {
  if (!tanggal) return "";

  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatBulan(tanggal) {
  const bulan = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL",
    "MEI", "JUNI", "JULI", "AGUSTUS",
    "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];

  return bulan[Number(tanggal.split("-")[1]) - 1];
}

function formatWaktu(waktu) {
  return waktu ? waktu.substring(0, 5) : "--:--";
}

function formatUkuran(bytes) {
  if (!bytes) return "Ukuran tidak tersedia";

  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  }

  return `${(bytes / 1000).toFixed(1)} KB`;
}