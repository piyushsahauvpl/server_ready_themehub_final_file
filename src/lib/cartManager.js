const STORAGE_KEY = 'themehub_cart';

const listeners = new Set();

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function write(next) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  listeners.forEach(cb => {
    try { cb(next); } catch (e) { console.error(e); }
  });
}

const cartManager = {
  getCart() { return read(); },
  addItem(item) {
    const cart = read();
    const found = cart.find(c => c.id === item.id);
    let next;
    if (found) next = cart.map(c => c.id === item.id ? { ...c, qty: (c.qty || 1) + 1 } : c);
    else next = [...cart, { ...item, qty: 1 }];
    write(next);
    return next;
  },
  updateQty(id, qty) {
    const cart = read();
    const next = cart.map(i => i.id === id ? { ...i, qty: qty } : i).filter(i => i.qty > 0);
    write(next);
    return next;
  },
  removeItem(id) {
    const next = read().filter(i => i.id !== id);
    write(next);
    return next;
  },
  clear() { write([]); },
  getTotal() { return read().reduce((s,i)=>s + (i.price||0)*(i.qty||1),0); },
  getCount() { return read().reduce((s,i)=>s + (i.qty||1),0); },
  subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
};

export default cartManager;
