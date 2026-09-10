document.addEventListener("DOMContentLoaded", async () => {
  const emailElement = document.getElementById("footer-email");

  if (!emailElement) return;

  const params = new URLSearchParams(
    window.location.search
  );

  const nomorRW = params.get("rw") || "RW 01";

  const { data, error } = await supabaseClient
    .from("rws")
    .select(`
      nomor_rw,
      email
    `)
    .eq("nomor_rw", nomorRW)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil email footer:", error);
    return;
  }

  if (!data) {
    console.error(`${nomorRW} tidak ditemukan.`);
    return;
  }

  emailElement.textContent =
    data.email || "Email belum tersedia.";
});