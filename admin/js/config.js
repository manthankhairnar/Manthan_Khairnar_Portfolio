/* Admin shares the same public Supabase project config — the ONLY
   difference is this file also names the admin UUID for a client-side
   UX check (showing/hiding the dashboard). This is NOT what secures
   your data — RLS policies in supabase/policies.sql are what actually
   enforce it. Even if this UUID were wrong or removed, RLS still
   blocks any non-admin session from writing anything. */
window.SUPABASE_CONFIG = {
  url: "https://ocqjyrckmkijklwvqqdw.supabase.co/",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcWp5cmNrbWtpamtsd3ZxcWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNjU0MTcsImV4cCI6MjEwMTc0MTQxN30.yAGR4xBNupSX7weugGZNyZ7X7IBc_LOCLDdXbYFmH8I",
  storageBucket: "portfolio-media"
};

// >>> paste the same UUID you put in supabase/policies.sql here too <<<
window.ADMIN_UUID = "8a0ef80c-5da9-4ef4-9c7b-fbed49220468";
