const asJson = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  },
  body: JSON.stringify(body)
});


const parseJsonPayload = (raw) => {
  const trimmed = String(raw || '').trim();

  if (!trimmed) {
    throw new Error('Empty response from Google Apps Script.');
  }

  try {
    return JSON.parse(trimmed);
  } catch (_error) {
    const starts = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((idx) => idx >= 0);
    if (starts.length === 0) {
      throw new Error('Google Apps Script returned HTML instead of JSON. Check Web App access + URL.');
    }

    const start = Math.min(...starts);
    const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));

    if (end <= start) {
      throw new Error('Google Apps Script response contains malformed JSON.');
    }

    return JSON.parse(trimmed.slice(start, end + 1));
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  const sheetsUrl = process.env.SHEETS_API_URL;
  if (!sheetsUrl) {
    return asJson(500, { ok: false, error: 'Missing SHEETS_API_URL env var in Netlify.' });
  }

  const action = event.queryStringParameters?.action;
  if (action !== 'items' && action !== 'update') {
    return asJson(400, { ok: false, error: 'Invalid action. Use items or update.' });
  }

  const target = `${sheetsUrl.replace(/\/+$/, '')}?action=${action}`;

  try {
    const response = await fetch(target, {
      method: event.httpMethod,
      headers: event.httpMethod === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
      body: event.httpMethod === 'POST' ? event.body : undefined
    });

    const raw = await response.text();
    const data = parseJsonPayload(raw);

    return asJson(response.status, data);
  } catch (error) {
    return asJson(502, {
      ok: false,
      error: error instanceof Error ? error.message : 'Proxy request failed'
    });
  }
};
