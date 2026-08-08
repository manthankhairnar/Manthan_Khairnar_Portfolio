/* Shared small utilities used across admin modules. */
let __dirty = false;
let __lastSaved = null;

function markDirty() {
  __dirty = true;
  const el = document.getElementById("unsavedFlag");
  if (el) el.style.display = "inline-flex";
}
function clearDirty() {
  __dirty = false;
  const el = document.getElementById("unsavedFlag");
  if (el) el.style.display = "none";
}
function noteSaved() {
  __lastSaved = new Date();
  const el = document.getElementById("lastSavedLabel");
  if (el) el.textContent = "Last saved " + __lastSaved.toLocaleTimeString();
  clearDirty();
}

window.addEventListener("beforeunload", (e) => {
  if (__dirty) { e.preventDefault(); e.returnValue = ""; }
});

let __toastTimer;
function toast(msg, isError) {
  let t = document.getElementById("adminToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "adminToast";
    t.className = "admin-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.toggle("err", !!isError);
  t.classList.add("show");
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => t.classList.remove("show"), 3400);
}

function escapeHtml(s) {
  return (s == null ? "" : String(s)).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
