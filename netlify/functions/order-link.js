const crypto = require('crypto');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'glow-aml-store';
const DATABASE_ID = '(default)';
const ORDER_STATUSES = ['Nouvelle', 'Confirmee', 'Livree'];

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

const base64url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const getAccessToken = async () => {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Firebase service account env vars are missing');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));
  const unsignedToken = `${header}.${claim}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey, 'base64url');
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!response.ok) {
    throw new Error('Could not authenticate with Firebase');
  }

  const data = await response.json();
  return data.access_token;
};

const firestoreValue = (value) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  return { stringValue: String(value || '') };
};

const readValue = (field) => {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.arrayValue !== undefined) return (field.arrayValue.values || []).map(readValue);
  if (field.mapValue !== undefined) {
    return Object.fromEntries(
      Object.entries(field.mapValue.fields || {}).map(([key, nestedField]) => [key, readValue(nestedField)])
    );
  }

  return null;
};

const fieldsToObject = (fields = {}) =>
  Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, readValue(field)]));

const firestoreRequest = async (path, accessToken, options = {}) => {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Firestore request failed');
  }

  return response.json();
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const assertValidLink = (order, token) => {
  const savedHash = order.orderAccessTokenHash;
  const providedHash = hashToken(String(token || ''));

  if (!savedHash || savedHash.length !== providedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(savedHash), Buffer.from(providedHash));
};

const loadOrder = async (orderId, token) => {
  if (!/^[A-Za-z0-9_-]+$/.test(orderId || '')) {
    return null;
  }

  const accessToken = await getAccessToken();
  const document = await firestoreRequest(`/orders/${orderId}`, accessToken);
  const order = fieldsToObject(document.fields);

  if (!assertValidLink(order, token)) {
    return null;
  }

  delete order.orderAccessTokenHash;

  return { accessToken, order };
};

exports.handler = async (event) => {
  const query = event.queryStringParameters || {};
  const orderId = query.order || query.orderId;
  const token = query.token;

  try {
    if (event.httpMethod === 'GET') {
      const loaded = await loadOrder(orderId, token);

      if (!loaded) {
        return json(403, { error: 'Lien invalide' });
      }

      return json(200, { order: { id: orderId, ...loaded.order } });
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const status = String(payload.status || '');

      if (!ORDER_STATUSES.includes(status)) {
        return json(400, { error: 'Statut invalide' });
      }

      const loaded = await loadOrder(orderId, token);

      if (!loaded) {
        return json(403, { error: 'Lien invalide' });
      }

      await firestoreRequest(`/orders/${orderId}?updateMask.fieldPaths=status`, loaded.accessToken, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: {
            status: firestoreValue(status)
          }
        })
      });

      return json(200, { ok: true, status });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return json(500, { error: 'Erreur serveur' });
  }
};
