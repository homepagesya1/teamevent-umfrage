// GET  /api/questions  -> Liste der Umfrage-Fragen (öffentlich)
// PUT  /api/questions  -> Fragen speichern (nur Admin, Bearer-Token)
// KV-Binding: SURVEY_KV   |   Env-Secret: ADMIN_PASSWORD (Default "admin")

const DEFAULT_QUESTIONS = [
  { id: "seed-abo", type: "single", label: "Welches \u00d6V-Abo besitzt du?",
    help: "Damit wir die Anreise besser planen k\u00f6nnen.",
    options: ["Kein Abo", "Halbtax", "GA"], required: false },
  { id: "seed-allergie", type: "multi", label: "Hast du Allergien oder Unvertr\u00e4glichkeiten?",
    help: "Mehrfachauswahl m\u00f6glich.",
    options: ["Keine", "N\u00fcsse", "Laktose", "Gluten", "Vegetarisch", "Vegan"], required: false },
  { id: "seed-begleit", type: "number", label: "Wie viele Begleitpersonen bringst du mit?",
    help: "", options: [], required: false }
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function authed(context) {
  const auth = context.request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const expected = context.env.ADMIN_PASSWORD || "admin";
  return token === expected;
}

export async function onRequestGet(context) {
  const data = await context.env.SURVEY_KV.get("questions");
  return json(data === null ? DEFAULT_QUESTIONS : JSON.parse(data));
}

export async function onRequestPut(context) {
  if (!authed(context)) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await context.request.json(); }
  catch (e) { return json({ error: "bad json" }, 400); }
  if (!Array.isArray(body)) return json({ error: "expected array" }, 400);
  await context.env.SURVEY_KV.put("questions", JSON.stringify(body));
  return json({ ok: true });
}
