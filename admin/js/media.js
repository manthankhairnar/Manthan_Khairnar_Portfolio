/* =====================================================================
   MEDIA — upload/replace/delete to Supabase Storage bucket
   "portfolio-media", tracked in the `media` table, plus the visual
   Media Manager page.
   ===================================================================== */
const MAX_FILE_MB = { image: 8, video: 100, pdf: 20, other: 20 };
const ACCEPT = { image: "image/*", video: "video/*", pdf: "application/pdf" };

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
}

function inferType(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "other";
}

async function uploadMediaFile(file, folder, onProgress) {
  const type = inferType(file);
  const limitMb = MAX_FILE_MB[type] || MAX_FILE_MB.other;
  if (file.size > limitMb * 1024 * 1024) {
    throw new Error(`File too large — max ${limitMb}MB for ${type} files.`);
  }
  const path = `${folder}/${Date.now()}-${sanitizeName(file.name)}`;
  if (onProgress) onProgress(10);
  const { error: upErr } = await window.sb.storage
    .from(window.SUPABASE_CONFIG.storageBucket)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) throw new Error(upErr.message);
  if (onProgress) onProgress(70);

  const { data: pub } = window.sb.storage.from(window.SUPABASE_CONFIG.storageBucket).getPublicUrl(path);

  const { error: dbErr } = await window.sb.from("media").insert({
    file_name: file.name, file_type: type, storage_path: path,
    public_url: pub.publicUrl, size_bytes: file.size
  });
  if (dbErr) console.warn("media table insert failed (upload still succeeded):", dbErr.message);
  if (onProgress) onProgress(100);

  return { path, publicUrl: pub.publicUrl, type };
}

async function replaceMediaFile(oldPath, file, folder, onProgress) {
  if (oldPath && !/^https?:\/\//i.test(oldPath) && !oldPath.startsWith("assets/")) {
    await deleteMediaFile(oldPath).catch(() => {});
  }
  return uploadMediaFile(file, folder, onProgress);
}

async function deleteMediaFile(path) {
  const { error } = await window.sb.storage.from(window.SUPABASE_CONFIG.storageBucket).remove([path]);
  if (error) throw new Error(error.message);
  await window.sb.from("media").delete().eq("storage_path", path);
}

/* ---------------- MEDIA MANAGER PAGE ---------------- */
async function renderMediaManager(container) {
  container.innerHTML = `
    <div class="panel-head">
      <h2>Media Library</h2>
      <label class="btn btn-primary upload-btn">
        <input type="file" id="libUploadInput" hidden>
        + Upload file
      </label>
    </div>
    <div id="libUploadStatus"></div>
    <div class="media-grid" id="mediaGrid"><div class="loading">Loading media…</div></div>
  `;

  async function load() {
    const grid = document.getElementById("mediaGrid");
    const { data, error } = await window.sb.from("media").select("*").order("uploaded_at", { ascending: false });
    if (error) { grid.innerHTML = `<p class="err">Failed to load media: ${error.message}</p>`; return; }
    if (!data.length) { grid.innerHTML = `<p class="empty">No media uploaded yet. Use "Upload file" above.</p>`; return; }
    grid.innerHTML = "";
    data.forEach(m => {
      const thumb = m.file_type === "image"
        ? `<img src="${m.public_url}" alt="${m.file_name}">`
        : m.file_type === "video"
        ? `<div class="media-icon">▶</div>`
        : `<div class="media-icon">📄</div>`;
      const card = document.createElement("div");
      card.className = "media-card";
      card.innerHTML = `
        ${thumb}
        <div class="media-meta">
          <b title="${m.file_name}">${m.file_name}</b>
          <span>${m.file_type.toUpperCase()} · ${new Date(m.uploaded_at).toLocaleDateString()}</span>
        </div>
        <div class="media-actions">
          <button data-a="copy" title="Copy URL">Copy URL</button>
          <button data-a="delete" title="Delete">Delete</button>
        </div>`;
      card.querySelector('[data-a="copy"]').addEventListener("click", () => {
        navigator.clipboard.writeText(m.public_url);
        toast("URL copied to clipboard.");
      });
      card.querySelector('[data-a="delete"]').addEventListener("click", async () => {
        if (!confirm(`Delete "${m.file_name}" permanently? This cannot be undone.`)) return;
        try { await deleteMediaFile(m.storage_path); toast("Deleted."); load(); }
        catch (e) { toast("Delete failed: " + e.message, true); }
      });
      grid.appendChild(card);
    });
  }

  document.getElementById("libUploadInput").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const statusEl = document.getElementById("libUploadStatus");
    statusEl.innerHTML = `<div class="progress"><div class="progress-bar" style="width:5%"></div></div>`;
    try {
      await uploadMediaFile(file, "library", (pct) => {
        const bar = statusEl.querySelector(".progress-bar");
        if (bar) bar.style.width = pct + "%";
      });
      statusEl.innerHTML = "";
      toast("Uploaded.");
      load();
    } catch (err) {
      statusEl.innerHTML = `<p class="err">${err.message}</p>`;
    }
    e.target.value = "";
  });

  load();
}

/* Small reusable file-field widget used inside crud.js forms for
   image/video/pdf fields. Returns the widget's current stored path
   via a hidden input so crud.js can read it like any other field. */
function buildMediaField(field, currentValue, folder) {
  const wrap = document.createElement("div");
  wrap.className = "media-field";
  const type = field.type; // image | video | pdf
  const previewHtml = currentValue
    ? (type === "image" ? `<img class="mf-preview" src="${resolveMediaUrl(currentValue)}">`
      : type === "video" ? `<video class="mf-preview" src="${resolveMediaUrl(currentValue)}" controls></video>`
      : `<a class="mf-preview mf-pdf" href="${resolveMediaUrl(currentValue)}" target="_blank">View current PDF ↗</a>`)
    : `<div class="mf-empty">No file yet</div>`;

  wrap.innerHTML = `
    <div class="mf-preview-wrap">${previewHtml}</div>
    <input type="hidden" name="${field.name}" value="${currentValue || ""}">
    <label class="btn-sm upload-btn">
      <input type="file" accept="${ACCEPT[type] || "*"}" hidden>
      ${currentValue ? "Replace" : "Upload"} ${type}
    </label>
    ${currentValue ? `<button type="button" class="btn-sm btn-danger-outline mf-remove">Remove</button>` : ""}
    <div class="mf-progress"></div>
  `;

  const hiddenInput = wrap.querySelector(`input[name="${field.name}"]`);
  const fileInput = wrap.querySelector('input[type="file"]');
  const progressEl = wrap.querySelector(".mf-progress");
  const previewWrap = wrap.querySelector(".mf-preview-wrap");

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    progressEl.innerHTML = `<div class="progress"><div class="progress-bar" style="width:5%"></div></div>`;
    try {
      const old = hiddenInput.value;
      const result = await replaceMediaFile(old, file, folder, (pct) => {
        const bar = progressEl.querySelector(".progress-bar");
        if (bar) bar.style.width = pct + "%";
      });
      hiddenInput.value = result.path;
      hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      progressEl.innerHTML = "";
      previewWrap.innerHTML = type === "image" ? `<img class="mf-preview" src="${result.publicUrl}">`
        : type === "video" ? `<video class="mf-preview" src="${result.publicUrl}" controls></video>`
        : `<a class="mf-preview mf-pdf" href="${result.publicUrl}" target="_blank">View current PDF ↗</a>`;
      toast("File uploaded.");
      markDirty();
    } catch (err) {
      progressEl.innerHTML = `<p class="err">${err.message}</p>`;
    }
  });

  const removeBtn = wrap.querySelector(".mf-remove");
  if (removeBtn) removeBtn.addEventListener("click", () => {
    hiddenInput.value = "";
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
    previewWrap.innerHTML = `<div class="mf-empty">No file yet</div>`;
    markDirty();
  });

  return wrap;
}

function resolveMediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("assets/")) return path;
  const { data } = window.sb.storage.from(window.SUPABASE_CONFIG.storageBucket).getPublicUrl(path);
  return data ? data.publicUrl : path;
}
