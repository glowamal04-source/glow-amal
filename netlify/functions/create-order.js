const crypto = require('crypto');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'glow-aml-store';
const DATABASE_ID = '(default)';
const SHIPPING_PRICE = 40;

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

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(firestoreValue) } };
  }

  if (value && typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, firestoreValue(nestedValue)])
        )
      }
    };
  }

  return { stringValue: String(value || '') };
};

const firestoreFields = (data) =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, firestoreValue(value)]));

const readNumber = (field) => {
  if (!field) return 0;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  return 0;
};

const readString = (field) => field?.stringValue || '';

const sanitizeText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

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

const sendNotificationEmail = async ({ orderId, order, items, orderAccessToken }) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.FROM_EMAIL || 'Glow by Amal <onboarding@resend.dev>';
  const siteUrl = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');

  if (!resendApiKey || !adminEmail || !siteUrl) {
    return;
  }

  const orderUrl = `${siteUrl}/commande?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(orderAccessToken)}`;
  const itemLines = items
    .map((item) => `<li>${escapeHtml(item.title)} x ${item.quantity}</li>`)
    .join('');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: adminEmail,
      subject: `Nouvelle commande Glow by Amal - ${order.total.toFixed(2)} DH`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#3d2c28">
          <h2>Nouvelle commande</h2>
          <p><strong>Cliente:</strong> ${escapeHtml(order.customerName)}</p>
          <p><strong>Téléphone:</strong> ${escapeHtml(order.phone)}</p>
          <p><strong>Ville:</strong> ${escapeHtml(order.city)}</p>
          <p><strong>Total:</strong> ${order.total.toFixed(2)} DH</p>
          <ul>${itemLines}</ul>
          <p>
            <a href="${orderUrl}" style="display:inline-block;background:#b47c6a;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">
              Ouvrir la commande
            </a>
          </p>
        </div>
      `
    })
  });

  if (!response.ok) {
    console.error('Resend error:', await response.text());
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { error: 'Invalid JSON' });
  }

  const requestedItems = Array.isArray(payload.items) ? payload.items : [];

  if (!requestedItems.length) {
    return json(400, { error: 'Panier vide' });
  }

  const safeItems = requestedItems.slice(0, 30).map((item) => ({
    id: sanitizeText(item.id, 120),
    quantity: Math.max(1, Math.min(Number(item.quantity) || 1, 99)),
    selectedPack: sanitizeText(item.selectedPack, 120)
  }));

  if (safeItems.some((item) => !/^[A-Za-z0-9_-]+$/.test(item.id))) {
    return json(400, { error: 'Article invalide' });
  }

  const accessToken = await getAccessToken();
  const transactionResponse = await firestoreRequest(':beginTransaction', accessToken, {
    method: 'POST',
    body: JSON.stringify({})
  });
  const transaction = transactionResponse.transaction;
  const productPaths = safeItems.map(
    (item) => `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/products/${item.id}`
  );

  const productResponse = await firestoreRequest(':batchGet', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      documents: productPaths,
      transaction
    })
  });

  const productsById = new Map();

  for (const productResult of productResponse) {
    if (!productResult.found) continue;

    const id = productResult.found.name.split('/').pop();
    productsById.set(id, productResult.found);
  }

  const orderItems = [];
  let subtotal = 0;

  for (const item of safeItems) {
    const product = productsById.get(item.id);

    if (!product) {
      return json(404, { error: 'Produit introuvable' });
    }

    const productData = product.fields || {};
    const stock = readNumber(productData.stock);
    const price = readNumber(productData.price);
    const title = readString(productData.title);

    if (item.quantity > stock) {
      return json(409, { error: `Stock insuffisant pour "${title}". Stock disponible: ${stock}` });
    }

    subtotal += price * item.quantity;
    orderItems.push({
      id: item.id,
      title,
      quantity: item.quantity,
      price,
      selectedPack: item.selectedPack
    });
  }

  const shipping = orderItems.length ? SHIPPING_PRICE : 0;
  const total = subtotal + shipping;
  const orderId = crypto.randomUUID();
  const orderAccessToken = crypto.randomBytes(32).toString('base64url');
  const order = {
    customerName: sanitizeText(payload.customerName, 120),
    phone: sanitizeText(payload.phone, 60),
    city: sanitizeText(payload.city, 80),
    address: sanitizeText(payload.address, 240),
    items: orderItems,
    subtotal,
    shipping,
    total,
    orderAccessTokenHash: hashToken(orderAccessToken),
    status: 'Nouvelle'
  };

  if (!order.customerName || !order.phone || !order.city || !order.address) {
    return json(400, { error: 'Informations client manquantes' });
  }

  const writes = [
    ...orderItems.map((item) => {
      const product = productsById.get(item.id);
      const stock = readNumber(product.fields?.stock);

      return {
        update: {
          name: product.name,
          fields: {
            stock: firestoreValue(stock - item.quantity)
          }
        },
        updateMask: {
          fieldPaths: ['stock']
        }
      };
    }),
    {
      update: {
        name: `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/orders/${orderId}`,
        fields: {
          ...firestoreFields(order),
          createdAt: { timestampValue: new Date().toISOString() }
        }
      },
      currentDocument: {
        exists: false
      }
    }
  ];

  await firestoreRequest(':commit', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      writes,
      transaction
    })
  });

  await sendNotificationEmail({ orderId, order, items: orderItems, orderAccessToken });

  return json(200, { ok: true, orderId });
};
