document.addEventListener("DOMContentLoaded", async () => {
  const rw = await ambilRW();

  if (!rw) return;

  tampilkanIdentitas(rw);
  tampilkanPotensi(rw.id);
});

async function ambilRW() {
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

  return data;
}

function tampilkanIdentitas(rw) {
  const title = document.getElementById("potensi-title");
  const description = document.getElementById("potensi-description");

  if (title) {
    title.textContent = `Potensi ${rw.nomor_rw}`;
  }

  if (description) {
    description.textContent =
      `Temukan berbagai potensi unggulan yang dimiliki oleh ${rw.nomor_rw}.`;
  }

  document.title = `RW KITA | Potensi ${rw.nomor_rw}`;
}

async function tampilkanPotensi(rwId) {
  const container = document.getElementById("potensi-list");

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
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Gagal mengambil data potensi:", error);

    container.innerHTML = `
      <p>Data potensi gagal dimuat.</p>
    `;

    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <p>Belum ada potensi untuk RW ini.</p>
    `;

    return;
  }

  container.innerHTML = data.map(item => `
    <article class="potensi-card">

      <div class="potensi-image">
        <img
          src="${item.gambar_url || "../static/image/hidroponik.jpg"}"
          alt="${item.nama_potensi}"
        >
      </div>

      <div class="potensi-body">
        <h3>${item.nama_potensi}</h3>

        <p>
          ${item.deskripsi || "Belum ada deskripsi potensi."}
        </p>

        <a href="#" class="potensi-btn">
          Lihat Detail →
        </a>
      </div>

    </article>
  `).join("");
}