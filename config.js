/* =====================================================================
   SUPABASE CONFIGURATION — public, safe values only
   This file is meant to be committed to the repo and served statically.
   It must NEVER contain the service-role/secret key — only the
   project URL and the anon/publishable key, which are safe for the
   browser (all real protection comes from RLS + Storage policies).
   ===================================================================== */
window.SUPABASE_CONFIG = {
  // NOTE: paste the *base* project URL here (no /rest/v1 suffix) —
  // the supabase-js client appends the right paths itself.
  url: "https://ocqjyrckmkijklwvqqdw.supabase.co",

  // NOTE: the anon key you supplied looked truncated (JWTs end in a
  // longer signature segment). Verify this against
  // Supabase Dashboard > Project Settings > API > "anon public" key
  // before deploying — if it's wrong, both the public site and the
  // admin login will fail to reach Supabase.
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcWp5cmNrbWtpamtsd3ZxcWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjU0MTcsImV4cCI6MjEwMTc0MTQxN30.yAGR4xBNupSX7weugGZNyZ7X7IBc_LO",

  storageBucket: "portfolio-media"
};
