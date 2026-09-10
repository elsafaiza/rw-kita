document.addEventListener("DOMContentLoaded", async () => {
  const rw = await ambilProfilRW();

  if (!rw) return;

  tampilkanProfilRW(rw);
});

async function ambilProfilRW() {
  const parameterURL = new URLSearchParams(
    window.location.search
  );

  const nomorRW = parameterURL.get("rw") || "RW 01";

  const { data, error } = await supabaseClient
    .from("rws")
    .select(`
      id,
      nomor_rw,
      nama_rw,
      kelurahan,
      kecamatan,
      deskripsi,
      nama_ketua,
      foto_ketua_url,
      sambutan_ketua
    `)
    .eq("nomor_rw", nomorRW)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil data profil RW:", error);
    return null;
  }

  if (!data) {
    console.error(`${nomorRW} tidak ditemukan.`);
    return null;
  }

  return data;
}

function tampilkanProfilRW(rw) {
  const title = document.getElementById("profil-title");
  const description = document.getElementById("profil-description");
  const leaderPhoto = document.getElementById("profil-leader-photo");
  const leaderName = document.getElementById("profil-leader-name");
  const leaderRole = document.getElementById("profil-leader-role");

  if (title) {
    title.textContent = `Profil ${rw.nomor_rw}`;
  }

  if (description) {
    description.textContent =
      rw.deskripsi ||
      `${rw.nomor_rw} merupakan bagian dari ${rw.kelurahan || "wilayah kelurahan"} yang aktif dan kolaboratif.`;
  }

  if (leaderPhoto && rw.foto_ketua_url) {
    leaderPhoto.src = rw.foto_ketua_url;
    leaderPhoto.alt = rw.nama_ketua || `Ketua ${rw.nomor_rw}`;
  }

  if (leaderName) {
    leaderName.textContent =
      rw.nama_ketua || "Nama Ketua RW";
  }

  if (leaderRole) {
    leaderRole.textContent = `Ketua ${rw.nomor_rw}`;
  }

  document.title = `RW KITA | Profil ${rw.nomor_rw}`;
}