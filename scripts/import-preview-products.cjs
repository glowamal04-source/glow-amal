// Read the public catalog and copy it into the isolated local preview.
async function main() {
  const base = 'https://firestore.googleapis.com/v1/projects/glow-aml-store/databases/(default)/documents/products';
  const login = await fetch('http://127.0.0.1:3101/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'Glow.Admin_1' }) });
  if (!login.ok) throw new Error('Le serveur de test local est indisponible.');
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Session locale indisponible.');
  const request = async body => {
    const response = await fetch('http://127.0.0.1:3101/.netlify/functions/admin-api', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error('Écriture locale impossible.');
    return response.json();
  };
  const current = await request({ action: 'list', collection: 'products' });
  const existing = new Set(current.documents.map(d => d.id));
  const decode = value => {
    if ('stringValue' in value) return value.stringValue;
    if ('timestampValue' in value) return value.timestampValue;
    if ('integerValue' in value) return Number(value.integerValue);
    if ('doubleValue' in value) return value.doubleValue;
    if ('booleanValue' in value) return value.booleanValue;
    if ('arrayValue' in value) return (value.arrayValue.values || []).map(decode);
    if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([key, val]) => [key, decode(val)]));
    return null;
  };
  let pageToken = '', imported = 0, packs = 0;
  do {
    const url = `${base}?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Lecture du catalogue impossible (${response.status}).`);
    const page = await response.json();
    for (const document of page.documents || []) {
      const id = document.name.split('/').pop();
      const product = Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, decode(value)]));
      if (existing.has(id)) continue;
      await request({ action: 'set', collection: 'products', id, data: product });
      imported++;
      if (product.type === 'pack') packs++;
    }
    pageToken = page.nextPageToken || '';
  } while (pageToken);
  console.log(`Importés localement : ${imported} articles, dont ${packs} packs. Aucun changement sur le site.`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
