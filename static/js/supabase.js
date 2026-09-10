// const SUPABASE_URL = "https://cdxhqartlfhqkdljmmqh.supabase.co";
// const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeGhxYXJ0bGZocWtkbGptbXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjk3NzIsImV4cCI6MjEwMjk0NTc3Mn0.ResFjZGnSww6PlhysISPgJbe_DtOmTMeMoAn4WvZTYI";

// const supabaseClient = window.supabase.createClient(
//   SUPABASE_URL,
//   SUPABASE_ANON_KEY
// );


(function initSupabase() {
  const SUPABASE_URL =
    window.RWKITA_SUPABASE_URL ||
    localStorage.getItem("rwKitaSupabaseUrl") ||
    "https://cdxhqartlfhqkdljmmqh.supabase.co";

  const SUPABASE_ANON_KEY =
    window.RWKITA_SUPABASE_ANON_KEY ||
    localStorage.getItem("rwKitaSupabaseAnonKey") ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeGhxYXJ0bGZocWtkbGptbXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNjk3NzIsImV4cCI6MjEwMjk0NTc3Mn0.ResFjZGnSww6PlhysISPgJbe_DtOmTMeMoAn4WvZTYI";

  if (window.supabaseClient) {
    return;
  }

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error(
      "Supabase belum termuat. Pastikan CDN Supabase dipanggil sebelum supabase.js."
    );

    window.supabaseClient = null;
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("URL atau anon key Supabase masih kosong.");
    window.supabaseClient = null;
    return;
  }

  try {
    window.supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    console.log("Supabase berhasil terhubung.");
  } catch (error) {
    console.error(
      "Supabase gagal diinisialisasi. Periksa URL dan anon key.",
      error
    );

    window.supabaseClient = null;
  }
})();

var supabaseClient = window.supabaseClient;