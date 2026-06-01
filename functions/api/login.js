// POST /api/login  -> prüft das Admin-Passwort gegen das Env-Secret ADMIN_PASSWORD.
// Bei Erfolg verwendet das Frontend das Passwort als Bearer-Token für geschützte Endpunkte.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); }
  catch (e) { body = {}; }
  const expected = context.env.ADMIN_PASSWORD || "admin";
  if (String(body.pass || "") === expected) return json({ ok: true });
  return json({ ok: false }, 401);
}
