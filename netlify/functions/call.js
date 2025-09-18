// netlify/functions/call.js
const { api: zadarmaApi } = require("@trieb.work/zadarma");

const isE164 = (n) => /^\+\d{8,15}$/.test(n);
const isSipExt = (n) => /^\d{2,6}$/.test(n); // 100, 101, ecc.

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { phone } = JSON.parse(event.body || "{}");
    if (!phone) return { statusCode: 400, body: JSON.stringify({ ok:false, error: "phone mancante" }) };

    const from = (process.env.STUDIO_FROM || "100").trim();            // interno 100
    const to = (phone || "").trim();                                   // paziente
    const callerId = (process.env.CALLER_ID_FROM || "+39800940533").trim();

    if (!(isSipExt(from))) return { statusCode: 400, body: JSON.stringify({ ok:false, error: "STUDIO_FROM deve essere l'interno SIP (es. 100)" }) };
    if (!isE164(to))       return { statusCode: 400, body: JSON.stringify({ ok:false, error: "Numero paziente non valido (+39...)" }) };
    if (!isE164(callerId)) return { statusCode: 400, body: JSON.stringify({ ok:false, error: "CALLER_ID_FROM non valido (+39...)" }) };

    const params = { from, to, caller_id: callerId };

    // La libreria calcola firma e header corretti
    const result = await zadarmaApi({
      api_method: "/v1/request/callback/",
      api_user_key: process.env.ZADARMA_USER_KEY,
      api_secret_key: process.env.ZADARMA_SECRET_KEY,
      params
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, zadarma: result, debug: params })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: err?.message || "Errore" }) };
  }
};ON.stringify({ error: err.message }) };
  }
};
