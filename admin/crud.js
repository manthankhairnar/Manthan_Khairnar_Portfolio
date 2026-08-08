/* =====================================================================
   CRUD — generic engine that renders Add/Edit/Save/Cancel/Delete/
   Reorder UI for any table described in table-config.js.
   ===================================================================== */

function buildFieldInput(field, value) {
  const val = value == null ? "" : value;
  if (field.type === "textarea") {
    const t = document.createElement("textarea");
    t.name = field.name; t.rows = 4; t.value = val; t.required = !!field.required;
    return t;
  }
  if (field.type === "select") {
    const s = document.createElement("select");
    s.name = field.name;
    field.options.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o; if (o === val) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  }
  if (field.type === "status") {
    const s = document.createElement("select");
    s.name = field.name;
    ["published", "draft"].forEach(o => {
      const opt = document.createElement("option");
      opt.value = o; opt.textContent = o === "published" ? "Published" : "Draft";
      if (o === (val || "published")) opt.selected = true;
      s.appendChild(opt);
    });
    return s;
  }
  if (field.type === "color") {
    const wrap = document.createElement("div");
    wrap.className = "color-field";
    wrap.innerHTML = `<input type="color" value="${val || "#2246E8"}"><input type="text" name="${field.name}" value="${escapeHtml(val)}" placeholder="#RRGGBB">`;
    const colorPicker = wrap.querySelector('input[type="color"]');
    const textInput = wrap.querySelector('input[type="text"]');
    colorPicker.addEventListener("input", () => { textInput.value = colorPicker.value; textInput.dispatchEvent(new Event("input", { bubbles: true })); });
    return wrap;
  }
  if (field.type === "number") {
    const i = document.createElement("input");
    i.type = "number"; i.name = field.name; i.value = val; i.required = !!field.required;
    return i;
  }
  if (["image", "video", "pdf"].includes(field.type)) {
    return buildMediaField(field, val, field.name);
  }
  const i = document.createElement("input");
  i.type = "text"; i.name = field.name; i.value = val; i.required = !!field.required;
  return i;
}

function collectFormData(form, fields) {
  const out = {};
  fields.forEach(f => {
    if (f.type === "color") {
      out[f.name] = form.querySelector(`[name="${f.name}"]`).value;
    } else if (f.type === "number") {
      const raw = form.querySelector(`[name="${f.name}"]`).value;
      out[f.name] = raw === "" ? null : Number(raw);
    } else {
      const elm = form.querySelector(`[name="${f.name}"]`);
      out[f.name] = elm ? elm.value : null;
    }
  });
  return out;
}

function buildForm(config, record, onSubmit, onCancel) {
  const form = document.createElement("form");
  form.className = "cms-form";
  config.fields.forEach(f => {
    const row = document.createElement("div");
    row.className = "form-row";
    const label = document.createElement("label");
    label.textContent = f.label + (f.required ? " *" : "");
    row.appendChild(label);
    row.appendChild(buildFieldInput(f, record ? record[f.name] : ""));
    form.appendChild(row);
  });
  form.addEventListener("input", markDirty);

  const actions = document.createElement("div");
  actions.className = "form-actions";
  actions.innerHTML = `<button type="submit" class="btn btn-primary">Save</button><button type="button" class="btn btn-outline cancel-btn">Cancel</button>`;
  form.appendChild(actions);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectFormData(form, config.fields);
    const missing = config.fields.filter(f => f.required && !data[f.name]);
    if (missing.length) { toast("Please fill: " + missing.map(f => f.label).join(", "), true); return; }
    await onSubmit(data);
  });
  form.querySelector(".cancel-btn").addEventListener("click", onCancel);
  return form;
}

/* ---------------- SINGLETON PANEL ---------------- */
async function renderSingletonPanel(tableKey, container) {
  const config = window.TABLES[tableKey];
  container.innerHTML = `<div class="panel-head"><h2>${config.label}</h2></div><div id="singletonSlot" class="loading">Loading…</div>`;
  const slot = document.getElementById("singletonSlot");

  const { data, error } = await window.sb.from(tableKey).select("*").eq("id", 1).maybeSingle();
  if (error) { slot.innerHTML = `<p class="err">Failed to load: ${error.message}</p>`; return; }

  slot.innerHTML = "";
  const form = buildForm(config, data || {}, async (values) => {
    const { error: upErr } = await window.sb.from(tableKey).update(values).eq("id", 1);
    if (upErr) { toast("Save failed: " + upErr.message, true); return; }
    noteSaved();
    toast(config.label + " saved.");
  }, () => renderSingletonPanel(tableKey, container));
  slot.appendChild(form);
}

/* ---------------- REPEATABLE LIST PANEL ---------------- */
async function renderListPanel(tableKey, container) {
  const config = window.TABLES[tableKey];
  container.innerHTML = `
    <div class="panel-head">
      <h2>${config.label}</h2>
      <button class="btn btn-primary" id="addNewBtn">+ Add ${config.label.replace(/s$/, "")}</button>
    </div>
    <div id="listSlot" class="loading">Loading…</div>
  `;

  const { data, error } = await window.sb.from(tableKey).select("*").order("sort_order", { ascending: true });
  const slot = document.getElementById("listSlot");
  if (error) { slot.innerHTML = `<p class="err">Failed to load: ${error.message}</p>`; return; }

  let rows = data || [];

  function draw() {
    slot.innerHTML = "";
    if (!rows.length) { slot.innerHTML = `<p class="empty">Nothing here yet — click "+ Add" to create the first entry.</p>`; return; }
    rows.forEach((row, idx) => {
      const item = document.createElement("div");
      item.className = "list-item";
      const summary = (config.listCols || []).map(c => escapeHtml(row[c] ?? "")).filter(Boolean).join(" · ");
      item.innerHTML = `
        <div class="list-item-head">
          <div class="reorder-btns">
            <button data-a="up" ${idx === 0 ? "disabled" : ""} title="Move up">▲</button>
            <button data-a="down" ${idx === rows.length - 1 ? "disabled" : ""} title="Move down">▼</button>
          </div>
          <div class="list-item-summary">
            <b>${summary || "(untitled)"}</b>
            <span class="status-pill ${row.status || "published"}">${row.status || "published"}</span>
          </div>
          <div class="list-item-actions">
            <button data-a="edit" class="btn-sm">Edit</button>
            <button data-a="delete" class="btn-sm btn-danger-outline">Delete</button>
          </div>
        </div>
        <div class="list-item-form-slot"></div>
      `;
      item.querySelector('[data-a="edit"]').addEventListener("click", () => {
        const slotEl = item.querySelector(".list-item-form-slot");
        if (slotEl.childElementCount) { slotEl.innerHTML = ""; return; }
        const form = buildForm(config, row, async (values) => {
          const { error: upErr } = await window.sb.from(tableKey).update(values).eq("id", row.id);
          if (upErr) { toast("Save failed: " + upErr.message, true); return; }
          Object.assign(row, values);
          noteSaved(); toast("Saved."); draw();
        }, () => { slotEl.innerHTML = ""; });
        slotEl.innerHTML = ""; slotEl.appendChild(form);
      });
      item.querySelector('[data-a="delete"]').addEventListener("click", async () => {
        if (!confirm(`Delete "${summary || "this entry"}"? This cannot be undone.`)) return;
        const { error: delErr } = await window.sb.from(tableKey).delete().eq("id", row.id);
        if (delErr) { toast("Delete failed: " + delErr.message, true); return; }
        rows = rows.filter(r => r.id !== row.id);
        toast("Deleted."); draw();
      });
      item.querySelector('[data-a="up"]')?.addEventListener("click", () => swapOrder(idx, idx - 1));
      item.querySelector('[data-a="down"]')?.addEventListener("click", () => swapOrder(idx, idx + 1));
      slot.appendChild(item);
    });
  }

  async function swapOrder(i, j) {
    if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j];
    const aOrder = a.sort_order, bOrder = b.sort_order;
    const { error: e1 } = await window.sb.from(tableKey).update({ sort_order: bOrder }).eq("id", a.id);
    const { error: e2 } = await window.sb.from(tableKey).update({ sort_order: aOrder }).eq("id", b.id);
    if (e1 || e2) { toast("Reorder failed.", true); return; }
    a.sort_order = bOrder; b.sort_order = aOrder;
    rows.sort((x, y) => x.sort_order - y.sort_order);
    draw();
  }

  document.getElementById("addNewBtn").addEventListener("click", () => {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order || 0), 0);
    const blank = {};
    config.fields.forEach(f => blank[f.name] = f.type === "status" ? "published" : "");
    const wrap = document.createElement("div");
    wrap.className = "list-item new-item";
    wrap.innerHTML = `<div class="list-item-head"><b>New ${config.label.replace(/s$/, "")}</b></div><div class="list-item-form-slot"></div>`;
    const formSlot = wrap.querySelector(".list-item-form-slot");
    const form = buildForm(config, blank, async (values) => {
      values.sort_order = maxOrder + 1;
      const { data: inserted, error: insErr } = await window.sb.from(tableKey).insert(values).select().single();
      if (insErr) { toast("Create failed: " + insErr.message, true); return; }
      rows.push(inserted);
      noteSaved(); toast("Created."); wrap.remove(); draw();
    }, () => wrap.remove());
    formSlot.appendChild(form);
    slot.prepend(wrap);
  });

  draw();
}

/* ---------------- DISPATCH ---------------- */
async function renderTablePanel(tableKey, container) {
  const config = window.TABLES[tableKey];
  if (!config) { container.innerHTML = `<p class="err">Unknown section.</p>`; return; }
  if (config.singleton) return renderSingletonPanel(tableKey, container);
  return renderListPanel(tableKey, container);
}
