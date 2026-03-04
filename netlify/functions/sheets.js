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

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      },
      body: raw
    };
  } catch (error) {
    return asJson(502, {
      ok: false,
      error: error instanceof Error ? error.message : 'Proxy request failed'
    });
  }
};
