// API Configuration
const API_BASE_URL = 'http://localhost:3001';

// DOM Elements
const authStatus = document.getElementById('auth-status');
const createSection = document.getElementById('create-section');
const loginSection = document.getElementById('login-section');
const resultSection = document.getElementById('result-section');
const resultTitle = document.getElementById('result-title');
const resultContent = document.getElementById('result-content');
const apiLog = document.getElementById('api-log');

const createForm = document.getElementById('create-form');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const refreshBalanceBtn = document.getElementById('refresh-balance-btn');
const copyBtn = document.getElementById('copy-btn');

const currentPublicKey = document.getElementById('current-publickey');
const balanceAmount = document.getElementById('balance-amount');

// State
let isAuthenticated = false;
let userPublicKey = null;

// Utility Functions
function log(method, url, status, data) {
  const timestamp = new Date().toLocaleTimeString();
  const statusClass = status >= 200 && status < 300 ? 'log-status-success' : 'log-status-error';
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `
    <div class="log-timestamp">${timestamp}</div>
    <div><span class="log-method">${method}</span> <span class="log-url">${url}</span></div>
    <div class="${statusClass}">Status: ${status}</div>
    <div>${JSON.stringify(data, null, 2)}</div>
  `;
  
  apiLog.insertBefore(entry, apiLog.firstChild);
}

function showResult(title, data) {
  resultTitle.textContent = title;
  resultContent.textContent = JSON.stringify(data, null, 2);
  resultSection.classList.remove('hidden');
}

function formatBalance(balance) {
  return parseFloat(balance).toFixed(4);
}

function shortenPublicKey(key) {
  if (!key || key.length < 10) return key;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

// API Functions
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for cookies
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    log(method, endpoint, response.status, data);
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    log(method, endpoint, 0, { error: error.message });
    return { success: false, status: 0, data: { error: error.message } };
  }
}

// Authentication Functions
async function checkAuth() {
  const result = await apiRequest('/api/wallet/verify');
  
  if (result.success && result.data.authenticated) {
    isAuthenticated = true;
    userPublicKey = result.data.publicKey;
    updateUI();
    await loadBalance();
  }
}

async function createWallet(password) {
  const result = await apiRequest('/api/wallet/create', 'POST', { password });
  
  if (result.success && result.data.success) {
    showResult('Wallet Created Successfully', result.data);
    
    // Auto-login after creating wallet
    setTimeout(() => {
      document.getElementById('login-publickey').value = result.data.publicKey;
      document.getElementById('login-password').value = password;
    }, 100);
  } else {
    showResult('Wallet Creation Failed', result.data);
  }
}

async function authenticate(publicKey, password) {
  const result = await apiRequest('/api/wallet/authenticate', 'POST', {
    publicKey,
    password
  });
  
  if (result.success && result.data.success) {
    isAuthenticated = true;
    userPublicKey = publicKey;
    showResult('Login Successful', result.data);
    updateUI();
    await loadBalance();
  } else {
    showResult('Login Failed', result.data);
  }
}

async function logout() {
  const result = await apiRequest('/api/wallet/logout', 'POST');
  
  isAuthenticated = false;
  userPublicKey = null;
  updateUI();
  showResult('Logged Out', result.data);
}

async function loadBalance() {
  if (!isAuthenticated) return;
  
  const result = await apiRequest('/api/wallet/balance');
  
  if (result.success && result.data.success) {
    const balance = result.data.balance?.solBalance || 0;
    balanceAmount.textContent = formatBalance(balance);
    showResult('Balance Loaded', result.data);
  }
}

async function refreshBalance() {
  if (!isAuthenticated) return;
  
  refreshBalanceBtn.textContent = '⏳';
  refreshBalanceBtn.disabled = true;
  
  const result = await apiRequest('/api/wallet/balance/refresh', 'POST');
  
  if (result.success && result.data.success) {
    const balance = result.data.balance?.solBalance || 0;
    balanceAmount.textContent = formatBalance(balance);
    showResult('Balance Refreshed', result.data);
  }
  
  refreshBalanceBtn.textContent = '🔄';
  refreshBalanceBtn.disabled = false;
}

// UI Functions
function updateUI() {
  if (isAuthenticated) {
    authStatus.classList.remove('hidden');
    createSection.classList.add('hidden');
    loginSection.classList.add('hidden');
    currentPublicKey.textContent = userPublicKey;
  } else {
    authStatus.classList.add('hidden');
    createSection.classList.remove('hidden');
    loginSection.classList.remove('hidden');
    balanceAmount.textContent = '0.0000';
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = '✓';
    setTimeout(() => {
      copyBtn.textContent = '📋';
    }, 2000);
  });
}

// Event Listeners
createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const password = document.getElementById('create-password').value;
  const confirmPassword = document.getElementById('create-password-confirm').value;
  
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  if (password.length < 8) {
    alert('Password must be at least 8 characters');
    return;
  }
  
  await createWallet(password);
  createForm.reset();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const publicKey = document.getElementById('login-publickey').value.trim();
  const password = document.getElementById('login-password').value;
  
  await authenticate(publicKey, password);
  loginForm.reset();
});

logoutBtn.addEventListener('click', logout);
refreshBalanceBtn.addEventListener('click', refreshBalance);
copyBtn.addEventListener('click', () => copyToClipboard(userPublicKey));

// Initialize
checkAuth();

console.log('Zero Connector Frontend Test initialized');
console.log('API Base URL:', API_BASE_URL);

