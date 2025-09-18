// netlify/functions/call.js
const { api: zadarmaApi } = require("@trieb.work/zadarma");

const isE164 = (n) => /^\+\d{8,15}$/.test(n);
const isSipExt = (n) => /^\d{2,6}$/.test(n); // 100, 101, ecc.

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Body JSON sicuro
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (_) {}
    const to = (body.phone || "").trim();

    const from = (process.env.STUDIO_FROM || "100").trim();              // interno SIP (100)
    const callerId = (process.env.CALLER_ID_FROM || "+39800940533").trim(); // numero da mostrare al paziente

    // Validazioni basi
    if (!isSipExt(from))   return res400("STUDIO_FROM deve essere un interno SIP (es. 100)");
    if (!isE164(to))       return res400("Numero paziente non valido (+39...)");
    if (!isE164(callerId)) return res400("CALLER_ID_FROM non valido (+39...)");

    const params = { from, to, caller_id: callerId };

    // Chiamata Zadarma (firma gestita dalla libreria)
    const result = await zadarmaApi({
      api_method: "/v1/request/callback/",
      api_user_key: process.env.ZADARMA_USER_KEY,
      api_secret_key: process.env.ZADARMA_SECRET_KEY,
      params
    });

    return json200({ ok: true, zadarma: result, debug: params });
  } catch (err) {
    return json500(err?.message || "Errore");
  }
};

// Helpers di risposta
function json200(obj) { return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) }; }
function json500(msg) { return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok:false, error: msg }) }; }
function res400(msg)   { return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok:false, error: msg }) }; }
