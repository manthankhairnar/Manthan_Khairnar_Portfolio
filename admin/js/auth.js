/* =====================================================================
   AUTH — Supabase session handling for the admin dashboard.
   ===================================================================== */
window.sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

async function requireAdminSession() {
  const { data: { session }, error } = await window.sb.auth.getSession();
  if (error || !session) {
    window.location.href = "/admin/login.html";
    return null;
  }
  if (window.ADMIN_UUID && window.ADMIN_UUID !== "8a0ef80c-5da9-4ef4-9c7b-fbed49220468" && session.user.id !== window.ADMIN_UUID) {
    await window.sb.auth.signOut();
    window.location.href = "/admin/login.html?unauthorized=1";
    return null;
  }
  return session;
}

async function doLogin(email, password) {
  const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: error.message };
  if (window.ADMIN_UUID && window.ADMIN_UUID !== "8a0ef80c-5da9-4ef4-9c7b-fbed49220468" && data.user.id !== window.ADMIN_UUID) {
    await window.sb.auth.signOut();
    return { ok: false, message: "This account is not authorized as the portfolio admin." };
  }
  return { ok: true };
}

async function doLogout() {
  await window.sb.auth.signOut();
  window.location.href = "/admin/login.html";
}

// Keep the session valid; if it expires mid-session, bounce to login.
window.sb.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT" && !location.pathname.endsWith("login.html")) {
    window.location.href = "/admin/login.html?expired=1";
  }
});
