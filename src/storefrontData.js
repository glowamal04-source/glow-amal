import * as firestore from 'firebase/firestore';

const preview = process.env.REACT_APP_LOCAL_PREVIEW === 'true';
export const collection = (db, name) => preview ? { name } : firestore.collection(db, name);
export const doc = (db, name, id) => preview ? { name, id } : firestore.doc(db, name, id);
export const orderBy = (field, direction) => preview ? { field, direction } : firestore.orderBy(field, direction);
export const query = (ref, ...constraints) => preview ? { ...ref, constraints } : firestore.query(ref, ...constraints);
const snapshot = item => ({ id: item.id, data: () => item.data, exists: () => true });
async function read(ref) {
  const response = await fetch('/api/preview/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ref) });
  if (!response.ok) throw new Error('Serveur de prévisualisation indisponible.');
  return response.json();
}
export const getDocs = async ref => preview ? { docs: (await read(ref)).documents.map(snapshot) } : firestore.getDocs(ref);
export const getDoc = async ref => {
  if (!preview) return firestore.getDoc(ref);
  const result = await read(ref);
  return result.found ? snapshot(result.document) : { exists: () => false };
};
