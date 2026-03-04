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


const snippetOf = (value) => String(value || '').trim().slice(0, 180);

const isGoogleSignInHtml = (value) => {
  const text = String(value || '').toLowerCase();
  return (
    text.includes('<!doctype html') &&
    (text.includes('accounts.google.com') || text.includes('/v3/signin/'))
  );
};

const tryParse = (text) => {
  try {
    return JSON.parse(text);
  } catch (_error) {
    return undefined;
  }
};

const tryParseObjectLiteral = (text) => {
  const normalizedKeys = text.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
  const normalizedQuotes = normalizedKeys.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  return tryParse(normalizedQuotes);
};

const withAction = (url, action) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}action=${encodeURIComponent(action)}`;
};

const parseJsonPayload = (raw, finalUrl) => {
  const trimmed = String(raw || '').trim();

  if (!trimmed) {
    throw new Error('Empty response from Google Apps Script.');
  }

  if (isGoogleSignInHtml(trimmed)) {
    throw new Error(
      `Google returned a sign-in HTML page instead of JSON. Use a deployed Web App /exec URL with access set to "Anyone with the link". Upstream URL: ${finalUrl || 'unknown'}`
    );
  }

  const direct = tryParse(trimmed);
  if (direct !== undefined) {
    return direct;
  }

  const starts = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((idx) => idx >= 0);
  if (starts.length > 0) {
    const start = Math.min(...starts);
    const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));

    if (end > start) {
      const candidate = trimmed.slice(start, end + 1);
      const parsedCandidate = tryParse(candidate);
      if (parsedCandidate !== undefined) {
        return parsedCandidate;
      }

      if (candidate.startsWith('{')) {
        const parsedLiteral = tryParseObjectLiteral(candidate);
        if (parsedLiteral !== undefined) {
          return parsedLiteral;
        }
      }
    }
  }

  throw new Error(
    `Google Apps Script returned non-JSON content. Snippet: ${snippetOf(trimmed)}`
  );
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

  const target = withAction(sheetsUrl.replace(/\/+$/, ''), action);

  try {
    const response = await fetch(target, {
      method: event.httpMethod,
      headers: event.httpMethod === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : undefined,
      body: event.httpMethod === 'POST' ? event.body : undefined
    });

    const raw = await response.text();
    const data = parseJsonPayload(raw, response.url);

    return asJson(response.status, data);
  } catch (error) {
    return asJson(502, {
      ok: false,
      error: error instanceof Error ? error.message : 'Proxy request failed'
    });
  }
};
