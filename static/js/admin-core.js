(function (window) {
  "use strict";

  const RWKita = window.RWKita;
  const admin = {};

  admin.selectedRW = null;
  admin.session = null;

  function client() {
    return RWKita.requireClient();
  }

  admin.init = async function () {
    try {
      const result = await client().auth.getSession();

      if (result.error) throw result.error;

      if (!result.data.session) {
        window.location.href = "login-admin.html";
        return;
      }

      admin.session = result.data.session;

      await admin.loadRW();
      admin.bindLogout();

      window.dispatchEvent(
        new CustomEvent("rwkita:admin-ready")
      );
    } catch (error) {
      console.error("Admin gagal dimuat:", error);
      RWKita.toast(
        "Panel admin gagal dimuat.",
        "error"
      );
    }
  };

  admin.loadRW = async function () {
    const wrappers =
      document.querySelectorAll(".rw-selector");

    const result = await client()
      .from("rws")
      .select("id, nomor_rw, nama_rw")
      .eq("is_active", true)
      .order("nomor_rw");

    if (result.error) throw result.error;

    const rws = result.data || [];

    if (!rws.length) {
      throw new Error("Belum ada RW aktif.");
    }

    const saved =
      localStorage.getItem("rwKitaAdminRW") ||
      new URLSearchParams(
        window.location.search
      ).get("rw");

    admin.selectedRW =
      rws.find((rw) => rw.nomor_rw === saved) ||
      rws[0];

    localStorage.setItem(
      "rwKitaAdminRW",
      admin.selectedRW.nomor_rw
    );

    wrappers.forEach((wrapper) => {
      const select = document.createElement("select");

      select.className = "rw-admin-select";
      select.setAttribute(
        "aria-label",
        "Pilih RW"
      );

      select.innerHTML = rws
        .map(
          (rw) => `
            <option value="${rw.nomor_rw}">
              ${rw.nomor_rw}
            </option>
          `
        )
        .join("");

      select.value = admin.selectedRW.nomor_rw;

      select.addEventListener("change", () => {
        localStorage.setItem(
          "rwKitaAdminRW",
          select.value
        );

        const url = new URL(
          window.location.href
        );

        url.searchParams.set("rw", select.value);
        window.location.href = url.href;
      });

      wrapper.replaceChildren(select);
    });
  };

  admin.getRW = async function () {
    const result = await client()
      .from("rws")
      .select("*")
      .eq("id", admin.selectedRW.id)
      .maybeSingle();

    if (result.error) throw result.error;

    return result.data;
  };

  admin.query = async function (
    table,
    rwId,
    order = "created_at"
  ) {
    const result = await client()
      .from(table)
      .select("*")
      .eq("rw_id", rwId)
      .order(order, {
        ascending: false
      });

    if (result.error) throw result.error;

    return result.data || [];
  };

  admin.update = async function (
    table,
    id,
    values
  ) {
    const result = await client()
      .from(table)
      .update(values)
      .eq("id", id);

    if (result.error) throw result.error;
  };

  admin.remove = async function (
    table,
    id
  ) {
    const result = await client()
      .from(table)
      .delete()
      .eq("id", id);

    if (result.error) throw result.error;
  };

  admin.bindLogout = function () {
    document
      .querySelectorAll(
        ".admin-logout, [data-action='logout']"
      )
      .forEach((link) => {
        link.addEventListener("click", async (event) => {
          event.preventDefault();

          await client().auth.signOut();
          window.location.href =
            "login-admin.html";
        });
      });
  };

  window.RWKita.admin = admin;

  document.addEventListener(
    "DOMContentLoaded",
    admin.init
  );
})(window);