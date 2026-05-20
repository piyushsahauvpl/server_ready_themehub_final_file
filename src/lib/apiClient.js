const API_URL = process.env.REACT_APP_API_URL || 'https://uptulathemehub.com/backend/api';

async function fetchJson(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_URL}/${path}`;
  const token = localStorage.getItem('auth_token');

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  if (body === null) {
    const error = new Error(`Invalid JSON response from ${url}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

export async function getSellerWallet() {
  return fetchJson('seller/wallet.php');
}

export async function postWithdrawRequest(amount, note) {
  return fetchJson('seller/withdraw.php', {
    method: 'POST',
    body: JSON.stringify({ amount, note })
  });
}

export async function getSellerKyc() {
  return fetchJson('seller/kyc.php');
}

export async function postSellerKyc(details) {
  return fetchJson('seller/kyc.php', {
    method: 'POST',
    body: JSON.stringify({ details })
  });
}

export async function getAdminWithdrawRequests() {
  return fetchJson('admin/withdraw-requests.php');
}

export async function postAdminWithdrawAction(action, request_id, reason = '') {
  return fetchJson(`admin/withdraw-requests.php?action=${action}`, {
    method: 'POST',
    body: JSON.stringify({ request_id, reason })
  });
}

export async function getAdminSellerKycRecords() {
  return fetchJson('admin/seller-kyc.php');
}

export async function getAdminSellerKycDetails(sellerId) {
  return fetchJson(`admin/seller-kyc.php?seller_id=${encodeURIComponent(sellerId)}`);
}

export async function postAdminSellerKycAction(action, sellerId, reason = '') {
  return fetchJson(`admin/seller-kyc.php?action=${action}`, {
    method: 'POST',
    body: JSON.stringify({ seller_id: sellerId, reason })
  });
}

export async function getAdminSellerPayoutDetails(sellerId) {
  return fetchJson(`admin/seller-payouts.php?seller_id=${encodeURIComponent(sellerId)}`);
}

export async function postAdminProcessSellerPayout(sellerId) {
  return fetchJson('admin/seller-payouts.php?action=process', {
    method: 'POST',
    body: JSON.stringify({ seller_id: sellerId, method: 'razorpay' })
  });
}

export async function getAdminWallet() {
  return fetchJson('admin/wallet.php');
}

export async function getAdminWalletSummary() {
  return fetchJson('admin/wallet-summary.php');
}

export async function getAdminSellerWallets(search = '', status = '', page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);
  params.append('page', page);
  params.append('limit', limit);
  return fetchJson(`admin/seller-wallets.php?${params}`);
}

export async function getAdminWalletTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.seller_id) params.append('seller_id', filters.seller_id);
  if (filters.type) params.append('type', filters.type);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  return fetchJson(`admin/wallet-transactions.php?${params}`);
}

export async function postAdminApproveSellerPendingEarnings(sellerId) {
  const normalizedSellerId = Number(sellerId);
  if (!Number.isFinite(normalizedSellerId) || normalizedSellerId <= 0) {
    throw new Error('Invalid seller id provided for approval');
  }

  return fetchJson('admin/approve-earnings.php', {
    method: 'POST',
    body: JSON.stringify({ seller_id: normalizedSellerId }),
  });
}

export async function getAdminPayoutHistory(filters = {}) {
  const params = new URLSearchParams();
  if (filters.seller_id) params.append('seller_id', filters.seller_id);
  if (filters.status) params.append('status', filters.status);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  return fetchJson(`admin/payout-history.php?${params}`);
}

export async function getPendingEarnings() {
  return fetchJson('admin/approve-earnings.php');
}

export async function postApproveEarnings(earningIds) {
  return fetchJson('admin/approve-earnings.php', {
    method: 'POST',
    body: JSON.stringify({ earning_ids: earningIds })
  });
}

export default {
  getSellerWallet,
  postWithdrawRequest,
  getSellerKyc,
  postSellerKyc,
  getAdminWithdrawRequests,
  postAdminWithdrawAction,
  getAdminWallet,
  getPendingEarnings,
  postApproveEarnings,
  postAdminApproveSellerPendingEarnings,
  getAdminWalletSummary,
  getAdminSellerWallets,
  getAdminWalletTransactions,
  getAdminPayoutHistory,
  getAdminSellerKycRecords,
  getAdminSellerKycDetails,
  postAdminSellerKycAction,
};
