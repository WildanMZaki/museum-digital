const form = document.getElementById("enrollForm");
const box = document.getElementById("ticketBox");
const tName = document.getElementById("tName");
const tSchool = document.getElementById("tSchool");
const tCode = document.getElementById("tCode");
const tDate = document.getElementById("tDate");

// Simple localStorage wrapper
const store = {
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  },
  remove: (key) => localStorage.removeItem(key),
};
function ticketDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}
function renderTicket() {
  const t = store.get("ticket");
  if (!t) {
    box.classList.add("d-none");
    return;
  }
  tName.textContent = t.name;
  tSchool.textContent = t.school;
  tCode.textContent = t.code;
  tDate.textContent = ticketDate(t.ts);
  box.classList.remove("d-none");
  box.classList.add("animate__fadeIn");
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const school = document.getElementById("school").value.trim();
  if (!name || !school) return;
  const code = "MD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  store.set("ticket", { name, school, code, ts: Date.now() });
  renderTicket();
  form.reset();
});
renderTicket();
