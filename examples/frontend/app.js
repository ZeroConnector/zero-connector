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
const x402Section = document.getElementById('x402-section');

const createForm = document.getElementById('create-form');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const refreshBalanceBtn = document.getElementById('refresh-balance-btn');
const copyBtn = document.getElementById('copy-btn');
const sendX402Btn = document.getElementById('send-x402-btn');
const aiPromptInput = document.getElementById('ai-prompt');
const apiSelector = document.getElementById('api-selector'); // New
const customUrlGroup = document.getElementById('custom-url-group'); // New
const customUrlInput = document.getElementById('custom-url'); // New
const templateBtn = document.getElementById('template-btn'); // New

const currentPublicKey = document.getElementById('current-publickey');
const balanceAmount = document.getElementById('balance-amount');
const usdcBalanceAmount = document.getElementById('usdc-balance-amount'); // New

// Templates
const TEMPLATES = {
    "https://api.zeroconnector.fun/api/zeroc-x402-demo": {
        prompt: "Explain Zero Connector, imagine i am 12 Years old",
        payloadKey: "prompt"
    },
    "https://agents.memeputer.com/x402/solana/finnputer": {
        prompt: "the hat stays on right?",
        payloadKey: "message"
    },
    "https://agents.memeputer.com/x402/solana/memeputer": {
        prompt: "What can you do?",
        payloadKey: "message"
    }
};

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
    const usdc = result.data.balance?.usdcBalance || 0; // New
    balanceAmount.textContent = formatBalance(balance);
    usdcBalanceAmount.textContent = formatBalance(usdc); // New
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
    const usdc = result.data.balance?.usdcBalance || 0; // New
    balanceAmount.textContent = formatBalance(balance);
    usdcBalanceAmount.textContent = formatBalance(usdc); // New
    showResult('Balance Refreshed', result.data);
  }
  
  refreshBalanceBtn.textContent = '🔄';
  refreshBalanceBtn.disabled = false;
}

async function sendX402Request() {
    if (!isAuthenticated) return;

    const selectedApi = apiSelector.value;
    let targetUrl = selectedApi;
    
    if (selectedApi === 'custom') {
        targetUrl = customUrlInput.value.trim();
        if (!targetUrl) {
            alert('Please enter a custom URL');
            return;
        }
    }

    const prompt = aiPromptInput.value.trim();
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }

    // Determine payload key
    let payloadKey = 'prompt'; // default
    if (TEMPLATES[selectedApi]) {
        payloadKey = TEMPLATES[selectedApi].payloadKey;
    } else if (selectedApi === 'custom') {
        // Heuristic or default for custom URLs
        // Ideally we'd let user select, but for now default 'prompt' or 'message'
        // Let's stick to 'prompt' unless we add a selector
    }

    sendX402Btn.disabled = true;
    sendX402Btn.textContent = 'Processing Payment...';

    // Call the new server endpoint that uses the x402 client
    const result = await apiRequest('/api/ai/request', 'POST', { 
        prompt,
        targetUrl, // Pass target URL to server
        payloadKey // Pass the key name to server
    });

    if (result.success) {
        showResult('AI Response (Paid)', result.data);
    } else {
        showResult('Request Failed', result.data);
    }

    sendX402Btn.disabled = false;
    sendX402Btn.textContent = 'Send Request (0.01 USDC)';
}

// UI Functions
function updateUI() {
  if (isAuthenticated) {
    authStatus.classList.remove('hidden');
    x402Section.classList.remove('hidden');
    createSection.classList.add('hidden');
    loginSection.classList.add('hidden');
    currentPublicKey.textContent = userPublicKey;
  } else {
    authStatus.classList.add('hidden');
    x402Section.classList.add('hidden');
    createSection.classList.remove('hidden');
    loginSection.classList.remove('hidden');
    balanceAmount.textContent = '0.0000';
    usdcBalanceAmount.textContent = '0.00';
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

function updateApiSelection() {
    const selected = apiSelector.value;
    if (selected === 'custom') {
        customUrlGroup.classList.remove('hidden');
    } else {
        customUrlGroup.classList.add('hidden');
    }
}

function useTemplate() {
    const selected = apiSelector.value;
    if (TEMPLATES[selected]) {
        aiPromptInput.value = TEMPLATES[selected].prompt;
    } else {
        // Default template if none specific
        aiPromptInput.value = "Who are you?";
    }
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
sendX402Btn.addEventListener('click', sendX402Request);
apiSelector.addEventListener('change', updateApiSelection); // New
templateBtn.addEventListener('click', useTemplate); // New

// Initialize
checkAuth();
updateApiSelection(); // Init UI state

console.log('Zero Connector Frontend Test initialized');
console.log('API Base URL:', API_BASE_URL);
