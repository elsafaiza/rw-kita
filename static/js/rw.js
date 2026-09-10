document.addEventListener("DOMContentLoaded", async () => {
  const rw = await ambilRW();

  if (!rw) {
    tampilkanPesanGagal("Data RW tidak ditemukan.");
    return;
  }

  tampilkanDataRW(rw);

  await Promise.all([
    tampilkanBeritaRW(rw.id),
    tampilkanAgendaRW(rw.id),
    tampilkanPotensiRW(rw.id),
    tampilkanGaleriRW(rw.id)
  ]);

  terapkanBahasaAktif();
});


/* ==================================================
   AMBIL DATA RW
================================================== */

async function ambilRW() {
  const parameterURL = new URLSearchParams(
    window.location.search
  );

  const nomorRW = (
    parameterURL.get("rw") || "RW 01"
  ).trim();

  const { data, error } = await supabaseClient
    .from("rws")
    .select(`
      id,
      nama_ketua,
      foto_ketua_url,
      sambutan_ketua,
      nomor_rw,
      nama_rw,
      kelurahan,
      kecamatan,
      kota,
      provinsi,
      deskripsi,
      total_kepala_keluarga,
      total_rt,
      total_umkm,
      total_komunitas,
      total_dokumen
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


/* ==================================================
   TAMPILKAN DATA UTAMA RW
================================================== */

function tampilkanDataRW(rw) {
  const title = document.getElementById("rw-title");
  const location = document.getElementById("rw-location");
  const description = document.getElementById("rw-description");
  const statistikTitle = document.getElementById(
    "statistik-title"
  );

  const leaderPhoto = document.getElementById(
    "rw-leader-photo"
  );

  const leaderName = document.getElementById(
    "rw-leader-name"
  );

  const leaderRole = document.getElementById(
    "rw-leader-role"
  );

  const welcomeText = document.getElementById(
    "rw-welcome-text"
  );

  const nomorRW = rw.nomor_rw || "RW 01";

  if (title) {
    title.textContent = `RW KITA ${nomorRW}`;
  }

  if (location) {
    const kelurahan = rw.kelurahan || "Kelurahan XYZ";
    const kecamatan = rw.kecamatan || "Kecamatan XYZ";

    location.textContent =
      `${kelurahan}, ${kecamatan}`;
  }

  if (description) {
    description.textContent =
      rw.deskripsi ||
      `${nomorRW} merupakan lingkungan warga yang kolaboratif, informatif, dan nyaman.`;
  }

  if (statistikTitle) {
    statistikTitle.textContent =
      `Statistik ${nomorRW}`;
  }

  if (leaderPhoto) {
    if (rw.foto_ketua_url) {
      leaderPhoto.src = rw.foto_ketua_url;
      leaderPhoto.alt =
        rw.nama_ketua || `Ketua ${nomorRW}`;
      leaderPhoto.style.display = "block";
    } else {
      leaderPhoto.removeAttribute("src");
      leaderPhoto.alt = "Foto Ketua RW";
    }
  }

  if (leaderName) {
    leaderName.textContent =
      rw.nama_ketua || "Ketua RW";
  }

  if (leaderRole) {
    leaderRole.textContent =
      `Ketua ${nomorRW}`;
  }

  if (welcomeText) {
    const sambutan = rw.sambutan_ketua
      ? `<p>${escapeHTML(rw.sambutan_ketua)}</p>`
      : "";

    welcomeText.innerHTML = `
      <p>
        Assalamu'alaikum warahmatullahi wabarakatuh.
      </p>

      <p>
        Selamat datang di website resmi ${escapeHTML(nomorRW)}.
      </p>

      ${sambutan}

      <p>
        Wassalamu'alaikum warahmatullahi wabarakatuh.
      </p>
    `;
  }

  isiStatistik(
    "stat-keluarga",
    rw.total_kepala_keluarga
  );

  isiStatistik(
    "stat-rt",
    rw.total_rt
  );

  isiStatistik(
    "stat-umkm",
    rw.total_umkm
  );

  isiStatistik(
    "stat-komunitas",
    rw.total_komunitas
  );

  isiStatistik(
    "stat-dokumen",
    rw.total_dokumen
  );

  document.title =
    `RW KITA | ${nomorRW}`;

  terapkanBahasaAktif();
}


/* ==================================================
   STATISTIK
================================================== */

function isiStatistik(id, nilai) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = nilai ?? 0;
  }
}


/* ==================================================
   BERITA RW
================================================== */

async function tampilkanBeritaRW(rwId) {
  const container = document.getElementById(
    "rw-news-list"
  );

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
    .limit(3);

  if (error) {
    console.error("Gagal mengambil berita:", error);

    container.innerHTML = `
      <p>Berita belum dapat dimuat.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada berita untuk RW ini.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  container.innerHTML = data
    .map(item => {
      const judul = escapeHTML(
        item.judul || "Berita RW"
      );

      const isi = escapeHTML(
        item.ringkasan ||
        item.isi ||
        "Informasi belum tersedia."
      );

      const gambar = escapeHTML(
        item.gambar_url ||
        "../static/image/informasi.jpg"
      );

      return `
        <article class="news-card">
          <img
            src="${gambar}"
            alt="${judul}"
          >

          <div class="news-date">
            ${formatTanggal(item.tanggal_publikasi)}
          </div>

          <div class="news-content">
            <h3>${judul}</h3>

            <p>${isi}</p>

            <a href="#">
              Lihat Selengkapnya →
            </a>
          </div>
        </article>
      `;
    })
    .join("");

  terapkanBahasaAktif();
}


/* ==================================================
   AGENDA RW
================================================== */

async function tampilkanAgendaRW(rwId) {
  const container = document.getElementById(
    "rw-agenda-list"
  );

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
    .limit(4);

  if (error) {
    console.error("Gagal mengambil agenda:", error);

    container.innerHTML = `
      <p>Agenda belum dapat dimuat.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada agenda untuk RW ini.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  container.innerHTML = data
    .map(item => {
      const tanggal = item.tanggal || "";
      const bagianTanggal = tanggal.split("-");

      const hari = bagianTanggal[2] || "--";

      const namaKegiatan = escapeHTML(
        item.nama_kegiatan || "Kegiatan RW"
      );

      const lokasi = escapeHTML(
        item.lokasi || "Lokasi belum ditentukan"
      );

      return `
        <div class="agenda-item">
          <div class="agenda-date">
            <strong>${hari}</strong>
            <span>${formatBulan(tanggal)}</span>
          </div>

          <div>
            <h3>${namaKegiatan}</h3>

            <p>
              <img
                src="../static/icon/clock 1.png"
                alt="Waktu"
              >

              ${formatWaktu(item.waktu_mulai)}
              -
              ${formatWaktu(item.waktu_selesai)}
              WIB
            </p>

            <p>
              <img
                src="../static/icon/maps-and-flags 1.png"
                alt="Lokasi"
              >

              ${lokasi}
            </p>
          </div>
        </div>
      `;
    })
    .join("");

  terapkanBahasaAktif();
}


/* ==================================================
   POTENSI RW
================================================== */

async function tampilkanPotensiRW(rwId) {
  const container = document.getElementById(
    "rw-potensi-list"
  );

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("potensi_rw")
    .select(`
      nama_potensi,
      deskripsi,
      gambar_url
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .limit(3);

  if (error) {
    console.error("Gagal mengambil potensi:", error);

    container.innerHTML = `
      <p>Potensi RW belum dapat dimuat.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada potensi RW.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  container.innerHTML = data
    .map(item => {
      const namaPotensi = escapeHTML(
        item.nama_potensi || "Potensi RW"
      );

      const deskripsi = escapeHTML(
        item.deskripsi || "Deskripsi belum tersedia."
      );

      const gambar = escapeHTML(
        item.gambar_url ||
        "../static/image/placeholder.png"
      );

      return `
        <div class="potential-card">
          <img
            src="${gambar}"
            alt="${namaPotensi}"
          >

          <div>
            <h3>${namaPotensi}</h3>
            <p>${deskripsi}</p>
          </div>

          <strong>›</strong>
        </div>
      `;
    })
    .join("");

  terapkanBahasaAktif();
}


/* ==================================================
   GALERI RW
================================================== */

async function tampilkanGaleriRW(rwId) {
  const container = document.getElementById(
    "rw-galeri-list"
  );

  if (!container) return;

  const { data, error } = await supabaseClient
    .from("galeri")
    .select(`
      judul,
      gambar_url,
      tanggal_kegiatan
    `)
    .eq("rw_id", rwId)
    .eq("status", "published")
    .order("tanggal_kegiatan", {
      ascending: false
    })
    .limit(6);

  if (error) {
    console.error("Gagal mengambil galeri:", error);

    container.innerHTML = `
      <p>Galeri belum dapat dimuat.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada galeri kegiatan.</p>
    `;

    terapkanBahasaAktif();
    return;
  }

  container.innerHTML = data
    .map(item => {
      const judul = escapeHTML(
        item.judul || "Dokumentasi Kegiatan"
      );

      const gambar = escapeHTML(
        item.gambar_url ||
        "../static/image/placeholder.png"
      );

      return `
        <div class="gallery-item">
          <img
            src="${gambar}"
            alt="${judul}"
          >

          <span>${judul}</span>
        </div>
      `;
    })
    .join("");

  terapkanBahasaAktif();
}


/* ==================================================
   FORMAT TANGGAL
================================================== */

function formatTanggal(tanggal) {
  if (!tanggal) return "";

  const hasil = new Date(tanggal);

  if (Number.isNaN(hasil.getTime())) {
    return "";
  }

  return hasil.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}


function formatBulan(tanggal) {
  if (!tanggal) return "---";

  const bulan = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER"
  ];

  const nomorBulan = Number(
    tanggal.split("-")[1]
  );

  return bulan[nomorBulan - 1] || "---";
}


function formatWaktu(waktu) {
  if (!waktu) return "--:--";

  return String(waktu).substring(0, 5);
}


/* ==================================================
   BANTUAN BAHASA
================================================== */

function terapkanBahasaAktif() {
  if (typeof window.terapkanBahasa !== "function") {
    return;
  }

  const bahasa =
    localStorage.getItem("rwKitaLanguage") || "id";

  window.terapkanBahasa(bahasa);
}


/* ==================================================
   PESAN ERROR
================================================== */

function tampilkanPesanGagal(pesan) {
  const elemen = document.querySelector(
    ".rw-content, main, body"
  );

  if (!elemen) return;

  const pesanElement = document.createElement("p");

  pesanElement.className = "rw-error-message";
  pesanElement.textContent = pesan;

  elemen.prepend(pesanElement);
}


/* ==================================================
   KEAMANAN HTML
================================================== */

function escapeHTML(nilai) {
  return String(nilai ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}