/* =====================================================================
   DASHBOARD — nav wiring, session gate, publish workflow, overview.
   ===================================================================== */
(async function () {
  const session = await requireAdminSession();
  if (!session) return; // requireAdminSession already redirected

  document.getElementById("adminEmail").textContent = session.user.email || "";
  document.getElementById("logoutBtn").addEventListener("click", doLogout);

  const nav = document.getElementById("dashNav");
  const panel = document.getElementById("panelContainer");

  function buildNav() {
    nav.innerHTML = "";
    const dashBtn = navItem("dashboard", "Dashboard", "grid");
    dashBtn.classList.add("active");
    nav.appendChild(dashBtn);

    const contentHeader = document.createElement("div");
    contentHeader.className = "nav-group-label";
    contentHeader.textContent = "Content";
    nav.appendChild(contentHeader);
    window.NAV_ORDER.forEach(key => nav.appendChild(navItem(key, window.TABLES[key].label)));

    const mediaHeader = document.createElement("div");
    mediaHeader.className = "nav-group-label";
    mediaHeader.textContent = "Media";
    nav.appendChild(mediaHeader);
    nav.appendChild(navItem("media", "Media Library"));

    const appHeader = document.createElement("div");
    appHeader.className = "nav-group-label";
    appHeader.textContent = "Appearance";
    nav.appendChild(appHeader);
    nav.appendChild(navItem("appearance", window.TABLES.appearance.label));

    const setHeader = document.createElement("div");
    setHeader.className = "nav-group-label";
    setHeader.textContent = "Settings";
    nav.appendChild(setHeader);
    nav.appendChild(navItem("site_settings", "SEO & Site"));
  }

  function navItem(key, label) {
    const btn = document.createElement("button");
    btn.className = "nav-item";
    btn.dataset.key = key;
    btn.textContent = label;
    btn.addEventListener("click", () => selectPanel(key));
    return btn;
  }

  async function selectPanel(key) {
    if (__dirty && !confirm("You have unsaved changes. Leave anyway?")) return;
    clearDirty();
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.key === key));
    document.getElementById("mobileNav")?.classList.remove("open");

    if (key === "dashboard") return renderOverview(panel);
    if (key === "media") return renderMediaManager(panel);
    return renderTablePanel(key, panel);
  }

  async function renderOverview(container) {
    container.innerHTML = `<div class="panel-head"><h2>Dashboard</h2></div><div id="overviewSlot" class="loading">Loading overview…</div>`;
    const counts = {};
    await Promise.all(window.NAV_ORDER.map(async key => {
      const cfg = window.TABLES[key];
      if (cfg.singleton) { counts[key] = 1; return; }
      const { count } = await window.sb.from(key).select("id", { count: "exact", head: true });
      counts[key] = count || 0;
    }));
    const { data: settings } = await window.sb.from("site_settings").select("last_published_at").eq("id", 1).maybeSingle();

    const slot = document.getElementById("overviewSlot");
    slot.innerHTML = `
      <div class="overview-banner">
        <div>
          <div class="ov-label">Last published</div>
          <div class="ov-value">${settings && settings.last_published_at ? new Date(settings.last_published_at).toLocaleString() : "Never"}</div>
        </div>
        <button class="btn btn-primary" id="publishAllBtn">Publish all drafts</button>
      </div>
      <div class="overview-grid">
        ${window.NAV_ORDER.map(key => `
          <div class="ov-card">
            <div class="ov-count">${counts[key]}</div>
            <div class="ov-name">${window.TABLES[key].label}</div>
          </div>`).join("")}
      </div>
    `;
    document.getElementById("publishAllBtn").addEventListener("click", publishAllDrafts);
  }

  async function publishAllDrafts() {
    if (!confirm("Publish every draft item across all sections?")) return;
    const btn = document.getElementById("publishAllBtn");
    btn.disabled = true; btn.textContent = "Publishing…";
    try {
      for (const key of window.NAV_ORDER) {
        const cfg = window.TABLES[key];
        if (!cfg.fields.some(f => f.name === "status")) continue;
        await window.sb.from(key).update({ status: "published" }).eq("status", "draft");
      }
      await window.sb.from("site_settings").update({ last_published_at: new Date().toISOString() }).eq("id", 1);
      toast("Published.");
      renderOverview(panel);
    } catch (e) {
      toast("Publish failed: " + e.message, true);
    } finally {
      btn.disabled = false; btn.textContent = "Publish all drafts";
    }
  }

  document.getElementById("mobileNavToggle")?.addEventListener("click", () => {
    document.getElementById("mobileNav")?.classList.toggle("open");
  });

  buildNav();
  selectPanel("dashboard");
})();
