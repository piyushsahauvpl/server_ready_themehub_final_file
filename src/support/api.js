const API_BASE = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

const defaultFetch = (url, options = {}) =>
  fetch(url, {
    credentials: "include",
    ...options,
  });

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error('Invalid JSON response from server');
  }
  if (!res.ok) {
    const msg = (data && data.message) ? data.message : `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function createTicket(payload) {
  const res = await defaultFetch(`${API_BASE}/tickets.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function listMyTickets() {
  const res = await defaultFetch(`${API_BASE}/tickets.php?my=1`);
  return handleResponse(res);
}

export async function getTicket(id) {
  const res = await defaultFetch(`${API_BASE}/tickets.php?id=${id}`);
  return handleResponse(res);
}

export async function listMessages(ticketId) {
  const res = await defaultFetch(`${API_BASE}/messages.php?ticket_id=${ticketId}`);
  return handleResponse(res);
}

export async function sendMessage({ ticketId, message, file }) {
  const form = new FormData();
  form.append("ticket_id", ticketId);
  form.append("message", message);
  if (file) form.append("attachment", file);
  const res = await defaultFetch(`${API_BASE}/messages.php`, {
    method: "POST",
    body: form,
  });
  return handleResponse(res);
}
