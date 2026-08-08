/* Initializes a single shared Supabase client for the public site.
   Loaded AFTER config.js and the supabase-js CDN script. */
(function () {
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase JS library failed to load from CDN.");
    return;
  }
  window.sb = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
  );
})();
