const listeners = new Set();
let current = null;

const productStore = {
  set(product) {
    current = product;
    listeners.forEach(cb => { try { cb(current); } catch(e){} });
  },
  get() { return current; },
  subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
};

export default productStore;
