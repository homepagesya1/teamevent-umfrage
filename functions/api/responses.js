// GET    /api/responses        -> alle Antworten (nur Admin)
// POST   /api/responses        -> Antwort speichern/aktualisieren (öffentlich)
// DELETE /api/responses?id=xxx -> Antwort löschen (nur Admin)
// Jede Antwort liegt als eigener KV-Key "response:<id>" (keine Race-Conditions beim Absenden).

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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function onRequestGet(context) {
  if (!authed(context)) return json({ error: "unauthorized" }, 401);
  const kv = context.env.SURVEY_KV;
  const list = await kv.list({ prefix: "response:" });
  const items = [];
  for (const k of list.keys) {
    const v = await kv.get(k.name);
    if (v) { try { items.push(JSON.parse(v)); } catch (e) {} }
  }
  items.sort((a, b) => b.ts - a.ts);
  return json(items);
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); }
  catch (e) { return json({ error: "bad json" }, 400); }

  const name = String(body.name || "").trim().slice(0, 200);
  if (!name) return json({ error: "name required" }, 400);
  if (body.attending !== "yes" && body.attending !== "no")
    return json({ error: "attending invalid" }, 400);

  const id = String(body.id || "").slice(0, 40) || uid();
  const record = {
    id,
    name,
    attending: body.attending,
    comment: String(body.comment || "").slice(0, 2000),
    answers: (body.answers && typeof body.answers === "object") ? body.answers : {},
    ts: Date.now()
  };
  await context.env.SURVEY_KV.put("response:" + id, JSON.stringify(record));
  return json(record);
}

export async function onRequestDelete(context) {
  if (!authed(context)) return json({ error: "unauthorized" }, 401);
  const id = new URL(context.request.url).searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);
  await context.env.SURVEY_KV.delete("response:" + id);
  return json({ ok: true });
}
