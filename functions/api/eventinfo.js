// GET /api/eventinfo -> Liste der Event-Infos (öffentlich, z.B. Ort, Anreise, Dresscode)
// PUT /api/eventinfo -> Infos speichern (nur Admin, Bearer-Token)
// KV-Binding: SURVEY_KV   |   Env-Secret: ADMIN_PASSWORD (Default "admin")

const DEFAULT_EVENT_INFO = [
  { id: "info-ort", icon: "\u{1F4CD}", title: "Treffpunkt",
    text: "Der genaue Treffpunkt in Aarau wird rechtzeitig vor dem Event bekannt gegeben." },
  { id: "info-oev", icon: "\u{1F686}", title: "Anreise mit ÖV",
    text: "Aarau ist mit der Bahn sehr gut erreichbar – der Bahnhof liegt nur wenige Gehminuten vom Treffpunkt entfernt." },
  { id: "info-auto", icon: "\u{1F697}", title: "Anreise mit Auto",
    text: "Parkmöglichkeiten sind in der Nähe vorhanden. Bildet doch am besten Fahrgemeinschaften!" },
  { id: "info-dress", icon: "\u{1F455}", title: "Dresscode",
    text: "Locker und bequem – zieht euch dem Wetter und der Aktivität entsprechend an." }
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
  const data = await context.env.SURVEY_KV.get("eventinfo");
  return json(data === null ? DEFAULT_EVENT_INFO : JSON.parse(data));
}

export async function onRequestPut(context) {
  if (!authed(context)) return json({ error: "unauthorized" }, 401);
  let body;
  try { body = await context.request.json(); }
  catch (e) { return json({ error: "bad json" }, 400); }
  if (!Array.isArray(body)) return json({ error: "expected array" }, 400);
  await context.env.SURVEY_KV.put("eventinfo", JSON.stringify(body));
  return json({ ok: true });
}
