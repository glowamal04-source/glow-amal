const key = 'glow_admin_session';
export const hasAdminSession = () => Number(localStorage.getItem(key)) > Date.now();
export async function adminRequest(data) {
  const response = await fetch('/.netlify/functions/admin-api', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 401) { localStorage.removeItem(key); window.location.assign('/admin-login'); } throw new Error(result.error || 'Erreur de connexion au serveur.'); }
  return result;
}
export async function adminLogin(password) { const response = await fetch('/api/admin-login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(response.status === 429 ? 'Trop de tentatives. Réessayez dans quelques minutes.' : result.error || 'Erreur de connexion au serveur.'); localStorage.setItem(key, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); }
export const collection = (_, name) => ({ name });
export const doc = (_, name, id) => ({ name, id });
export const query = (ref, order) => ({ ...ref, order });
export const orderBy = (field, direction) => ({ field, direction });
export const serverTimestamp = () => ({ __serverTimestamp: true });
const wrap = d => ({ id: d.id, data: () => d.data, exists: () => true });
export async function getDocs(ref) { const result = await adminRequest({ action: 'list', collection: ref.name }); const docs = result.documents.map(wrap); if (ref.order) docs.sort((a, b) => String(b.data()[ref.order.field] || '').localeCompare(String(a.data()[ref.order.field] || '')) * (ref.order.direction === 'asc' ? -1 : 1)); return { docs }; }
export async function getDoc(ref) { const result = await adminRequest({ action: 'get', collection: ref.name, id: ref.id }); return result.found ? wrap(result.document) : { exists: () => false }; }
export const addDoc = (ref, data) => adminRequest({ action: 'add', collection: ref.name, data });
export const updateDoc = (ref, data) => adminRequest({ action: 'update', collection: ref.name, id: ref.id, data });
export const setDoc = (ref, data, options) => adminRequest({ action: 'set', collection: ref.name, id: ref.id, data, merge: !!options?.merge });
export const deleteDoc = ref => adminRequest({ action: 'delete', collection: ref.name, id: ref.id });
