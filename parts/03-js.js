// Your Hotel Hotel Management Prototype - Complete JavaScript Engine

// ==========================================
// 0. WHITE-LABEL BRANDING RUNTIME
//    Reads window.BRAND_CONFIG (brand.config.js) and rebrands the whole UI.
// ==========================================
const FONT_SANS = (getComputedStyle(document.documentElement).getPropertyValue('--font-sans') || '').trim() || 'Inter, sans-serif';

// Resolved brand colours for canvas contexts (Chart.js can't read var()).
const BC = {
  get accent() { return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(); },
  get rgb() { return getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim(); },
  get light() { return getComputedStyle(document.documentElement).getPropertyValue('--accent-light').trim(); },
  get strong() { return getComputedStyle(document.documentElement).getPropertyValue('--accent-strong').trim(); }
};

const BRAND = (() => {
  const d = {
    name: 'Your Hotel', shortName: 'Your Hotel', initials: 'YH', logo: null, tagline: 'Hotel Management Portal',
    manager: { name: 'Aarav Mehta', firstName: 'Aarav', role: 'General Manager', initials: 'AM' },
    contact: { address: '123 Hotel Street, Your City, State 000000', gstin: '00AAAAA0000A1Z0', email: 'contact@yourhotel.com', domain: 'yourhotel.com' },
    accent: { light: '#0071E3', dark: '#0A84FF' },
    images: {}
  };
  const c = window.BRAND_CONFIG || {};
  return Object.assign({}, d, c, {
    manager: Object.assign({}, d.manager, c.manager),
    contact: Object.assign({}, d.contact, c.contact),
    accent: Object.assign({}, d.accent, c.accent),
    images: Object.assign({}, d.images, c.images)
  });
})();

function brandHexToRgb(hex) {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
function brandMix(rgb, target, t) { return rgb.map((v, i) => Math.round(v + (target[i] - v) * t)); }
function brandHex(rgb) { return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join(''); }

// Derive the accent palette (strong / light / tint) from one hex colour.
function applyBrandColors() {
  let style = document.getElementById('brand-colors');
  if (!style) { style = document.createElement('style'); style.id = 'brand-colors'; document.head.appendChild(style); }
  const make = (hex, dark) => {
    const rgb = brandHexToRgb(hex);
    const strong = dark ? brandMix(rgb, [255, 255, 255], 0.35) : brandMix(rgb, [0, 0, 0], 0.25);
    const light = brandMix(rgb, [255, 255, 255], dark ? 0.45 : 0.4);
    const tint = dark ? brandMix(rgb, [0, 0, 0], 0.8) : brandMix(rgb, [255, 255, 255], 0.9);
    return `--accent:${hex};--accent-rgb:${rgb.join(', ')};--accent-strong:${brandHex(strong)};--accent-light:${brandHex(light)};--accent-tint:${brandHex(tint)};`;
  };
  style.textContent = `:root{${make(BRAND.accent.light, false)}}[data-theme='dark']{${make(BRAND.accent.dark, true)}}`;
}

// Text tokens used in the markup / mock content, replaced with the config values.
function brandReplace(s) {
  return s
    .replace(/YOUR HOTEL/g, BRAND.name.toUpperCase())
    .replace(/Your Hotel/g, BRAND.name)
    .replace(/Aarav Mehta/g, BRAND.manager.name)
    .replace(/General Manager/g, BRAND.manager.role)
    .replace(/123 Hotel Street, Your City, State 000000/g, BRAND.contact.address)
    .replace(/00AAAAA0000A1Z0/g, BRAND.contact.gstin)
    .replace(/contact@yourhotel\.com/g, BRAND.contact.email)
    .replace(/yourhotel\.com/g, BRAND.contact.domain);
}

const _brandDone = new WeakMap();
function brandNode(node) {
  if (node.nodeType === 3) {
    const v = node.nodeValue;
    if (_brandDone.get(node) === v) return;
    if (/Your Hotel|YOUR HOTEL|Aarav Mehta|General Manager|123 Hotel Street|00AAAAA0000A1Z0|yourhotel\.com/.test(v)) {
      const nv = brandReplace(v);
      _brandDone.set(node, nv);
      if (nv !== v) node.nodeValue = nv;
    }
  } else if (node.nodeType === 1) {
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
      ['value', 'placeholder'].forEach(a => {
        const v = node.getAttribute(a);
        if (v && /Your Hotel|Aarav Mehta|yourhotel\.com/.test(v)) {
          const nv = brandReplace(v);
          node.setAttribute(a, nv);
          if (a === 'value' && node.value !== undefined && node.defaultValue === v) node.value = nv;
        }
      });
    }
    for (let ch = node.firstChild; ch; ch = ch.nextSibling) brandNode(ch);
  }
}

function brandMonogram(cls) {
  const el = document.createElement('div');
  el.className = 'brand-mark brand-mark--' + (cls || 'default');
  if (BRAND.logo) {
    const img = document.createElement('img');
    img.src = BRAND.logo; img.alt = BRAND.name;
    el.appendChild(img);
  } else {
    el.textContent = BRAND.initials;
  }
  return el;
}

function applyBrand() {
  applyBrandColors();
  document.title = `${BRAND.name} — ${BRAND.tagline}`;

  // Logo marks (replace the old crest SVGs)
  document.querySelectorAll('[data-brand-mark]').forEach(slot => {
    slot.replaceChildren(brandMonogram(slot.getAttribute('data-brand-mark')));
  });

  // Hero / background photos from config
  const setBg = (el, url) => {
    if (!el || !url) return;
    const cur = el.getAttribute('style') || '';
    if (/url\(['"]?[^)'"]*['"]?\)/.test(cur)) el.setAttribute('style', cur.replace(/url\(['"]?[^)'"]*['"]?\)/, `url('${url}')`));
  };
  setBg(document.querySelector('.splash-background'), BRAND.images.splash);
  setBg(document.getElementById('login-screen'), BRAND.images.login);
  setBg(document.querySelector('.dashboard-hero-banner'), BRAND.images.dashboard);

  // Text tokens
  brandNode(document.body);
  document.querySelectorAll('.banner-name').forEach(n => {
    if (n.firstChild && n.firstChild.nodeType === 3) n.firstChild.nodeValue = BRAND.manager.firstName + ' ';
  });
  document.querySelectorAll('.avatar-photo, .profile-avatar, .stg-avatar-circle, .msg-bubble-avatar').forEach(n => {
    if (n.textContent.trim() === 'AM') n.textContent = BRAND.manager.initials;
  });

  // Keep dynamically rendered content branded too
  new MutationObserver(muts => {
    muts.forEach(m => {
      if (m.type === 'characterData') brandNode(m.target);
      else m.addedNodes.forEach(brandNode);
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}


// ==========================================
// 22. MOCK DATA STORE
// ==========================================
const MOCK_DATA = {
  rooms: Array.from({length: 30}, (_, i) => ({
    id: `R${i+101}`,
    number: `${Math.floor(i/10) + 1}${String(i%10 + 1).padStart(2, '0')}`,
    type: ['Presidential Suite', 'Premium Villa', 'Deluxe Room', 'Garden Cottage', 'Pool Cabana', 'Luxury Tent'][i%6],
    floor: Math.floor(i/10) + 1,
    status: ['available', 'occupied', 'cleaning', 'maintenance'][Math.floor(Math.random() * 4)],
    guestName: i%3 === 0 ? ['Rahul Sharma', 'Priya Patel', 'Vikram Singh', 'Anita Desai', 'Arjun Kapoor'][Math.floor(Math.random()*5)] : null,
    price: [25000, 35000, 15000, 18000, 20000, 12000][i%6],
    image: `assets/rooms/room_${(i%5)+1}.jpg`
  })),
  guests: Array.from({length: 20}, (_, i) => ({
    id: `G${200+i}`,
    name: ['Aditi Verma', 'Karan Johar', 'Neha Gupta', 'Rohan Mehta', 'Sneha Reddy', 'Amitabh Bachchan'][i%6],
    email: `guest${i}@example.com`,
    phone: `+91 98765${String(Math.floor(Math.random()*99999)).padStart(5, '0')}`,
    room: `R${101+i}`,
    checkIn: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString().split('T')[0],
    checkOut: new Date(Date.now() + Math.random() * 86400000 * 5).toISOString().split('T')[0],
    vip: Math.random() > 0.8
  })),
  bookings: [
    { id: 'B1001', guest: 'Siddharth Malhotra', roomType: 'Premium Villa', dates: '12 Oct - 15 Oct', status: 'confirmed', amount: 105000 },
    { id: 'B1002', guest: 'Deepika Padukone', roomType: 'Presidential Suite', dates: '14 Oct - 16 Oct', status: 'checked-in', amount: 50000 },
    { id: 'B1003', guest: 'Ranveer Singh', roomType: 'Pool Cabana', dates: '10 Oct - 13 Oct', status: 'completed', amount: 60000 },
  ],
  conversations: [
    { id: 'C1', name: 'Vikram Singh', room: '102', unread: 2, messages: [{sender: 'guest', text: 'Can we get extra towels?', time: '10:30 AM'}] },
    { id: 'C2', name: 'Anita Desai', room: '205', unread: 0, messages: [{sender: 'hotel', text: 'Your spa appointment is confirmed.', time: '09:15 AM'}, {sender: 'guest', text: 'Thank you!', time: '09:18 AM'}] },
    { id: 'C3', name: 'Rahul Sharma', room: '301', unread: 1, messages: [{sender: 'guest', text: 'Is breakfast included?', time: '11:45 AM'}] },
  ],
  invoices: [],
  notifications: [
    { id: 'N1', title: 'New Booking', desc: 'Premium Villa booked for 12 Oct', time: '5m ago', read: false, type: 'booking' },
    { id: 'N2', title: 'Room Service', desc: 'Order #402 for Room 205', time: '12m ago', read: false, type: 'service' },
    { id: 'N3', title: 'Maintenance', desc: 'AC issue in Room 104 resolved', time: '1h ago', read: true, type: 'maintenance' },
  ],
  activities: [
    { time: '10:45 AM', text: 'Check-in: Siddharth Malhotra (Room 304)', icon: 'user-check' },
    { time: '10:30 AM', text: 'Payment Received: ₹45,000 from Booking.com', icon: 'credit-card' },
    { time: '09:15 AM', text: 'Room 205 requested Spa reservation', icon: 'bell' },
  ],
  reviews: [
    { id: 'RV1', author: 'Aman K.', rating: 5, text: 'Absolutely wonderful experience! The hospitality is unmatched.', sentiment: 'positive' },
    { id: 'RV2', author: 'Pooja R.', rating: 4, text: 'Beautiful property. Food was great, but AC was a bit noisy.', sentiment: 'neutral' },
    { id: 'RV3', author: 'Chris T.', rating: 5, text: 'A magical stay. The Pool Cabana was stunning.', sentiment: 'positive' },
  ],
  searchItems: [
    { type: 'room', title: 'Presidential Suite', subtitle: 'Room 401 - Occupied', icon: 'bed-double' },
    { type: 'guest', title: 'Deepika Padukone', subtitle: 'Room 401 - VIP', icon: 'user' },
    { type: 'booking', title: 'B1002', subtitle: 'Deepika Padukone - Confirmed', icon: 'calendar-check' },
    { type: 'room', title: 'Premium Villa', subtitle: 'Room 102 - Available', icon: 'home' },
  ]
};

// Global State
const APP_STATE = {
  theme: localStorage.getItem('hotel_theme') || 'light',
  activeScreen: 'dashboard',
  chartsInitialized: false,
  charts: {}
};

// ==========================================
// 1. APP INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', init);

function init() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Ensure all drawers are completely offscreen and hidden on startup
  document.querySelectorAll('.drawer, .side-panel, .luxury-room-drawer, #room-detail, #booking-drawer, #drawer-housekeeping-detail, #notification-panel').forEach(d => {
    d.classList.remove('open');
    d.classList.add('hidden');
    d.style.display = 'none';
    d.style.right = '-750px';
    d.style.visibility = 'hidden';
    d.style.pointerEvents = 'none';
  });

  applyBrand();
  initTheme();
  initClock();
  startSplashSequence();
  setupEventListeners();
  setupScrollAnimations();
  setupRipples();
}

// ==========================================
// 2. SPLASH SCREEN SEQUENCE
// ==========================================
function startSplashSequence() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  
  const title = splash.querySelector('.splash-title') || splash.querySelector('h1');
  const subtitle = splash.querySelector('.splash-subtitle') || splash.querySelector('p');
  const btn = splash.querySelector('.splash-btn') || splash.querySelector('#enter-portal-btn') || splash.querySelector('.btn-enter');
  
  if (title) {
    title.textContent = BRAND.name.toUpperCase();
    title.style.borderRight = 'none';
  }
  
  // Particles
  createParticles(splash);
  
  // Btn click
  if (btn) {
    btn.addEventListener('click', () => {
      splash.classList.add('exit');
      setTimeout(() => {
        splash.classList.add('hidden');
        const login = document.getElementById('login-screen');
        if (login) {
          login.classList.remove('hidden');
          login.classList.add('fade-in');
          const emailInput = login.querySelector('#email') || login.querySelector('input[type="email"]');
          const passInput = login.querySelector('#password') || login.querySelector('input[type="password"]');
          if (emailInput && !emailInput.value) emailInput.value = 'admin@' + BRAND.contact.domain;
          if (passInput && !passInput.value) passInput.value = 'Hotel@2026';
        }
      }, 600);
    });
  }
}

function createParticles(container) {
  for (let i=0; i<20; i++) {
    const p = document.createElement('div');
    p.className = 'gold-particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.width = p.style.height = `${Math.random() * 6 + 2}px`;
    p.style.animationDuration = `${Math.random() * 3 + 2}s`;
    p.style.animationDelay = `${Math.random() * 2}s`;
    container.appendChild(p);
  }
}

// ==========================================
// 3. LOGIN SYSTEM
// ==========================================
function setupLogin() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  
  const loginForm = loginScreen.querySelector('form');
  const loginBtn = document.getElementById('login-btn') || loginScreen.querySelector('.login-btn-primary');
  const inputs = loginScreen.querySelectorAll('input');
  
  const emailInput = loginScreen.querySelector('input[type="email"]') || inputs[0];
  const passInput = loginScreen.querySelector('input[type="password"]') || inputs[1];
  if (emailInput && !emailInput.value) emailInput.value = 'admin@' + BRAND.contact.domain;
  if (passInput && !passInput.value) passInput.value = 'Hotel@2026';

  // Toggle password visibility
  const togglePass = loginScreen.querySelector('#toggle-password-btn, .eye-toggle');
  if (togglePass) {
    togglePass.addEventListener('click', (e) => {
      e.preventDefault();
      const pInput = loginScreen.querySelector('#password') || passInput;
      if (pInput) {
        const isPass = pInput.type === 'password';
        pInput.type = isPass ? 'text' : 'password';
        togglePass.innerHTML = isPass ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    });
  }
  
  const doLogin = (e) => {
    if (e) e.preventDefault();
    
    // Ensure credentials present
    if (emailInput && !emailInput.value) emailInput.value = 'admin@' + BRAND.contact.domain;
    if (passInput && !passInput.value) passInput.value = 'Hotel@2026';
    
    if (loginBtn) {
      loginBtn.innerHTML = '<span>Authenticating...</span>';
      loginBtn.disabled = true;
      
      setTimeout(() => {
        loginBtn.innerHTML = '<i data-lucide="check-circle"></i> <span>Access Granted</span>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        loginBtn.classList.add('success');
        
        setTimeout(() => {
          loginScreen.classList.add('exit');
          setTimeout(() => {
            loginScreen.classList.add('hidden');
            const appShell = document.getElementById('app-shell');
            if (appShell) {
              appShell.classList.remove('hidden');
              appShell.classList.add('fade-in');
              
              // Initialize app features
              animateCounters();
              initCharts();
              APP_STATE.chartsInitialized = true;
              const targetScreen = window.location.hash.replace('#', '') || 'dashboard';
              showScreen(targetScreen);
              showToast(`Welcome back, ${BRAND.manager.name} (${BRAND.manager.role})`, 'success');
            }
          }, 600);
        }, 700);
      }, 800);
    }
  };
  
  if (loginBtn) loginBtn.addEventListener('click', doLogin);
  if (loginForm) loginForm.addEventListener('submit', doLogin);
  
  // Biometric buttons
  const biometricBtns = loginScreen.querySelectorAll('.btn-biometric');
  biometricBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Biometric verified: Aarav Mehta', 'success');
      doLogin();
    });
  });
}

// ==========================================
// 4. NAVIGATION ROUTER
// ==========================================
function setupNavigation() {
  window.addEventListener('hashchange', handleHashChange);
  
  document.querySelectorAll('.sidebar-nav-item[data-screen]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const screen = item.getAttribute('data-screen');
      window.location.hash = `#${screen}`;
    });
  });

  if (window.location.hash && window.location.hash !== '#') {
    handleHashChange();
  }
}

function handleHashChange() {
  let hash = window.location.hash.replace('#', '') || 'dashboard';
  showScreen(hash);
}

function showScreen(screenId) {
  if (screenId === 'guests') screenId = 'reservations';
  // Close any open drawers when switching screens
  document.querySelectorAll('.drawer.open, .side-panel.open, .luxury-room-drawer.open').forEach(d => {
    closeDrawer(d.id);
  });

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active', 'fade-in');
    s.classList.add('hidden');
  });
  
  // Update sidebar active state
  document.querySelectorAll('.sidebar-nav-item').forEach(item => item.classList.remove('active'));
  const activeNavItem = document.querySelector(`.sidebar-nav-item[data-screen="${screenId}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');
  
  // Show target
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active', 'fade-in');
    APP_STATE.activeScreen = screenId;
    
    // Trigger screen-specific initializers
    if (screenId === 'dashboard') {
      animateCounters();
      if (!APP_STATE.chartsInitialized) {
        initCharts();
        APP_STATE.chartsInitialized = true;
      } else {
        if (APP_STATE.charts.revenue) APP_STATE.charts.revenue.resize();
        if (APP_STATE.charts.sources) APP_STATE.charts.sources.resize();
      }
    } else if (screenId === 'financials') {
      if (!APP_STATE.chartsInitialized) {
        initCharts();
        APP_STATE.chartsInitialized = true;
      }
      if (typeof initFinancialsSystem === 'function') {
        initFinancialsSystem();
      }
      if (APP_STATE.charts.finance) APP_STATE.charts.finance.resize();
      if (APP_STATE.charts.expenseDonut) APP_STATE.charts.expenseDonut.resize();
    } else if (screenId === 'analytics') {
      if (typeof initAnalyticsCharts === 'function') {
        initAnalyticsCharts();
      }
      if (APP_STATE.charts.alyTrends) APP_STATE.charts.alyTrends.resize();
      if (APP_STATE.charts.alyDemo) APP_STATE.charts.alyDemo.resize();
    } else if (screenId === 'rooms') {
      if (typeof renderRoomsView === 'function') {
        renderRoomsView();
      }
    } else if (screenId === 'reviews') {
      if (typeof renderReviewsView === 'function') {
        renderReviewsView();
      }
    } else if (screenId === 'events') {
      if (typeof initEventsSystem === 'function') {
        initEventsSystem();
      }
    }
    
    // Setup scroll anims for new screen
    setupScrollAnimations();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } else {
    // Fallback to dashboard
    const dash = document.getElementById('screen-dashboard');
    if (dash) {
      dash.classList.remove('hidden');
      dash.classList.add('active', 'fade-in');
      APP_STATE.activeScreen = 'dashboard';
    }
  }
}

// ==========================================
// 5. SIDEBAR
// ==========================================
function setupSidebar() {
  const toggleBtn = document.querySelector('.sidebar-toggle');
  const appShell = document.getElementById('app-shell');
  
  if (toggleBtn && appShell) {
    toggleBtn.addEventListener('click', () => {
      appShell.classList.toggle('sidebar-collapsed');
    });
  }
}

// ==========================================
// 6. THEME SYSTEM
// ==========================================
function initTheme() {
  document.documentElement.setAttribute('data-theme', APP_STATE.theme);
  updateThemeIcon();
}

function toggleTheme() {
  APP_STATE.theme = APP_STATE.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('hotel_theme', APP_STATE.theme);
  
  document.body.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', APP_STATE.theme);
  
  updateThemeIcon();
  
  // Re-render charts for theme colors
  if (APP_STATE.chartsInitialized) {
    Object.values(APP_STATE.charts).forEach(chart => chart.destroy());
    initCharts();
  }
  
  setTimeout(() => {
    document.body.classList.remove('theme-transitioning');
  }, 400);
}

function updateThemeIcon() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle && typeof lucide !== 'undefined') {
    themeToggle.innerHTML = APP_STATE.theme === 'light' 
      ? '<i data-lucide="moon"></i>' 
      : '<i data-lucide="sun"></i>';
    lucide.createIcons();
  }
}

// ==========================================
// 7. LIVE CLOCK
// ==========================================
function initClock() {
  const clockEl = document.querySelector('.live-clock');
  if (!clockEl) return;
  
  function updateClock() {
    const now = new Date();
    // Simulate 2026 as per prompt if needed, or use current
    // We'll use current for realistic ticking, but format exactly as requested.
    const opts = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    const str = now.toLocaleString('en-US', opts).replace(/,/g, '');
    
    // Custom formatting to match: 'Sat, 26 Sep 2026 • 3:05 PM'
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    
    const d = days[now.getDay()];
    const date = now.getDate();
    const m = months[now.getMonth()];
    const y = 2026; // Fixed year as requested
    
    let h = now.getHours();
    const min = String(now.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    
    clockEl.textContent = `${d}, ${date} ${m} ${y} • ${h}:${min} ${ampm}`;
  }
  
  updateClock();
  setInterval(updateClock, 1000);
}

// ==========================================
// 8. NUMBER COUNTER ANIMATIONS
// ==========================================
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target], .stat-value[data-target]');
  
  const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  
  counters.forEach(counter => {
    if (counter.classList.contains('counted')) return;
    counter.classList.add('counted');
    
    const target = parseFloat(counter.getAttribute('data-target'));
    const duration = 2000;
    const isCurrency = counter.hasAttribute('data-currency');
    let startTimestamp = null;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = easeOutExpo(progress);
      
      let currentVal = Math.floor(easeProgress * target);
      
      let formatted = currentVal.toLocaleString('en-IN');
      if (isCurrency) formatted = '₹' + formatted;
      
      counter.textContent = formatted;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        let final = target.toLocaleString('en-IN');
        if (isCurrency) final = '₹' + final;
        counter.textContent = final;
      }
    };
    
    window.requestAnimationFrame(step);
  });
}

// ==========================================
// 9. CHART.JS INITIALIZATION
// ==========================================
function initCharts() {
  if (typeof Chart === 'undefined') return;
  
  const isDark = APP_STATE.theme === 'dark';
  const textColor = isDark ? '#F5F5F7' : '#1D1D1F';
  const gridColor = isDark ? 'rgba(245, 245, 247, 0.1)' : 'rgba(29, 29, 31, 0.1)';
  
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = FONT_SANS;
  
  // Helper for gradients
  const createGradient = (ctx, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  // Revenue Chart
  const revCanvas = document.getElementById('revenueChart');
  if (revCanvas) {
    const ctx = revCanvas.getContext('2d');
    const goldGradient = ctx.createLinearGradient(0, 0, 0, 260);
    goldGradient.addColorStop(0, `rgba(${BC.rgb}, 0.32)`);
    goldGradient.addColorStop(1, `rgba(${BC.rgb}, 0.0)`);
    
    APP_STATE.charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Revenue',
          data: [290000, 365000, 270000, 465000, 530000, 410000, 510000],
          borderColor: BC.accent,
          backgroundColor: goldGradient,
          borderWidth: 3.5,
          tension: 0.45,
          fill: true,
          pointBackgroundColor: BC.accent,
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2.5,
          pointRadius: 4.5,
          pointHoverRadius: 7.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1800, easing: 'easeOutQuart' },
        scales: {
          y: {
            min: 200000,
            max: 550000,
            grid: { color: 'rgba(210, 210, 215, 0.5)', borderDash: [4, 4] },
            ticks: {
              stepSize: 50000,
              color: '#86868B',
              font: { family: FONT_SANS, size: 12 },
              callback: function(value) { return '₹' + (value/1000) + 'k'; }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#86868B', font: { family: FONT_SANS, size: 12 } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1C1C1E',
            titleColor: BC.light,
            bodyColor: '#FFFFFF',
            titleFont: { family: FONT_SANS, weight: '600' },
            bodyFont: { family: FONT_SANS, weight: '700', size: 14 },
            padding: 12,
            cornerRadius: 10,
            borderColor: `rgba(${BC.rgb}, 0.4)`,
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              title: function(items) { return items[0].label + 'day Analytics'; },
              label: function(context) { return '₹' + context.parsed.y.toLocaleString('en-IN'); }
            }
          }
        }
      }
    });
  }

  // Finance / Revenue Trends Chart
  const finCanvas = document.getElementById('financeChart');
  if (finCanvas) {
    const ctx = finCanvas.getContext('2d');
    const revGrad = ctx.createLinearGradient(0, 0, 0, 280);
    revGrad.addColorStop(0, `rgba(${BC.rgb}, 0.45)`);
    revGrad.addColorStop(0.7, `rgba(${BC.rgb}, 0.08)`);
    revGrad.addColorStop(1, `rgba(${BC.rgb}, 0.0)`);

    const expGrad = ctx.createLinearGradient(0, 0, 0, 280);
    expGrad.addColorStop(0, 'rgba(255, 159, 10, 0.38)');
    expGrad.addColorStop(0.7, 'rgba(255, 159, 10, 0.06)');
    expGrad.addColorStop(1, 'rgba(255, 159, 10, 0.0)');

    APP_STATE.charts.finance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [
          {
            label: 'Revenue',
            data: [2.8, 3.2, 4.0, 3.7, 4.6, 5.2, 4.8, 5.5, 6.2, 6.0, 6.7, 7.3],
            borderColor: BC.accent,
            borderWidth: 3,
            backgroundColor: revGrad,
            fill: true,
            tension: 0.42,
            pointBackgroundColor: BC.accent,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: BC.accent,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3
          },
          {
            label: 'Expenses',
            data: [2.0, 2.3, 2.7, 2.4, 3.0, 3.4, 3.1, 3.7, 4.0, 3.8, 4.2, 4.7],
            borderColor: '#FF9F0A',
            borderWidth: 3,
            backgroundColor: expGrad,
            fill: true,
            tension: 0.42,
            pointBackgroundColor: '#FF9F0A',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#FF9F0A',
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1800, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
            ticks: {
              color: isDark ? '#A0AEC0' : '#64748B',
              font: { family: FONT_SANS, size: 11, weight: '500' },
              callback: v => '₹' + v + 'M'
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: isDark ? '#A0AEC0' : '#64748B',
              font: { family: FONT_SANS, size: 11, weight: '500' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1C1C1E',
            titleColor: BC.light,
            bodyColor: '#FFFFFF',
            borderColor: `rgba(${BC.rgb}, 0.4)`,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              label: function(ctx) {
                return `${ctx.dataset.label}: ₹${ctx.parsed.y}M (₹${(ctx.parsed.y * 1000000).toLocaleString('en-IN')})`;
              }
            }
          }
        }
      }
    });
  }

  // Expense Donut Chart
  const expenseDonutCanvas = document.getElementById('expenseDonutChart');
  if (expenseDonutCanvas) {
    const ctx = expenseDonutCanvas.getContext('2d');
    APP_STATE.charts.expenseDonut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Staff & Payroll', 'Utilities', 'Maintenance', 'Supplies & F&B', 'Marketing'],
        datasets: [{
          data: [35, 20, 18, 15, 12],
          backgroundColor: [BC.accent, '#34C759', '#FF9F0A', '#AF52DE', '#FF375F'],
          borderWidth: 0,
          borderRadius: 4,
          spacing: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: { animateScale: true, animateRotate: true, duration: 1800 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1C1C1E',
            titleColor: BC.light,
            bodyColor: '#FFFFFF',
            borderColor: `rgba(${BC.rgb}, 0.4)`,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx) {
                const total = 2850000;
                const amt = Math.round(total * ctx.parsed / 100).toLocaleString('en-IN');
                return `${ctx.label}: ${ctx.parsed}% (₹${amt})`;
              }
            }
          }
        }
      }
    });
  }

  // Trends Chart
  const trendsCanvas = document.getElementById('trendsChart');
  if (trendsCanvas) {
    APP_STATE.charts.trends = new Chart(trendsCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [
          { label: 'Direct', data: [120, 150, 180, 200, 250, 220, 280, 300, 350, 320, 400, 450], borderColor: BC.accent, tension: 0.4 },
          { label: 'OTA', data: [200, 220, 250, 280, 300, 320, 310, 350, 380, 360, 410, 420], borderColor: BC.strong, tension: 0.4 },
          { label: 'Walk-in', data: [50, 60, 40, 70, 80, 65, 90, 85, 100, 95, 120, 110], borderColor: '#E63946', tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: gridColor } } } }
    });
  }

  // Demographics
  const demoCanvas = document.getElementById('demoChart');
  if (demoCanvas) {
    APP_STATE.charts.demo = new Chart(demoCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Domestic', 'International'],
        datasets: [{ data: [78, 22], backgroundColor: [BC.accent, 'rgba(134, 134, 139, 0.25)'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' } } }
    });
  }

  APP_STATE.chartsInitialized = true;
}

// ==========================================
// 10. HOUSEKEEPING MANAGEMENT SYSTEM
// ==========================================
const HK_STATE = {
  tasks: [
    // Column 1: Pending (5)
    {
      id: 'hk-103',
      room: '103',
      floor: '1',
      roomType: 'Premium Villa',
      title: 'Deep Clean',
      priority: 'High',
      status: 'pending',
      staff: 'Nisha Reddy',
      staffAvatar: 'NR',
      staffRole: 'Senior Housekeeping Executive',
      image: 'assets/img/room-suite.jpg',
      timeText: 'Created 2h ago',
      timeDetail: 'Today at 02:15 PM',
      schedule: 'Immediate',
      notes: 'Full sanitization, steam carpet cleaning, and restock luxury Ayurvedic bath salts.',
      checklist: [
        { text: 'Strip & dress bed with 600TC Egyptian cotton linens', done: true },
        { text: 'Sanitise Italian marble bathroom & polish brass faucets', done: true },
        { text: 'Restock Ayurvedic bath salts, shampoos & embroidered robes', done: true },
        { text: 'Audit and restock gourmet minibar & tea selection', done: false },
        { text: 'Mop marble flooring & vacuum hand-woven Kashmiri carpets', done: false },
        { text: 'Ignite evening Jasmine incense & set ambient lighting', done: false }
      ]
    },
    {
      id: 'hk-205',
      room: '205',
      floor: '2',
      roomType: 'Presidential Suite',
      title: 'Turndown Service',
      priority: 'Medium',
      status: 'pending',
      staff: 'Rahul C.',
      staffAvatar: 'VC',
      staffRole: 'Floor Lead',
      image: 'assets/img/room-deluxe.jpg',
      timeText: 'Created 3h ago',
      timeDetail: 'Today at 01:20 PM',
      schedule: 'Afternoon Turndown (4 PM)',
      notes: 'Evening jasmine incense, turn down bed, handcrafted Belgian chocolates on pillows.',
      checklist: [
        { text: 'Turn down Egyptian cotton duvet and prepare slippers', done: true },
        { text: 'Close blackout velvet drapes & dim sconces', done: true },
        { text: 'Replenish bedside carafes of infused copper water', done: false },
        { text: 'Place evening aromatherapy pillow mist', done: false }
      ]
    },
    {
      id: 'hk-405',
      room: '405',
      floor: '4',
      roomType: 'Luxury Suite',
      title: 'Minibar Restock',
      priority: 'Low',
      status: 'pending',
      staff: 'Nisha Reddy',
      staffAvatar: 'NR',
      staffRole: 'Senior Housekeeping Executive',
      image: 'assets/img/room-deluxe.jpg',
      timeText: 'Created 1h ago',
      timeDetail: 'Today at 03:00 PM',
      schedule: 'Within 1 hour',
      notes: 'Restock premium sparkling water, vintage wine, and organic dry fruit jars.',
      checklist: [
        { text: 'Check inventory seals and expiry dates', done: true },
        { text: 'Restock chilled sparkling San Pellegrino & mineral water', done: true },
        { text: 'Restock roasted cashews and organic almond canisters', done: false },
        { text: 'Log consumed items into central PMS billing', done: false }
      ]
    },
    {
      id: 'hk-306',
      room: '306',
      floor: '3',
      roomType: 'Imperial Suite',
      title: 'Linen Change',
      priority: 'Medium',
      status: 'pending',
      staff: 'Amit K.',
      staffAvatar: 'AK',
      staffRole: 'Housekeeper',
      image: 'assets/img/room-modern.jpg',
      timeText: 'Created 4h ago',
      timeDetail: 'Today at 12:30 PM',
      schedule: 'Within 30m',
      notes: 'Replace 600-thread count Egyptian cotton sheets and silk cushion covers.',
      checklist: [
        { text: 'Strip existing beddings and pillowcases', done: true },
        { text: 'Install fresh hypoallergenic feather duvet', done: true },
        { text: 'Replace plush Turkish bath sheets and hand towels', done: false },
        { text: 'Audit luxury bathrobes in wardrobe', done: false }
      ]
    },
    {
      id: 'hk-504',
      room: '504',
      floor: '5',
      roomType: 'Penthouse Pavilion',
      title: 'Deep Clean',
      priority: 'High',
      status: 'pending',
      staff: 'Rahul C.',
      staffAvatar: 'VC',
      staffRole: 'Floor Lead',
      image: 'assets/img/room-premium.jpg',
      timeText: 'Created 30m ago',
      timeDetail: 'Today at 03:45 PM',
      schedule: 'Immediate',
      notes: 'Pre-arrival deep clean for Presidential Suite VIP arrival at 5 PM.',
      checklist: [
        { text: 'VIP White-Glove sanitisation protocol', done: true },
        { text: 'Polish brass chandeliers & mirrors', done: false },
        { text: 'Place fresh & rose floral bowls', done: false },
        { text: 'Inspect private jacuzzi and terrace seating', done: false }
      ]
    },

    // Column 2: In Progress (3)
    {
      id: 'hk-202',
      room: '202',
      floor: '2',
      roomType: 'Executive Suite',
      title: 'Standard Clean',
      priority: 'High',
      status: 'in-progress',
      staff: 'Amit K.',
      staffAvatar: 'AK',
      staffRole: 'Housekeeper',
      image: 'assets/img/room-premium.jpg',
      timeText: '15m elapsed',
      timeDetail: 'Started at 03:55 PM',
      schedule: 'In Progress',
      notes: 'Routine daily cleaning, replace towels, vacuum living area.',
      checklist: [
        { text: 'Make bed and arrange decorative bolsters', done: true },
        { text: 'Clean glass surfaces and private balcony doors', done: true },
        { text: 'Disinfect bathroom and replenish soaps', done: true },
        { text: 'Vacuum carpet and mop marble foyer', done: false }
      ]
    },
    {
      id: 'hk-403',
      room: '403',
      floor: '4',
      roomType: 'Premium Villa',
      title: 'Deep Clean',
      priority: 'Medium',
      status: 'in-progress',
      staff: 'Nisha Reddy',
      staffAvatar: 'NR',
      staffRole: 'Senior Housekeeping Executive',
      image: 'assets/img/room-suite.jpg',
      timeText: '45m elapsed',
      timeDetail: 'Started at 03:25 PM',
      schedule: 'In Progress',
      notes: 'Post-checkout full disinfection, marble polishing in bathroom.',
      checklist: [
        { text: 'Full disinfection of high-touch points', done: true },
        { text: 'Wash and steam-clean upholstery', done: true },
        { text: 'Deep scrub shower walls & polish fixtures', done: false },
        { text: 'Inspect AC filters and set fragrance diffuser', done: false }
      ]
    },
    {
      id: 'hk-104',
      room: '104',
      floor: '1',
      roomType: 'Garden Terrace Suite',
      title: 'Laundry Delivery',
      priority: 'Low',
      status: 'in-progress',
      staff: 'Rahul C.',
      staffAvatar: 'VC',
      staffRole: 'Floor Lead',
      image: 'assets/img/room-modern.jpg',
      timeText: '5m elapsed',
      timeDetail: 'Started at 04:05 PM',
      schedule: 'In Progress',
      notes: 'Deliver dry-cleaned evening sherwani and press silk saris on velvet hangers.',
      checklist: [
        { text: 'Verify laundry ticket #BKR-991 with guest name', done: true },
        { text: 'Ensure crisp pressing & fragrance bag attached', done: true },
        { text: 'Deliver to suite wardrobe & receive guest sign-off', done: false }
      ]
    },

    // Column 3: Completed (22 Total, 4 displayed on primary board)
    {
      id: 'hk-101',
      room: '101',
      floor: '1',
      roomType: 'Deluxe Garden Room',
      title: 'Standard Clean',
      priority: 'Medium',
      status: 'completed',
      staff: 'Nisha Reddy',
      staffAvatar: 'NR',
      staffRole: 'Senior Housekeeping Executive',
      image: 'assets/img/room-deluxe.jpg',
      timeText: 'Completed at 10:15 AM',
      timeDetail: 'Completed at 10:15 AM',
      schedule: 'Completed',
      notes: 'Standard daily cleaning completed. Suite inspection passed with 100% score.',
      checklist: [
        { text: 'Fresh bed linens installed and dressed', done: true },
        { text: 'Bathroom disinfected and towels replenished', done: true },
        { text: 'Minibar checked and refilled', done: true },
        { text: 'Floor mopped and welcome fragrance set', done: true }
      ]
    },
    {
      id: 'hk-304',
      room: '304',
      floor: '3',
      roomType: 'Garden Courtyard Suite',
      title: 'Turndown Service',
      priority: 'Low',
      status: 'completed',
      staff: 'Amit K.',
      staffAvatar: 'AK',
      staffRole: 'Housekeeper',
      image: 'assets/img/room-premium.jpg',
      timeText: 'Completed at 09:30 AM',
      timeDetail: 'Completed at 09:30 AM',
      schedule: 'Completed',
      notes: 'Morning refresh and floral arrangement completed gracefully.',
      checklist: [
        { text: 'Beds dressed and room aired out', done: true },
        { text: 'Floral arrangement placed on dining console', done: true },
        { text: 'Used dishware cleared to room service pantry', done: true }
      ]
    },
    {
      id: 'hk-503',
      room: '503',
      floor: '5',
      roomType: 'Terrace Villa',
      title: 'Minibar Restock',
      priority: 'Medium',
      status: 'completed',
      staff: 'Rahul C.',
      staffAvatar: 'VC',
      staffRole: 'Floor Lead',
      image: 'assets/img/room-deluxe.jpg',
      timeText: 'Completed at 08:45 AM',
      timeDetail: 'Completed at 08:45 AM',
      schedule: 'Completed',
      notes: 'All luxury minibar inventory replenished and audited.',
      checklist: [
        { text: 'Audited bar stock against consumption bill', done: true },
        { text: 'Chilled wine & artisanal snacks restocked', done: true }
      ]
    },
    {
      id: 'hk-205b',
      room: '205',
      floor: '2',
      roomType: 'Presidential Suite',
      title: 'Deep Clean',
      priority: 'High',
      status: 'completed',
      staff: 'Nisha Reddy',
      staffAvatar: 'NR',
      staffRole: 'Senior Housekeeping Executive',
      image: 'assets/img/room-suite.jpg',
      timeText: 'Completed at 08:20 AM',
      timeDetail: 'Completed at 08:20 AM',
      schedule: 'Completed',
      notes: 'Morning departure deep clean completed before 9 AM check-in.',
      checklist: [
        { text: 'Complete room sanitisation', done: true },
        { text: 'Linen replacement and carpet steam wash', done: true },
        { text: 'Quality audit signed by GM Aarav Mehta', done: true }
      ]
    },
    // Extended Completed Tasks for full 22 count
    {
      id: 'hk-102',
      room: '102',
      floor: '1',
      roomType: 'Deluxe Room',
      title: 'Standard Clean',
      priority: 'Low',
      status: 'completed',
      staff: 'Amit K.',
      staffAvatar: 'AK',
      image: 'assets/img/room-deluxe.jpg',
      timeText: 'Completed at 08:00 AM',
      notes: 'Routine morning cleaning.'
    },
    {
      id: 'hk-201',
      room: '201',
      floor: '2',
      roomType: 'Premium Suite',
      title: 'Linen Change',
      priority: 'Medium',
      status: 'completed',
      staff: 'Sunita Sharma',
      staffAvatar: 'SS',
      image: 'assets/img/room-premium.jpg',
      timeText: 'Completed at 07:45 AM',
      notes: 'Fresh linens replaced.'
    },
    {
      id: 'hk-301',
      room: '301',
      floor: '3',
      roomType: 'Deluxe Room',
      title: 'Minibar Restock',
      priority: 'Low',
      status: 'completed',
      staff: 'Rahul C.',
      staffAvatar: 'VC',
      image: 'assets/img/room-modern.jpg',
      timeText: 'Completed at 07:30 AM',
      notes: 'Bar fully restocked.'
    },
    {
      id: 'hk-302',
      room: '302',
      floor: '3',
      roomType: 'Deluxe',
      title: 'Deep Clean',
      priority: 'High',
      status: 'completed',
      staff: 'Rajesh Verma',
      staffAvatar: 'RV',
      image: 'assets/img/room-suite.jpg',
      timeText: 'Completed at 07:15 AM',
      notes: 'Complete post-checkout sanitization.'
    },
    {
      id: 'hk-401',
      room: '401',
      floor: '4',
      roomType: 'Imperial Villa',
      title: 'Standard Clean',
      priority: 'Medium',
      status: 'completed',
      staff: 'Nisha Reddy',
      staffAvatar: 'NR',
      image: 'assets/img/room-deluxe.jpg',
      timeText: 'Completed at 07:00 AM',
      notes: 'Prepared for early check-in.'
    }
  ],
  filters: {
    floor: 'all',
    type: 'all',
    status: 'all',
    search: ''
  },
  activeStatFilter: 'all',
  currentView: 'board', // 'board' | 'list' | 'calendar'
  selectedTask: null,
  draggedTaskId: null
};

function setupHousekeeping() {
  renderHousekeeping();
  bindHousekeepingEvents();
}

// Alias for existing callers
function setupKanban() {
  setupHousekeeping();
}

function updateKanbanCounts() {
  updateHousekeepingStats();
}

function updateHousekeepingStats() {
  const pendingCount = HK_STATE.tasks.filter(t => t.status === 'pending').length;
  const progressCount = HK_STATE.tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = HK_STATE.tasks.filter(t => t.status === 'completed').length;
  const totalCount = HK_STATE.tasks.length;

  const elTotal = document.getElementById('stat-hk-total');
  const elPending = document.getElementById('stat-hk-pending');
  const elProgress = document.getElementById('stat-hk-progress');
  const elCompleted = document.getElementById('stat-hk-completed');

  if (elTotal) elTotal.textContent = totalCount >= 30 ? totalCount : 30;
  if (elPending) elPending.textContent = pendingCount;
  if (elProgress) elProgress.textContent = progressCount;
  if (elCompleted) elCompleted.textContent = completedCount >= 22 ? completedCount : 22;

  const colPending = document.getElementById('count-hk-pending');
  const colProgress = document.getElementById('count-hk-progress');
  const colCompleted = document.getElementById('count-hk-completed');

  if (colPending) colPending.textContent = pendingCount;
  if (colProgress) colProgress.textContent = progressCount;
  // Display count on column
  if (colCompleted) colCompleted.textContent = Math.min(completedCount, 4);
}

function renderHousekeeping() {
  updateHousekeepingStats();

  // Get active filtered tasks
  const filtered = HK_STATE.tasks.filter(t => {
    // Stat card filter
    if (HK_STATE.activeStatFilter !== 'all' && t.status !== HK_STATE.activeStatFilter) {
      return false;
    }
    // Floor filter
    if (HK_STATE.filters.floor !== 'all' && t.floor !== HK_STATE.filters.floor) {
      return false;
    }
    // Task Type filter
    if (HK_STATE.filters.type !== 'all' && t.title !== HK_STATE.filters.type) {
      return false;
    }
    // Status filter
    if (HK_STATE.filters.status !== 'all' && t.status !== HK_STATE.filters.status) {
      return false;
    }
    // Search query
    if (HK_STATE.filters.search) {
      const q = HK_STATE.filters.search.toLowerCase();
      const match = t.room.toLowerCase().includes(q) ||
                    t.title.toLowerCase().includes(q) ||
                    t.staff.toLowerCase().includes(q) ||
                    (t.roomType && t.roomType.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Render Kanban Columns
  renderKanbanColumns(filtered);

  // Render List / Table View
  renderHousekeepingTable(filtered);

  // Render Calendar View
  renderHousekeepingCalendar(filtered);

  if (window.lucide) {
    lucide.createIcons();
  }
}

function createCardHTML(task) {
  const isCompleted = task.status === 'completed';
  const priorityClass = (task.priority || 'medium').toLowerCase();
  
  let timeHtml = '';
  if (task.status === 'in-progress') {
    timeHtml = `
      <div class="hk-time-row elapsed">
        <i data-lucide="clock" class="hk-time-icon"></i>
        <span>${task.timeText || '15m elapsed'}</span>
      </div>`;
  } else if (isCompleted) {
    timeHtml = `
      <div class="hk-time-row completed">
        <i data-lucide="calendar" class="hk-time-icon"></i>
        <span>${task.timeText || 'Completed today'}</span>
      </div>`;
  } else {
    timeHtml = `
      <div class="hk-time-row">
        <i data-lucide="clock" class="hk-time-icon"></i>
        <span>${task.timeText || 'Created today'}</span>
      </div>`;
  }

  const rightActionHtml = isCompleted
    ? `<div class="hk-completed-badge" title="Task Completed">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          <circle cx="12" cy="12" r="10" fill="#10B981"/>
          <path d="M7.5 12l3.2 3.2L16.8 8.8" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>`
    : `<button type="button" class="hk-card-kebab" data-action="menu" data-task-id="${task.id}" title="Options"><i data-lucide="more-horizontal"></i></button>`;

  const priorityBadgeHtml = isCompleted
    ? ''
    : `<span class="hk-priority-pill ${priorityClass}">${task.priority}</span>`;

  return `
    <div class="hk-card ${isCompleted ? 'completed-item' : ''}" data-task-id="${task.id}" data-room="${task.room}" data-status="${task.status}" draggable="true">
      <div class="hk-card-thumb-wrap">
        <img src="${task.image || 'assets/img/room-deluxe.jpg'}" alt="Room ${task.room}" class="hk-card-thumb" onerror="this.src='assets/img/room-deluxe.jpg'">
      </div>
      <div class="hk-card-details">
        <div class="hk-card-header">
          <div class="hk-card-header-left">
            <span class="hk-room-name">Room ${task.room}</span>
            ${priorityBadgeHtml}
          </div>
          ${rightActionHtml}
        </div>
        <div class="hk-task-title">${task.title}</div>
        <div class="hk-staff-row">
          <div class="hk-staff-avatar">${task.staffAvatar || task.staff.substring(0, 2).toUpperCase()}</div>
          <i data-lucide="user" class="hk-user-icon"></i>
          <span class="hk-staff-name">${task.staff}</span>
        </div>
        ${timeHtml}
      </div>
    </div>
  `;
}

function renderKanbanColumns(tasks) {
  const pendingContainer = document.getElementById('hk-cards-pending');
  const progressContainer = document.getElementById('hk-cards-in-progress');
  const completedContainer = document.getElementById('hk-cards-completed');

  if (!pendingContainer || !progressContainer || !completedContainer) return;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const progressTasks = tasks.filter(t => t.status === 'in-progress');
  // In the mockup 4 completed cards are shown
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const displayedCompleted = HK_STATE.filters.status === 'completed' || HK_STATE.activeStatFilter === 'completed' 
    ? completedTasks 
    : completedTasks.slice(0, 4);

  pendingContainer.innerHTML = pendingTasks.length > 0 
    ? pendingTasks.map(t => createCardHTML(t)).join('')
    : '<div class="text-sm text-muted p-4 text-center">No pending cleaning tasks</div>';

  progressContainer.innerHTML = progressTasks.length > 0
    ? progressTasks.map(t => createCardHTML(t)).join('')
    : '<div class="text-sm text-muted p-4 text-center">No active tasks in progress</div>';

  completedContainer.innerHTML = displayedCompleted.length > 0
    ? displayedCompleted.map(t => createCardHTML(t)).join('')
    : '<div class="text-sm text-muted p-4 text-center">No completed tasks</div>';

  bindCardInteractions();
}

function renderHousekeepingTable(tasks) {
  const tbody = document.getElementById('hk-table-body');
  if (!tbody) return;

  if (tasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-muted">No housekeeping tasks match your filters.</td></tr>';
    return;
  }

  tbody.innerHTML = tasks.map(t => {
    const isCompleted = t.status === 'completed';
    const statusPill = t.status === 'completed'
      ? '<span class="badge" style="background:#ECFDF5; color:#059669; border:1px solid #10B981;">Completed</span>'
      : (t.status === 'in-progress'
        ? '<span class="badge" style="background:#EFF6FF; color:#2563EB; border:1px solid #3B82F6;">In Progress</span>'
        : '<span class="badge" style="background:#FEF2F2; color:#DC2626; border:1px solid #EF4444;">Pending</span>');

    const prioPill = `<span class="hk-priority-pill ${(t.priority || 'medium').toLowerCase()}">${t.priority}</span>`;

    return `
      <tr class="hk-table-row" data-task-id="${t.id}" style="cursor: pointer;">
        <td>
          <div class="hk-table-thumb-col">
            <img src="${t.image || 'assets/img/room-deluxe.jpg'}" alt="Room ${t.room}" class="hk-table-thumb">
            <div>
              <strong>Suite #${t.room}</strong>
              <div class="text-xs text-muted">${t.roomType || 'Premium Villa'}</div>
            </div>
          </div>
        </td>
        <td><strong>${t.title}</strong></td>
        <td>${prioPill}</td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <div class="hk-staff-avatar">${t.staffAvatar || 'ST'}</div>
            <span>${t.staff}</span>
          </div>
        </td>
        <td>${statusPill}</td>
        <td class="text-xs text-muted">${t.timeText || t.timeDetail || 'Today'}</td>
        <td style="text-align: right;">
          <button type="button" class="btn btn-sm btn-outline hk-btn-view-details" data-task-id="${t.id}" style="padding: 4px 10px; font-size: 0.75rem;">
            <i data-lucide="eye" style="width: 13px; height: 13px;"></i> Details
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Row click
  tbody.querySelectorAll('.hk-table-row').forEach(row => {
    row.addEventListener('click', (e) => {
      const id = row.getAttribute('data-task-id');
      const task = HK_STATE.tasks.find(t => t.id === id);
      if (task) openHousekeepingDetailDrawer(task);
    });
  });
}

function renderHousekeepingCalendar(tasks) {
  const container = document.getElementById('hk-timeline-slots');
  if (!container) return;

  const hours = [
    { time: '08:00 AM', filterTime: ['08:00', '08:20', '08:45'] },
    { time: '09:00 AM', filterTime: ['09:30'] },
    { time: '10:00 AM', filterTime: ['10:15'] },
    { time: '11:00 AM', filterTime: [] },
    { time: '12:00 PM', filterTime: ['12:30'] },
    { time: '01:00 PM', filterTime: ['01:20'] },
    { time: '02:00 PM', filterTime: ['02:15'] },
    { time: '03:00 PM', filterTime: ['03:00', '03:25', '03:45', '03:55'] },
    { time: '04:00 PM', filterTime: ['04:05'] }
  ];

  container.innerHTML = hours.map(h => {
    // Find matching tasks
    const matchingTasks = tasks.filter(t => {
      const timeStr = t.timeText + ' ' + (t.timeDetail || '');
      return h.filterTime.some(ft => timeStr.includes(ft));
    });

    const chipsHtml = matchingTasks.length > 0
      ? matchingTasks.map(t => `
          <div class="hk-slot-chip ${t.status}" data-task-id="${t.id}" title="Click to view details">
            <span>Suite #${t.room} • ${t.title} (${t.staff})</span>
            <span class="badge" style="font-size: 0.65rem; background: rgba(0,0,0,0.06);">${t.status}</span>
          </div>
        `).join('')
      : '<span class="text-xs text-muted" style="line-height: 36px; padding-left: 8px;">No tasks scheduled</span>';

    return `
      <div class="hk-time-slot">
        <div class="hk-slot-hour">${h.time}</div>
        <div class="hk-slot-items">
          ${chipsHtml}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.hk-slot-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-task-id');
      const task = HK_STATE.tasks.find(t => t.id === id);
      if (task) openHousekeepingDetailDrawer(task);
    });
  });
}

function bindCardInteractions() {
  const cards = document.querySelectorAll('.hk-card');
  const columns = document.querySelectorAll('.hk-column');

  // Drag and Drop
  cards.forEach(card => {
    card.setAttribute('draggable', true);

    card.addEventListener('dragstart', (e) => {
      HK_STATE.draggedTaskId = card.getAttribute('data-task-id');
      setTimeout(() => card.classList.add('dragging'), 0);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', HK_STATE.draggedTaskId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      HK_STATE.draggedTaskId = null;
    });

    // Card Click -> Details Drawer
    card.addEventListener('click', (e) => {
      // Don't trigger if clicked on kebab menu
      if (e.target.closest('.hk-card-kebab')) return;
      const id = card.getAttribute('data-task-id');
      const task = HK_STATE.tasks.find(t => t.id === id);
      if (task) openHousekeepingDetailDrawer(task);
    });
  });

  // Kebab Menu Click
  document.querySelectorAll('.hk-card-kebab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-task-id');
      const task = HK_STATE.tasks.find(t => t.id === id);
      if (!task) return;

      HK_STATE.selectedTask = task;
      const menu = document.getElementById('hk-kebab-menu');
      if (!menu) return;

      const rect = btn.getBoundingClientRect();
      menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      menu.style.left = `${Math.min(rect.left + window.scrollX - 100, window.innerWidth - 180)}px`;
      menu.classList.remove('hidden');

      const closeMenu = (evt) => {
        if (!menu.contains(evt.target)) {
          menu.classList.add('hidden');
          document.removeEventListener('click', closeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', closeMenu), 10);
    });
  });

  // Column Drop Targets
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');

      const taskId = HK_STATE.draggedTaskId || e.dataTransfer.getData('text/plain');
      const targetColumn = col.getAttribute('data-column');

      if (taskId && targetColumn) {
        const task = HK_STATE.tasks.find(t => t.id === taskId);
        if (task && task.status !== targetColumn) {
          task.status = targetColumn;
          if (targetColumn === 'completed') {
            task.timeText = `Completed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            showToast(`✨ Suite #${task.room} marked as COMPLETED! White-glove verified.`, 'success');
          } else if (targetColumn === 'in-progress') {
            task.timeText = 'Just started';
            showToast(`🧹 Suite #${task.room} cleaning moved to IN PROGRESS`, 'info');
          } else {
            task.timeText = 'Created just now';
            showToast(`Suite #${task.room} moved back to PENDING`, 'info');
          }
          renderHousekeeping();
        }
      }
    });
  });
}

function bindHousekeepingEvents() {
  // Stat Card click filtering
  const statCards = [
    { id: 'hk-stat-total', filter: 'all' },
    { id: 'hk-stat-pending', filter: 'pending' },
    { id: 'hk-stat-progress', filter: 'in-progress' },
    { id: 'hk-stat-completed', filter: 'completed' }
  ];

  statCards.forEach(({ id, filter }) => {
    const cardEl = document.getElementById(id);
    if (cardEl) {
      cardEl.addEventListener('click', () => {
        statCards.forEach(c => {
          const el = document.getElementById(c.id);
          if (el) el.classList.remove('active');
        });
        cardEl.classList.add('active');

        HK_STATE.activeStatFilter = filter;
        renderHousekeeping();
        
        const label = filter === 'all' ? 'All Tasks' : filter.replace('-', ' ').toUpperCase();
        showToast(`Filtered board to: ${label}`, 'info');
      });
    }
  });

  // "View All" buttons in columns
  document.querySelectorAll('.hk-col-view-all').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-view-status');
      if (status) {
        const statusSelect = document.getElementById('hk-filter-status');
        if (statusSelect) statusSelect.value = status;
        HK_STATE.filters.status = status;
        renderHousekeeping();
        showToast(`Viewing all ${status} tasks`, 'info');
      }
    });
  });

  // Floor Filter
  const floorFilter = document.getElementById('hk-filter-floor');
  if (floorFilter) {
    floorFilter.addEventListener('change', (e) => {
      HK_STATE.filters.floor = e.target.value;
      renderHousekeeping();
    });
  }

  // Task Type Filter
  const typeFilter = document.getElementById('hk-filter-type');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      HK_STATE.filters.type = e.target.value;
      renderHousekeeping();
    });
  }

  // Status Filter
  const statusFilter = document.getElementById('hk-filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      HK_STATE.filters.status = e.target.value;
      renderHousekeeping();
    });
  }

  // Search Input
  const searchInput = document.getElementById('hk-search-input');
  const searchClear = document.getElementById('hk-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      HK_STATE.filters.search = val;
      if (searchClear) {
        if (val.length > 0) searchClear.classList.remove('hidden');
        else searchClear.classList.add('hidden');
      }
      renderHousekeeping();
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      HK_STATE.filters.search = '';
      searchClear.classList.add('hidden');
      renderHousekeeping();
    });
  }

  // View Switcher Buttons
  const viewBtns = document.querySelectorAll('.hk-view-btn');
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const viewMode = btn.getAttribute('data-view');
      HK_STATE.currentView = viewMode;

      const boardView = document.getElementById('hk-board-view');
      const listView = document.getElementById('hk-list-view');
      const calView = document.getElementById('hk-calendar-view');

      if (boardView) boardView.classList.add('hidden');
      if (listView) listView.classList.add('hidden');
      if (calView) calView.classList.add('hidden');

      if (viewMode === 'board' && boardView) boardView.classList.remove('hidden');
      else if (viewMode === 'list' && listView) listView.classList.remove('hidden');
      else if (viewMode === 'calendar' && calView) calView.classList.remove('hidden');

      if (window.lucide) lucide.createIcons();
      showToast(`Switched to ${viewMode.toUpperCase()} view`, 'info');
    });
  });

  // + Add Task Button
  const btnOpenAddTask = document.getElementById('btn-open-add-task');
  const modalAddTask = document.getElementById('modal-add-hk-task');
  const btnCloseAddTask = document.getElementById('btn-close-add-hk-task');
  const btnCancelAddTask = document.getElementById('btn-cancel-add-hk-task');
  const backdropAddTask = document.getElementById('backdrop-add-hk-task');
  const formAddTask = document.getElementById('form-add-hk-task');

  const closeAddTaskModal = () => {
    if (modalAddTask) modalAddTask.classList.add('hidden');
  };

  if (btnOpenAddTask && modalAddTask) {
    btnOpenAddTask.addEventListener('click', () => {
      modalAddTask.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    });
  }

  if (btnCloseAddTask) btnCloseAddTask.addEventListener('click', closeAddTaskModal);
  if (btnCancelAddTask) btnCancelAddTask.addEventListener('click', closeAddTaskModal);
  if (backdropAddTask) backdropAddTask.addEventListener('click', closeAddTaskModal);

  if (formAddTask) {
    formAddTask.addEventListener('submit', (e) => {
      e.preventDefault();
      const room = document.getElementById('hk-add-room-select').value;
      const type = document.getElementById('hk-add-type-select').value;
      const priority = document.getElementById('hk-add-priority-select').value;
      const status = document.getElementById('hk-add-status-select').value;
      const staff = document.getElementById('hk-add-staff-select').value;
      const image = document.getElementById('hk-add-image-select').value;
      const schedule = document.getElementById('hk-add-schedule-select').value;
      const notes = document.getElementById('hk-add-notes').value || 'Standard protocol.';

      const floor = room.charAt(0);
      const staffAvatar = staff.split(' ').map(n => n[0]).join('').toUpperCase();

      const newTask = {
        id: `hk-${Date.now()}`,
        room: room,
        floor: floor,
        roomType: `Suite ${room}`,
        title: type,
        priority: priority,
        status: status,
        staff: staff,
        staffAvatar: staffAvatar,
        staffRole: 'Housekeeping Attendant',
        image: image,
        timeText: 'Created just now',
        timeDetail: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        schedule: schedule,
        notes: notes,
        checklist: [
          { text: 'Inspect and sanitize room', done: false },
          { text: 'Change luxury linens & bedding', done: false },
          { text: 'Restock amenities and minibar', done: false }
        ]
      };

      HK_STATE.tasks.unshift(newTask);
      closeAddTaskModal();
      formAddTask.reset();
      renderHousekeeping();
      showToast(`✨ Task dispatched for Suite #${room} (${type})!`, 'success');
    });
  }

  // Context Menu Actions
  const kebabMenu = document.getElementById('hk-kebab-menu');
  if (kebabMenu) {
    kebabMenu.querySelectorAll('button[data-hk-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        kebabMenu.classList.add('hidden');
        const action = btn.getAttribute('data-hk-action');
        const task = HK_STATE.selectedTask;
        if (!task) return;

        if (action === 'details') {
          openHousekeepingDetailDrawer(task);
        } else if (action === 'start') {
          task.status = 'in-progress';
          task.timeText = '1m elapsed';
          renderHousekeeping();
          showToast(`🧹 Suite #${task.room} (${task.title}) moved to IN PROGRESS!`, 'info');
        } else if (action === 'complete') {
          task.status = 'completed';
          task.timeText = `Completed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          renderHousekeeping();
          showToast(`✨ Suite #${task.room} marked as COMPLETED!`, 'success');
        } else if (action === 'reassign') {
          const names = ['Nisha Reddy', 'Amit K.', 'Rahul C.', 'Sunita Sharma'];
          const otherNames = names.filter(n => n !== task.staff);
          task.staff = otherNames[Math.floor(Math.random() * otherNames.length)];
          task.staffAvatar = task.staff.split(' ').map(n => n[0]).join('').toUpperCase();
          renderHousekeeping();
          showToast(`Attendant reassigned to ${task.staff} for Suite #${task.room}`, 'info');
        } else if (action === 'delete') {
          HK_STATE.tasks = HK_STATE.tasks.filter(t => t.id !== task.id);
          renderHousekeeping();
          showToast(`Task for Suite #${task.room} cancelled`, 'warning');
        }
      });
    });
  }

  // Drawer status switcher buttons
  const btnPending = document.getElementById('hk-btn-switch-pending');
  const btnProgress = document.getElementById('hk-btn-switch-progress');
  const btnCompleted = document.getElementById('hk-btn-switch-completed');

  const updateDrawerStatus = (newStatus) => {
    const task = HK_STATE.selectedTask;
    if (!task) return;

    task.status = newStatus;
    if (newStatus === 'completed') {
      task.timeText = `Completed at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (newStatus === 'in-progress') {
      task.timeText = 'In progress';
    }

    // Update active button state
    [btnPending, btnProgress, btnCompleted].forEach(b => {
      if (b) b.classList.remove('active');
    });
    if (newStatus === 'pending' && btnPending) btnPending.classList.add('active');
    if (newStatus === 'in-progress' && btnProgress) btnProgress.classList.add('active');
    if (newStatus === 'completed' && btnCompleted) btnCompleted.classList.add('active');

    const pill = document.getElementById('hk-drawer-status-pill');
    if (pill) {
      pill.textContent = newStatus === 'in-progress' ? 'In Progress' : (newStatus.charAt(0).toUpperCase() + newStatus.slice(1));
      pill.style.background = newStatus === 'completed' ? 'rgba(16, 185, 129, 0.9)' : (newStatus === 'in-progress' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(239, 68, 68, 0.9)');
    }

    renderHousekeeping();
    showToast(`Status updated to ${newStatus.toUpperCase()}`, 'success');
  };

  if (btnPending) btnPending.onclick = () => updateDrawerStatus('pending');
  if (btnProgress) btnProgress.onclick = () => updateDrawerStatus('in-progress');
  if (btnCompleted) btnCompleted.onclick = () => updateDrawerStatus('completed');

  // Primary Action in Drawer
  const btnPrimaryDrawer = document.getElementById('btn-hk-drawer-primary-action');
  if (btnPrimaryDrawer) {
    btnPrimaryDrawer.onclick = () => {
      const task = HK_STATE.selectedTask;
      if (!task) return;

      if (task.status !== 'completed') {
        updateDrawerStatus('completed');
        closeDrawer('drawer-housekeeping-detail');
      } else {
        closeDrawer('drawer-housekeeping-detail');
      }
    };
  }

  // Suite Details button in Drawer
  const btnViewSuite = document.getElementById('btn-hk-drawer-view-suite');
  if (btnViewSuite) {
    btnViewSuite.onclick = () => {
      closeDrawer('drawer-housekeeping-detail');
      showScreen('rooms');
      showToast(`Navigated to Room #${HK_STATE.selectedTask ? HK_STATE.selectedTask.room : ''} Folio`, 'info');
    };
  }
}

function openHousekeepingDetailDrawer(task) {
  HK_STATE.selectedTask = task;

  const drawer = document.getElementById('drawer-housekeeping-detail');
  if (!drawer) return;

  // Hero
  const hero = document.getElementById('hk-drawer-hero');
  if (hero) {
    hero.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(29, 29, 31, 0.95) 100%), url('${task.image || 'assets/img/room-deluxe.jpg'}')`;
  }

  const titleEl = document.getElementById('hk-drawer-title');
  if (titleEl) titleEl.textContent = `Suite ${task.room} • ${task.title}`;

  const typeEl = document.getElementById('hk-drawer-room-type');
  if (typeEl) typeEl.textContent = task.roomType || 'Premium Villa';

  const statusPill = document.getElementById('hk-drawer-status-pill');
  if (statusPill) {
    const isDone = task.status === 'completed';
    const isProg = task.status === 'in-progress';
    statusPill.textContent = isDone ? 'Completed' : (isProg ? 'In Progress' : 'Pending');
    statusPill.style.background = isDone ? 'rgba(16, 185, 129, 0.9)' : (isProg ? 'rgba(59, 130, 246, 0.9)' : 'rgba(239, 68, 68, 0.9)');
  }

  const prioPill = document.getElementById('hk-drawer-priority-pill');
  if (prioPill) {
    prioPill.textContent = `${task.priority || 'Medium'} Priority`;
  }

  const timeEl = document.getElementById('hk-drawer-updated-time');
  if (timeEl) timeEl.textContent = task.timeText || 'Today';

  // Attendant
  const staffAvatar = document.getElementById('hk-drawer-staff-avatar');
  const staffName = document.getElementById('hk-drawer-staff-name');
  const staffRole = document.getElementById('hk-drawer-staff-role');
  if (staffAvatar) staffAvatar.textContent = task.staffAvatar || task.staff.substring(0, 2).toUpperCase();
  if (staffName) staffName.textContent = task.staff;
  if (staffRole) staffRole.textContent = task.staffRole || 'Housekeeping Attendant • Your Hotel';

  // Notes
  const notesText = document.getElementById('hk-drawer-notes-text');
  if (notesText) notesText.textContent = task.notes || 'Standard protocol for luxury resort sanitisation and comfort.';

  // Status Switch buttons active class
  const btnPending = document.getElementById('hk-btn-switch-pending');
  const btnProgress = document.getElementById('hk-btn-switch-progress');
  const btnCompleted = document.getElementById('hk-btn-switch-completed');
  [btnPending, btnProgress, btnCompleted].forEach(b => { if (b) b.classList.remove('active'); });
  if (task.status === 'pending' && btnPending) btnPending.classList.add('active');
  if (task.status === 'in-progress' && btnProgress) btnProgress.classList.add('active');
  if (task.status === 'completed' && btnCompleted) btnCompleted.classList.add('active');

  // Primary action button text
  const btnPrimary = document.getElementById('btn-hk-drawer-primary-action');
  if (btnPrimary) {
    btnPrimary.innerHTML = task.status === 'completed' 
      ? '<i data-lucide="check-check"></i> <span>Service Closed</span>'
      : '<i data-lucide="check"></i> <span>Complete Task</span>';
  }

  openDrawer('drawer-housekeeping-detail');
  if (window.lucide) lucide.createIcons();
}

// ==========================================
// 11. MESSAGES & COMMUNICATION SYSTEM
// ==========================================
const MSG_STATE = {
  conversations: [
    {
      id: 'conv-priya',
      name: 'Priya Sharma',
      avatar: 'PS',
      avatarClass: '',
      isVip: true,
      sub: 'Room 405 (Presidential Suite) • Oct 15 - Oct 18',
      roomTag: 'Room 405 (Presidential Suite)',
      category: 'guests',
      time: '10:42 AM',
      preview: 'Could we get some extra towels?',
      unread: 2,
      messages: [
        { type: 'date', text: 'Today, 09:30 AM' },
        { type: 'system', text: 'Guest checked in online.' },
        { type: 'sent', sender: 'AM', text: 'Welcome to Your Hotel, Ms. Sharma! We are thrilled to have you. Your Presidential Suite is ready. Let us know if you need anything.', time: '09:35 AM' },
        { type: 'received', sender: 'PS', text: 'Thank you! The suite is beautiful.', time: '09:40 AM' },
        { type: 'date', text: 'Today, 10:40 AM' },
        { type: 'received', sender: 'PS', text: 'Could we get some extra towels for the pool?', time: '10:40 AM' },
        { type: 'received', sender: 'PS', text: 'Also, what time is the cultural performance this evening?', time: '10:42 AM' }
      ]
    },
    {
      id: 'conv-arjun',
      name: 'Arjun Mehta',
      avatar: 'AM',
      avatarClass: 'peach',
      isVip: false,
      sub: 'Room 101 (Deluxe Room) • Oct 24 - Oct 27',
      roomTag: 'Room 101 (Deluxe)',
      category: 'guests',
      time: '09:15 AM',
      preview: 'Thank you, the breakfast was amazing.',
      unread: 0,
      messages: [
        { type: 'date', text: 'Today, 08:30 AM' },
        { type: 'sent', sender: 'AM', text: 'Good morning Mr. Mehta! Hope you enjoyed the breakfast spread at the Restaurant.', time: '08:45 AM' },
        { type: 'received', sender: 'AM', text: 'Thank you, the breakfast was amazing! The fresh Jalebis and Ker Sangri were divine.', time: '09:15 AM' }
      ]
    },
    {
      id: 'conv-hk',
      name: 'Housekeeping Team',
      avatar: 'HK',
      avatarClass: 'green',
      isVip: false,
      sub: 'Floor 1 - Floor 5 Internal Staff Channel',
      roomTag: 'Staff',
      category: 'staff',
      time: 'Yesterday',
      preview: 'Room 302 is ready for check-in.',
      unread: 1,
      messages: [
        { type: 'date', text: 'Yesterday, 04:15 PM' },
        { type: 'received', sender: 'HK', text: 'Suite 302 deep clean and white-glove inspection completed. Ready for check-in.', time: '04:15 PM' },
        { type: 'sent', sender: 'AM', text: 'Excellent job Nisha! Dispatching keycards to reception desk.', time: '04:20 PM' }
      ]
    },
    {
      id: 'conv-rahul',
      name: 'Rahul Kapoor',
      avatar: 'RK',
      avatarClass: 'slate',
      isVip: false,
      sub: 'Room 302 (Premium Villa) • Oct 22 - Oct 25',
      roomTag: 'Room 302',
      category: 'guests',
      time: 'Yesterday',
      preview: 'Can you arrange a taxi to the airport?',
      unread: 0,
      messages: [
        { type: 'date', text: 'Yesterday, 06:00 PM' },
        { type: 'received', sender: 'RK', text: 'Can you arrange a private luxury taxi to the Airport tomorrow at 11 AM?', time: '06:00 PM' },
        { type: 'sent', sender: 'AM', text: 'Certainly Mr. Kapoor! A chauffeur-driven Innova Crysta has been confirmed for 11:00 AM.', time: '06:10 PM' }
      ]
    },
    {
      id: 'conv-ananya',
      name: 'Ananya Singh',
      avatar: 'AS',
      avatarClass: 'purple',
      isVip: false,
      sub: 'Room 104 (Garden Terrace Suite) • Oct 10 - Oct 14',
      roomTag: 'Room 104 (Deluxe)',
      category: 'guests',
      time: 'Oct 10',
      preview: 'What time does the spa open?',
      unread: 0,
      messages: [
        { type: 'date', text: 'Oct 10, 03:00 PM' },
        { type: 'received', sender: 'AS', text: 'Hi! What time does the Ayurvedic Spa & Wellness Sanctuary open tomorrow morning?', time: '03:00 PM' },
        { type: 'sent', sender: 'AM', text: 'Welcome Ms. Singh! The Spa opens at 7:00 AM. We have reserved a complimentary herbal tea session for you.', time: '03:05 PM' }
      ]
    },
    {
      id: 'conv-kiran',
      name: 'Kiran Patel',
      avatar: 'KP',
      avatarClass: 'amber',
      isVip: false,
      sub: 'Room 201 (Premium Suite) • Oct 09 - Oct 12',
      roomTag: 'Room 201',
      category: 'guests',
      time: 'Oct 09',
      preview: 'Is late check-out available?',
      unread: 0,
      messages: [
        { type: 'date', text: 'Oct 09, 07:45 PM' },
        { type: 'received', sender: 'KP', text: 'Is late check-out available for Room 201 on Sunday?', time: '07:45 PM' },
        { type: 'sent', sender: 'AM', text: 'Yes Mr. Patel! Late check-out until 2:00 PM has been granted for your suite.', time: '07:50 PM' }
      ]
    }
  ],
  activeConvId: 'conv-priya',
  activeFilter: 'all',
  searchQuery: ''
};

function setupChat() {
  setupMessages();
}

function setupMessages() {
  renderConversationsList();
  renderActiveChat();
  bindMessagesEvents();
}

function renderConversationsList() {
  const container = document.getElementById('msg-conversations-list');
  if (!container) return;

  const filtered = MSG_STATE.conversations.filter(c => {
    // Filter pills
    if (MSG_STATE.activeFilter === 'guests' && c.category !== 'guests') return false;
    if (MSG_STATE.activeFilter === 'staff' && c.category !== 'staff') return false;
    if (MSG_STATE.activeFilter === 'unread' && c.unread === 0) return false;

    // Search query
    if (MSG_STATE.searchQuery) {
      const q = MSG_STATE.searchQuery.toLowerCase();
      const match = c.name.toLowerCase().includes(q) ||
                    c.preview.toLowerCase().includes(q) ||
                    (c.roomTag && c.roomTag.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-sm text-muted p-4 text-center">No conversations found</div>';
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isActive = c.id === MSG_STATE.activeConvId;
    const vipBadge = c.isVip ? '<span class="msg-badge-vip">VIP</span>' : '';
    const unreadBadge = c.unread > 0 ? `<span class="msg-unread-badge">${c.unread}</span>` : '';
    const tagClass = c.category === 'staff' ? 'staff-tag' : 'text-muted';

    return `
      <div class="msg-conv-item ${isActive ? 'active' : ''}" data-conv-id="${c.id}" data-category="${c.category}">
        <div class="msg-avatar ${c.avatarClass}">${c.avatar}</div>
        <div class="msg-conv-details">
          <div class="msg-conv-top">
            <div class="msg-conv-name">
              <span>${c.name}</span>
              ${vipBadge}
            </div>
            <span class="msg-conv-time">${c.time}</span>
          </div>
          <div class="msg-conv-text">${c.preview}</div>
          <div class="msg-conv-bottom">
            <span class="msg-room-tag ${tagClass}">${c.roomTag}</span>
            ${unreadBadge}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind click on conversation items
  container.querySelectorAll('.msg-conv-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-conv-id');
      if (id) {
        MSG_STATE.activeConvId = id;
        const conv = MSG_STATE.conversations.find(c => c.id === id);
        if (conv) conv.unread = 0; // Clear unread on open
        renderConversationsList();
        renderActiveChat();
      }
    });
  });
}

function renderActiveChat() {
  const conv = MSG_STATE.conversations.find(c => c.id === MSG_STATE.activeConvId);
  if (!conv) return;

  // Header updates
  const avatarEl = document.getElementById('msg-active-avatar');
  const nameEl = document.getElementById('msg-active-name');
  const badgeEl = document.getElementById('msg-active-badge');
  const subEl = document.getElementById('msg-active-sub');

  if (avatarEl) {
    avatarEl.textContent = conv.avatar;
    avatarEl.className = `msg-header-avatar ${conv.avatarClass}`;
  }
  if (nameEl) nameEl.textContent = conv.name;
  if (badgeEl) {
    if (conv.isVip) {
      badgeEl.classList.remove('hidden');
      badgeEl.style.display = 'inline-block';
    } else {
      badgeEl.style.display = 'none';
    }
  }
  if (subEl) subEl.textContent = conv.sub;

  // Messages history rendering
  const msgContainer = document.getElementById('msg-chat-messages');
  if (!msgContainer) return;

  msgContainer.innerHTML = conv.messages.map(m => {
    if (m.type === 'date') {
      return `<div class="msg-date-divider"><span>${m.text}</span></div>`;
    }
    if (m.type === 'system') {
      return `
        <div class="msg-system-event">
          <i data-lucide="check-circle-2" style="color: #10B981; width: 14px; height: 14px;"></i>
          <span>${m.text}</span>
        </div>`;
    }
    if (m.type === 'sent') {
      return `
        <div class="msg-bubble-wrap sent">
          <div class="msg-bubble-avatar">${m.sender || 'AM'}</div>
          <div class="msg-bubble-content">
            <div class="msg-bubble-text">${m.text}</div>
            <div class="msg-bubble-meta">
              <span>${m.time || 'Now'}</span>
              <i data-lucide="check-check" class="read-receipt"></i>
            </div>
          </div>
        </div>`;
    }
    // received
    return `
      <div class="msg-bubble-wrap received">
        <div class="msg-bubble-avatar guest ${conv.avatarClass}">${m.sender || conv.avatar}</div>
        <div class="msg-bubble-content">
          <div class="msg-bubble-text">${m.text}</div>
          <div class="msg-bubble-meta">
            <span>${m.time || 'Now'}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  // Append hidden typing indicator
  msgContainer.insertAdjacentHTML('beforeend', `
    <div class="typing-indicator hidden" id="msg-typing-indicator">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  `);

  msgContainer.scrollTop = msgContainer.scrollHeight;

  if (window.lucide) lucide.createIcons();
}

function bindMessagesEvents() {
  // Filter pills
  const pills = document.querySelectorAll('.msg-filter-pill');
  pills.forEach(p => {
    p.addEventListener('click', () => {
      pills.forEach(b => b.classList.remove('active'));
      p.classList.add('active');
      MSG_STATE.activeFilter = p.getAttribute('data-filter');
      renderConversationsList();
    });
  });

  // Search input
  const searchInput = document.getElementById('msg-search-input');
  const searchClear = document.getElementById('msg-search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      MSG_STATE.searchQuery = val;
      if (searchClear) {
        if (val.length > 0) searchClear.classList.remove('hidden');
        else searchClear.classList.add('hidden');
      }
      renderConversationsList();
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      MSG_STATE.searchQuery = '';
      searchClear.classList.add('hidden');
      renderConversationsList();
    });
  }

  // Send message handler
  const sendBtn = document.getElementById('btn-msg-send');
  const inputField = document.getElementById('msg-input-field');

  const sendMessageAction = (textOverride) => {
    const text = (textOverride || (inputField ? inputField.value.trim() : '')).trim();
    if (!text) return;

    const conv = MSG_STATE.conversations.find(c => c.id === MSG_STATE.activeConvId);
    if (!conv) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Push sent message
    conv.messages.push({
      type: 'sent',
      sender: 'AM',
      text: text,
      time: nowStr
    });
    conv.preview = text;
    conv.time = 'Just now';

    if (inputField) inputField.value = '';
    renderConversationsList();
    renderActiveChat();

    // Show typing indicator
    const msgContainer = document.getElementById('msg-chat-messages');
    const typingIndicator = document.getElementById('msg-typing-indicator');
    if (typingIndicator) {
      typingIndicator.classList.remove('hidden');
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    // Intelligent auto-reply logic
    let replyText = "Thank you! Our concierge team will arrange that immediately.";
    const lower = text.toLowerCase();
    if (lower.includes('towel') || lower.includes('pool') || lower.includes('amenity')) {
      replyText = "Housekeeping is on the way to Suite 405 with extra plush pool towels! 🏊‍♂️";
    } else if (lower.includes('performance') || lower.includes('show') || lower.includes('cultural') || lower.includes('time')) {
      replyText = "Live music evening starts at 7:30 PM in the Garden Courtyard! 🎶";
    } else if (lower.includes('food') || lower.includes('dinner') || lower.includes('menu') || lower.includes('restaurant')) {
      replyText = "Our chef's special at the Restaurant is served from 7:00 PM to 11:00 PM. Would you like a table reserved?";
    } else if (lower.includes('welcome') || lower.includes('hello') || lower.includes('hi')) {
      replyText = "Welcome! It is our absolute pleasure to host you at Your Hotel. 🙏";
    } else if (lower.includes('checkout') || lower.includes('check-out') || lower.includes('late')) {
      replyText = "Complimentary late check-out until 1:00 PM has been granted for your suite! ✨";
    }

    setTimeout(() => {
      if (typingIndicator) typingIndicator.classList.add('hidden');
      conv.messages.push({
        type: 'received',
        sender: conv.avatar,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      conv.preview = replyText;
      renderConversationsList();
      renderActiveChat();
    }, 1400);
  };

  if (sendBtn) sendBtn.onclick = () => sendMessageAction();
  if (inputField) {
    inputField.onkeypress = (e) => {
      if (e.key === 'Enter') sendMessageAction();
    };
  }

  // Quick reply pills
  document.querySelectorAll('.msg-quick-pill').forEach(pill => {
    pill.onclick = () => {
      sendMessageAction(pill.textContent.replace(/[🧹🪕✨]/g, '').trim());
    };
  });

  // Voice / Video Call Modal Trigger
  const btnCall = document.getElementById('btn-call-guest');
  const btnVideo = document.getElementById('btn-video-guest');
  const modalCall = document.getElementById('modal-voice-call');
  const btnEndCall = document.getElementById('btn-call-end');
  const backdropCall = document.getElementById('backdrop-voice-call');

  const openCallModal = (isVideo = false) => {
    const conv = MSG_STATE.conversations.find(c => c.id === MSG_STATE.activeConvId);
    if (!conv || !modalCall) return;

    const avatarEl = document.getElementById('modal-call-avatar');
    const nameEl = document.getElementById('modal-call-name');
    const subEl = document.getElementById('modal-call-sub');
    const timerEl = document.getElementById('modal-call-timer');

    if (avatarEl) avatarEl.textContent = conv.avatar;
    if (nameEl) nameEl.textContent = isVideo ? `Video Calling ${conv.name}...` : `Calling ${conv.name}...`;
    if (subEl) subEl.textContent = `${conv.roomTag || 'Guest Suite'} • Direct Intercom`;
    if (timerEl) timerEl.textContent = 'Ringing...';

    modalCall.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (timerEl) timerEl.textContent = 'Connected • 00:01';
    }, 2200);
  };

  if (btnCall) btnCall.onclick = () => openCallModal(false);
  if (btnVideo) btnVideo.onclick = () => openCallModal(true);

  if (btnEndCall && modalCall) {
    btnEndCall.onclick = () => {
      modalCall.classList.add('hidden');
      showToast('Call ended', 'info');
    };
  }

  if (backdropCall && modalCall) {
    backdropCall.onclick = () => {
      modalCall.classList.add('hidden');
    };
  }

  // Paperclip Attachment Button
  const btnAttach = document.getElementById('btn-msg-attach');
  if (btnAttach) {
    btnAttach.onclick = () => {
      showToast('📎 Attachment options: Dispatch Folio, Keycard Digital Key, or Photo', 'info');
    };
  }

  // Emoji Button
  const btnEmoji = document.getElementById('btn-msg-emoji');
  if (btnEmoji) {
    btnEmoji.onclick = () => {
      if (inputField) inputField.value += ' 🙏✨';
      showToast('Emoji added to message', 'info');
    };
  }
}

// ==========================================
// 12. SEARCH MODAL (SPOTLIGHT)
// ==========================================
function setupSearch() {
  const searchBtn = document.querySelector('#search-trigger, .search-trigger, .topbar-search-btn');
  const searchModal = document.getElementById('search-modal');
  if (!searchModal) return;
  
  const searchInput = searchModal.querySelector('input');
  const escBadge = searchModal.querySelector('.esc-badge');
  
  const openSearch = () => {
    searchModal.classList.remove('hidden');
    searchModal.style.display = 'flex';
    setTimeout(() => searchModal.classList.add('active'), 10);
    if (searchInput) searchInput.focus();
  };
  
  const closeSearch = () => {
    searchModal.classList.remove('active');
    setTimeout(() => {
      searchModal.style.display = 'none';
      searchModal.classList.add('hidden');
    }, 250);
  };

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (escBadge) escBadge.addEventListener('click', closeSearch);
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });
  
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchModal.classList.contains('active') ? closeSearch() : openSearch();
    }
    if (e.key === 'Escape' && searchModal.classList.contains('active')) {
      closeSearch();
    }
  });
  
  // Mock search logic
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const val = e.target.value.toLowerCase().trim();
      const resultsContainer = searchModal.querySelector('.search-results');
      if (!resultsContainer) return;
      
      if (val.length > 0) {
        resultsContainer.innerHTML = '';
        const matches = MOCK_DATA.searchItems.filter(i => 
          i.title.toLowerCase().includes(val) || 
          i.subtitle.toLowerCase().includes(val)
        );
        
        if (matches.length === 0) {
          resultsContainer.innerHTML = `<div class="p-4 text-center text-muted">No results found for "${val}"</div>`;
          return;
        }
        
        matches.forEach(m => {
          const item = document.createElement('div');
          item.className = 'result-item';
          item.innerHTML = `
            <i data-lucide="${m.icon || 'search'}"></i> 
            <div style="flex:1;">
              <strong>${m.title}</strong>
              <div style="font-size:0.8rem; color:var(--text-muted);">${m.subtitle}</div>
            </div>
            <span class="badge badge-info">${m.type}</span>
          `;
          item.addEventListener('click', () => {
            closeSearch();
            if (m.type === 'room') {
              showScreen('rooms');
              openDrawer('room-detail');
            } else if (m.type === 'booking') {
              showScreen('reservations');
              openDrawer('booking-drawer');
            } else {
              showScreen('reservations');
            }
            showToast(`Navigated to ${m.title}`, 'info');
          });
          resultsContainer.appendChild(item);
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }, 150));
  }
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ==========================================
// 13. NOTIFICATION PANEL
// ==========================================
function setupNotifications() {
  const bellBtn = document.querySelector('#notification-btn, .notification-trigger, .topbar-notifications');
  const panel = document.getElementById('notification-panel');
  
  if (bellBtn && panel) {
    bellBtn.addEventListener('click', () => openDrawer('notification-panel'));
  }
  
  if (panel) {
    const markReadBtn = panel.querySelector('.btn-text, .mark-all-read');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        const badge = document.querySelector('.badge-count, .notification-badge-dot, .notification-badge');
        if (badge) badge.style.display = 'none';
        panel.querySelectorAll('.unread').forEach(u => u.classList.remove('unread'));
        panel.querySelectorAll('.unread-dot').forEach(d => d.style.display = 'none');
        const headerBadge = panel.querySelector('.notif-header-badge');
        if (headerBadge) headerBadge.style.display = 'none';
        showToast('All notifications marked as read', 'success');
      });
    }
  }
}

// ==========================================
// 14. RESERVATIONS & CALENDAR ENGINE
// ==========================================
function setupCalendar() {
  setupReservationsScreen();
}

function setupReservationsScreen() {
  const container = document.getElementById('screen-reservations');
  if (!container) return;

  // New Booking Button Trigger
  const newBookingBtn = document.getElementById('res-open-booking-btn');
  if (newBookingBtn) {
    newBookingBtn.addEventListener('click', () => {
      openDrawer('booking-drawer');
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  // Cards & Search Filter Logic
  const cards = container.querySelectorAll('.res-card-item');
  const searchInput = document.getElementById('res-search-input');
  const roomFilter = document.getElementById('res-filter-room');
  const statusFilter = document.getElementById('res-filter-status');
  const paymentFilter = document.getElementById('res-filter-payment');
  const applyBtn = document.getElementById('res-btn-apply');
  const clearBtn = document.getElementById('res-clear-filters');
  const statusTabs = container.querySelectorAll('.res-tab-pill');

  let activeTabStatus = 'all';

  function filterCards() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedRoom = roomFilter ? roomFilter.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    const selectedPayment = paymentFilter ? paymentFilter.value : '';

    cards.forEach(card => {
      const name = (card.getAttribute('data-name') || '').toLowerCase();
      const id = (card.getAttribute('data-id') || '').toLowerCase();
      const room = card.getAttribute('data-room') || '';
      const status = card.getAttribute('data-status') || '';
      const payment = card.getAttribute('data-payment') || '';

      let matches = true;

      // Status tab match
      if (activeTabStatus !== 'all' && status !== activeTabStatus) {
        matches = false;
      }

      // Search match
      if (query && !name.includes(query) && !id.includes(query) && !room.toLowerCase().includes(query)) {
        matches = false;
      }

      // Dropdown matches
      if (selectedRoom && room !== selectedRoom) {
        matches = false;
      }
      if (selectedStatus && status !== selectedStatus) {
        matches = false;
      }
      if (selectedPayment && payment !== selectedPayment) {
        matches = false;
      }

      card.style.display = matches ? 'grid' : 'none';
    });
  }

  // Real-time search
  if (searchInput) {
    searchInput.addEventListener('input', filterCards);
  }

  // Filter tabs
  statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTabStatus = tab.getAttribute('data-status') || 'all';
      filterCards();
    });
  });

  // Apply filters button
  if (applyBtn) {
    applyBtn.addEventListener('click', filterCards);
  }

  // Clear filters
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (roomFilter) roomFilter.value = '';
      if (statusFilter) statusFilter.value = '';
      if (paymentFilter) paymentFilter.value = '';
      activeTabStatus = 'all';
      statusTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-status') === 'all'));
      filterCards();
      showToast('Filters cleared', 'info');
    });
  }

  // Mini Calendar date click
  const dateCells = container.querySelectorAll('.res-cal-cell:not(.muted)');
  dateCells.forEach(cell => {
    cell.addEventListener('click', () => {
      dateCells.forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
      const dateNum = cell.getAttribute('data-date');
      showToast(`Showing reservations for ${dateNum} October 2026`, 'info');
      
      // Filter list to simulate date selection
      if (dateNum === '12') {
        cards.forEach(card => card.style.display = 'grid');
      } else {
        cards.forEach((card, idx) => {
          card.style.display = (idx % 2 === 0) ? 'grid' : 'none';
        });
      }
    });
  });

  // Sort toggle
  const sortBtn = document.getElementById('res-sort-btn');
  let sortAsc = true;
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      sortAsc = !sortAsc;
      const cardsContainer = document.getElementById('res-cards-list');
      if (cardsContainer) {
        const sorted = Array.from(cards).sort((a, b) => {
          const nameA = a.getAttribute('data-name') || '';
          const nameB = b.getAttribute('data-name') || '';
          return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
        sorted.forEach(c => cardsContainer.appendChild(c));
        showToast(sortAsc ? 'Sorted A-Z by guest name' : 'Sorted Z-A by guest name', 'info');
      }
    });
  }

  // Card action menu button
  const actionBtns = container.querySelectorAll('.res-more-btn');
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.res-card-item');
      const guestName = card ? card.getAttribute('data-name') : 'Guest';
      showToast(`Reservation menu opened for ${guestName}`, 'info');
    });
  });

  // Card click opens booking details
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const guestName = card.getAttribute('data-name');
      const bookingId = card.getAttribute('data-id');
      const room = card.getAttribute('data-room');
      showToast(`Folio #${bookingId} for ${guestName} (${room})`, 'info');
    });
  });

  // ==========================================================================
  // Apple iOS-Style Full-Page Interactive Calendar View (Month, Week, Day)
  // ==========================================================================
  const OCTOBER_BOOKINGS = {
    10: [
      { id: 'BK126002', name: 'Priya Mehta', room: 'Suite Room 501', time: '02:00 PM', hour: 14, type: 'Check-in', status: 'Checked-in', price: '₹52,000', guests: '2 Adults', avatar: 'PM' }
    ],
    11: [
      { id: 'BK126005', name: 'Karan Malhotra', room: 'Deluxe Room 205', time: '01:00 PM', hour: 13, type: 'Check-in', status: 'Checked-in', price: '₹21,000', guests: '2 Adults', avatar: 'KM' }
    ],
    12: [
      { id: 'BK126008', name: 'Ananya Kapoor', room: 'Garden Cottage 401', time: '11:00 AM', hour: 11, type: 'Departure', status: 'Checked-out', price: '₹38,000', guests: '2 Adults', avatar: 'AK' },
      { id: 'BK126001', name: 'Rahul Sharma', room: 'Deluxe Room 203', time: '12:00 PM', hour: 12, type: 'Arrival', status: 'Confirmed', price: '₹24,000', guests: '2 Adults, 1 Child', avatar: 'RS' }
    ],
    13: [
      { id: 'BK126003', name: 'Amit Khanna', room: 'Deluxe Room 102', time: '03:00 PM', hour: 15, type: 'Arrival', status: 'Pending', price: '₹26,000', guests: '1 Adult', avatar: 'AK' }
    ],
    14: [
      { id: 'BK126004', name: 'Neha Verma', room: 'Premium Suite 305', time: '02:00 PM', hour: 14, type: 'Arrival', status: 'Confirmed', price: '₹44,000', guests: '2 Adults', avatar: 'NV' }
    ],
    15: [
      { id: 'BK126006', name: 'Sneha Kapoor', room: 'Deluxe Room 108', time: '01:00 PM', hour: 13, type: 'Arrival', status: 'Pending', price: '₹19,500', guests: '2 Adults', avatar: 'SK' }
    ],
    16: [
      { id: 'BK126007', name: 'Vikram Malhotra', room: 'Presidential Suite 505', time: '12:00 PM', hour: 12, type: 'VIP Arrival', status: 'Confirmed', price: '₹1,20,000', guests: '3 Adults, 1 Child', avatar: 'VM' }
    ],
    18: [
      { id: 'BK126009', name: 'Rohan Deshmukh', room: 'Pool Cabana 404', time: '02:00 PM', hour: 14, type: 'Cancelled', status: 'Cancelled', price: '₹30,000', guests: '2 Adults', avatar: 'RD' }
    ],
    20: [
      { id: 'BK126010', name: 'Kabir Singhania', room: 'Executive Suite 502', time: '02:30 PM', hour: 14, type: 'Arrival', status: 'Confirmed', price: '₹64,000', guests: '2 Adults', avatar: 'KS' }
    ]
  };

  let activeCalendarDay = 12;
  let activeCalendarView = 'week';

  const resListView = document.getElementById('res-list-view');
  const resCalendarView = document.getElementById('res-calendar-view');
  const expandCalBtns = [
    document.getElementById('res-expand-cal-btn'),
    document.getElementById('res-header-calendar-toggle')
  ];
  const backToListBtn = document.getElementById('ios-calendar-back-btn');
  const tabMonth = document.getElementById('tab-view-month');
  const tabWeek = document.getElementById('tab-view-week');
  const tabDay = document.getElementById('tab-view-day');
  const monthContainer = document.getElementById('ios-view-month-container');
  const weekContainer = document.getElementById('ios-view-week-container');
  const dayContainer = document.getElementById('ios-view-day-container');
  const fullGrid = document.getElementById('ios-full-calendar-cells');
  const jumpTodayBtn = document.getElementById('ios-jump-today');
  const newBookingCalBtn = document.getElementById('ios-cal-new-btn');
  const weekGridBody = document.getElementById('ios-week-grid-body');
  const dayHoursList = document.getElementById('ios-day-hours-list');
  const dayPrevBtn = document.getElementById('ios-day-prev');
  const dayNextBtn = document.getElementById('ios-day-next');
  const dayViewHeading = document.getElementById('ios-day-view-heading');

  function getPillClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 'pill-blue';
      case 'checked-in': return 'pill-green';
      case 'pending': return 'pill-amber';
      case 'checked-out': return 'pill-purple';
      case 'cancelled': return 'pill-rose';
      default: return 'pill-blue';
    }
  }

  function getStatusBadgeClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 'confirmed';
      case 'checked-in': return 'checked-in';
      case 'pending': return 'pending';
      case 'checked-out': return 'checked-out';
      case 'cancelled': return 'cancelled';
      default: return 'confirmed';
    }
  }

  function getEventColorClass(status) {
    switch ((status || '').toLowerCase()) {
      case 'confirmed': return 'event-blue';
      case 'checked-in': return 'event-green';
      case 'pending': return 'event-amber';
      case 'checked-out': return 'event-purple';
      case 'cancelled': return 'event-rose';
      default: return 'event-blue';
    }
  }

  function getWeekdayName(dayNum) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekIdx = (4 + (parseInt(dayNum, 10) - 1)) % 7;
    return weekdays[dayOfWeekIdx];
  }

  // 1. MONTH VIEW INSPECTOR
  function renderDayInspector(dayNum) {
    activeCalendarDay = parseInt(dayNum, 10);
    const weekdayName = getWeekdayName(activeCalendarDay);

    const weekdayEl = document.getElementById('ios-insp-weekday');
    const dateEl = document.getElementById('ios-insp-date');
    const countEl = document.getElementById('ios-insp-count');
    const timelineEl = document.getElementById('ios-insp-timeline');

    if (weekdayEl) weekdayEl.textContent = weekdayName;
    if (dateEl) dateEl.textContent = `${activeCalendarDay} October 2026`;

    const bookings = OCTOBER_BOOKINGS[activeCalendarDay] || [];
    if (countEl) {
      countEl.textContent = bookings.length === 1 ? '1 Stay' : `${bookings.length} Stays`;
    }

    if (!timelineEl) return;

    if (bookings.length === 0) {
      timelineEl.innerHTML = `
        <div style="background: #FFFFFF; border-radius: 14px; padding: 32px 20px; text-align: center; border: 1px dashed rgba(0,0,0,0.12);">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: #F3F4F6; color: #9CA3AF; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
            <i data-lucide="calendar" style="width: 22px; height: 22px;"></i>
          </div>
          <h4 style="font-size: 0.95rem; font-weight: 600; color: #111827; margin: 0 0 4px 0;">No Stays Scheduled</h4>
          <p style="font-size: 0.82rem; color: #6B7280; margin: 0 0 16px 0;">There are no arrivals or departures on this date.</p>
          <button type="button" class="btn-res-primary" style="padding: 8px 16px; font-size: 0.82rem; margin: 0 auto;" onclick="openDrawer('booking-drawer')">
            <i data-lucide="plus"></i> <span>+ Book Stays</span>
          </button>
        </div>
      `;
    } else {
      timelineEl.innerHTML = bookings.map(b => `
        <div class="ios-timeline-item">
          <div class="ios-item-top">
            <span class="ios-item-time"><i data-lucide="clock" style="width: 14px; height: 14px;"></i> ${b.time} &bull; ${b.type}</span>
            <span class="ios-item-status ${getStatusBadgeClass(b.status)}">${b.status}</span>
          </div>
          <div class="ios-item-guest">
            <div class="ios-guest-avatar">${b.avatar}</div>
            <div>
              <h4 class="ios-guest-name">${b.name}</h4>
              <p class="ios-guest-room">${b.room} &bull; ${b.guests}</p>
            </div>
          </div>
          <div class="ios-item-bottom">
            <span class="ios-item-price">${b.price}</span>
            <button type="button" class="ios-action-link" onclick="showToast('Folio #${b.id} for ${b.name}', 'info')">View Folio &rarr;</button>
          </div>
        </div>
      `).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // 1. MONTH VIEW GRID
  function renderFullCalendarGrid(activeDay = 12) {
    if (!fullGrid) return;
    fullGrid.innerHTML = '';
    activeCalendarDay = parseInt(activeDay, 10);

    // Leading muted days from Sept (27, 28, 29, 30)
    [27, 28, 29, 30].forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'ios-cal-day-cell muted';
      cell.innerHTML = `<span class="ios-day-num">${d}</span>`;
      fullGrid.appendChild(cell);
    });

    // October 1 to 31
    for (let day = 1; day <= 31; day++) {
      const cell = document.createElement('div');
      cell.className = 'ios-cal-day-cell' + (day === activeCalendarDay ? ' active' : '');
      cell.setAttribute('data-day', day);

      const bookings = OCTOBER_BOOKINGS[day] || [];
      const pillsHtml = bookings.slice(0, 2).map(b => {
        const shortRoom = b.room.split(' ')[0];
        const shortName = b.name.split(' ')[0];
        return `<span class="ios-event-pill ${getPillClass(b.status)}" title="${b.name} (${b.room})">${shortRoom} &bull; ${shortName}</span>`;
      }).join('');

      const moreCount = bookings.length > 2 ? `<span class="ios-event-pill pill-blue">+${bookings.length - 2} more</span>` : '';

      cell.innerHTML = `
        <span class="ios-day-num">${day}</span>
        ${pillsHtml}
        ${moreCount}
      `;

      cell.addEventListener('click', () => {
        fullGrid.querySelectorAll('.ios-cal-day-cell').forEach(c => c.classList.remove('active'));
        cell.classList.add('active');
        renderDayInspector(day);
      });

      fullGrid.appendChild(cell);
    }

    renderDayInspector(activeCalendarDay);
  }

  // 2. WEEK VIEW SCHEDULE
  function renderWeekSchedule() {
    if (!weekGridBody) return;
    weekGridBody.innerHTML = '';

    const weekDays = [11, 12, 13, 14, 15, 16, 17];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

    hours.forEach(hour => {
      const row = document.createElement('div');
      row.className = 'ios-week-hour-row';

      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const timeLabel = `${displayHour < 10 ? '0' : ''}${displayHour}:00 ${period}`;

      let colsHtml = `<div class="ios-week-hour-time">${timeLabel}</div>`;

      weekDays.forEach(day => {
        const dayBookings = OCTOBER_BOOKINGS[day] || [];
        const matchingBookings = dayBookings.filter(b => b.hour === hour);

        let cellContent = '';
        matchingBookings.forEach(b => {
          cellContent += `
            <div class="ios-week-event-card ${getEventColorClass(b.status)}" data-id="${b.id}" onclick="showToast('Folio #${b.id}: ${b.name} - ${b.room}', 'info')">
              <div class="ev-title">${b.name}</div>
              <div class="ev-sub">${b.room} &bull; ${b.time}</div>
            </div>
          `;
        });

        colsHtml += `<div class="ios-week-col-cell" data-day="${day}" data-hour="${hour}">${cellContent}</div>`;
      });

      row.innerHTML = colsHtml;
      weekGridBody.appendChild(row);
    });

    // Make week column headers clickable to jump straight to that day's Day View
    document.querySelectorAll('.ios-week-day-col-header').forEach(header => {
      header.addEventListener('click', () => {
        const clickedDay = parseInt(header.getAttribute('data-day'), 10);
        if (clickedDay) {
          activeCalendarDay = clickedDay;
          switchViewMode('day');
        }
      });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // 3. DAY VIEW TIMELINE
  function renderDayTimelineView(dayNum) {
    activeCalendarDay = parseInt(dayNum, 10);
    if (!dayHoursList) return;
    dayHoursList.innerHTML = '';

    const weekdayName = getWeekdayName(activeCalendarDay);
    if (dayViewHeading) {
      dayViewHeading.textContent = `${weekdayName}, ${activeCalendarDay} October 2026`;
    }

    const dayBookings = OCTOBER_BOOKINGS[activeCalendarDay] || [];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

    hours.forEach(hour => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      const timeLabel = `${displayHour < 10 ? '0' : ''}${displayHour}:00 ${period}`;

      const matchingBookings = dayBookings.filter(b => b.hour === hour);

      const row = document.createElement('div');
      row.className = 'ios-day-slot-row';

      let slotContentHtml = '';
      if (matchingBookings.length > 0) {
        slotContentHtml = matchingBookings.map(b => `
          <div class="ios-day-booking-card">
            <div class="ios-day-card-left">
              <div class="ios-day-avatar">${b.avatar}</div>
              <div class="ios-day-card-info">
                <h4>${b.name} <span class="ios-item-status ${getStatusBadgeClass(b.status)}">${b.status}</span></h4>
                <p><i data-lucide="bed" style="width: 13px; height: 13px; vertical-align: -2px; display: inline-block;"></i> ${b.room} &bull; ${b.guests} &bull; ${b.type} &bull; <strong>${b.time}</strong></p>
              </div>
            </div>
            <div class="ios-day-card-right">
              <span class="ios-day-card-price">${b.price}</span>
              <div class="ios-day-actions">
                <button type="button" class="btn-res-secondary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="showToast('Folio #${b.id} for ${b.name}', 'info')">
                  <span>View Folio</span>
                </button>
                <button type="button" class="btn-res-primary" style="padding: 6px 14px; font-size: 0.8rem;" onclick="showToast('${b.type} processed for ${b.name}', 'success')">
                  <span>Manage</span>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        slotContentHtml = `
          <div class="ios-day-empty-slot">
            <span>No arrivals or departures scheduled at ${timeLabel}</span>
            <button type="button" class="btn-res-secondary" style="padding: 4px 10px; font-size: 0.74rem; border-style: dashed;" onclick="openDrawer('booking-drawer')">
              <i data-lucide="plus" style="width: 12px; height: 12px;"></i> <span>Add Booking</span>
            </button>
          </div>
        `;
      }

      row.innerHTML = `
        <div class="ios-day-slot-time">${timeLabel}</div>
        <div class="ios-day-slot-content">${slotContentHtml}</div>
      `;

      dayHoursList.appendChild(row);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // View Mode Switcher: Month, Week, Day
  function switchViewMode(view) {
    activeCalendarView = view;
    if (tabMonth) tabMonth.classList.toggle('active', view === 'month');
    if (tabWeek) tabWeek.classList.toggle('active', view === 'week');
    if (tabDay) tabDay.classList.toggle('active', view === 'day');

    if (monthContainer) monthContainer.classList.toggle('hidden', view !== 'month');
    if (weekContainer) weekContainer.classList.toggle('hidden', view !== 'week');
    if (dayContainer) dayContainer.classList.toggle('hidden', view !== 'day');

    if (view === 'month') {
      renderFullCalendarGrid(activeCalendarDay);
    } else if (view === 'week') {
      renderWeekSchedule();
    } else if (view === 'day') {
      renderDayTimelineView(activeCalendarDay);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Open Full-Page Calendar (Pure page, defaults to Week view)
  function openCalendarFullPage(view = 'week') {
    if (resListView) resListView.classList.add('hidden');
    if (resCalendarView) resCalendarView.classList.remove('hidden');
    switchViewMode(view);
    showToast('Viewing Week Calendar', 'info');
  }

  // Back to List View
  function closeCalendarFullPage() {
    if (resCalendarView) resCalendarView.classList.add('hidden');
    if (resListView) resListView.classList.remove('hidden');
    showToast('Back to Bookings List View', 'info');
  }

  // Event Listeners for Open / Close
  expandCalBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCalendarFullPage(activeCalendarView || 'week');
      });
    }
  });

  if (backToListBtn) {
    backToListBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeCalendarFullPage();
    });
  }

  // Tab switcher clicks
  if (tabMonth) {
    tabMonth.addEventListener('click', () => switchViewMode('month'));
  }
  if (tabWeek) {
    tabWeek.addEventListener('click', () => switchViewMode('week'));
  }
  if (tabDay) {
    tabDay.addEventListener('click', () => switchViewMode('day'));
  }

  // Day View Prev / Next buttons
  if (dayPrevBtn) {
    dayPrevBtn.addEventListener('click', () => {
      if (activeCalendarDay > 1) {
        activeCalendarDay--;
        renderDayTimelineView(activeCalendarDay);
      }
    });
  }
  if (dayNextBtn) {
    dayNextBtn.addEventListener('click', () => {
      if (activeCalendarDay < 31) {
        activeCalendarDay++;
        renderDayTimelineView(activeCalendarDay);
      }
    });
  }

  // Month Prev / Next buttons
  const prevMonthBtn = document.getElementById('ios-prev-month');
  const nextMonthBtn = document.getElementById('ios-next-month');
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => showToast('Previous month (September 2026)', 'info'));
  }
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => showToast('Next month (November 2026)', 'info'));
  }

  // Jump to Today
  if (jumpTodayBtn) {
    jumpTodayBtn.addEventListener('click', () => {
      activeCalendarDay = 12;
      switchViewMode(activeCalendarView);
      showToast('Jumped to Today: 12 October 2026', 'info');
    });
  }

  // New Booking Button in Calendar Topbar
  if (newBookingCalBtn) {
    newBookingCalBtn.addEventListener('click', () => {
      openDrawer('booking-drawer');
    });
  }
}

// ==========================================
// 15. ROOM MANAGEMENT & ROOM STATUS MATRIX
// ==========================================

const HOTEL_ROOMS_DATA = [
  // Floor 1 (10 rooms: 101-110)
  { number: "101", floor: 1, type: "Deluxe Room", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-deluxe.jpg", price: 18500, guest: null, cleaning: "Today, 11:30 AM" },
  { number: "102", floor: 1, type: "Premium Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "bar"], image: "assets/img/room-premium.jpg", price: 22000, guest: "Arjun Mehta", checkIn: "Oct 24", checkOut: "Oct 27", cleaning: "Today, 09:15 AM" },
  { number: "103", floor: 1, type: "Suite Room", status: "available", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "balcony"], image: "assets/img/room-suite.jpg", price: 28000, guest: null, cleaning: "Today, 10:00 AM" },
  { number: "104", floor: 1, type: "Deluxe Room", status: "maintenance", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-modern.jpg", price: 18500, guest: null, note: "Plumbing inspection in progress", cleaning: "Yesterday, 04:00 PM" },
  { number: "105", floor: 1, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-deluxe.jpg", price: 18500, guest: "Sanya Malhotra", checkIn: "Oct 25", checkOut: "Oct 28", cleaning: "Today, 08:30 AM" },
  { number: "106", floor: 1, type: "Standard Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-premium.jpg", price: 14000, guest: "Rohan Kapoor", checkIn: "Oct 24", checkOut: "Oct 26", cleaning: "Today, 09:45 AM" },
  { number: "107", floor: 1, type: "Premium Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-suite.jpg", price: 22000, guest: "Kavita Rao", checkIn: "Oct 23", checkOut: "Oct 26", cleaning: "Today, 10:20 AM" },
  { number: "108", floor: 1, type: "Premium Villa", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "tub"], image: "assets/img/room-modern.jpg", price: 32000, guest: "Devraj Chauhan (VIP)", checkIn: "Oct 22", checkOut: "Oct 28", cleaning: "Today, 08:00 AM" },
  { number: "109", floor: 1, type: "Pool Cabana", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "bar"], image: "assets/img/room-deluxe.jpg", price: 25000, guest: "Meera Sen", checkIn: "Oct 25", checkOut: "Oct 29", cleaning: "Today, 09:30 AM" },
  { number: "110", floor: 1, type: "Standard Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-premium.jpg", price: 14000, guest: "Amitabh Bansal", checkIn: "Oct 24", checkOut: "Oct 27", cleaning: "Today, 11:00 AM" },

  // Floor 2 (10 rooms: 201-210)
  { number: "201", floor: 2, type: "Deluxe Room", status: "available", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-deluxe.jpg", price: 24000, guest: null, cleaning: "Today, 10:45 AM" },
  { number: "202", floor: 2, type: "Premium Suite", status: "occupied", guests: 4, bed: "2 Beds", amenities: ["wifi", "tv", "ac", "balcony"], image: "assets/img/room-premium.jpg", price: 34000, guest: "Priya Sharma (VIP)", checkIn: "Oct 24", checkOut: "Oct 28", cleaning: "Today, 09:00 AM" },
  { number: "203", floor: 2, type: "Deluxe Room", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-suite.jpg", price: 18500, guest: null, cleaning: "Today, 11:15 AM" },
  { number: "204", floor: 2, type: "Standard Room", status: "out-of-service", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-modern.jpg", price: 14000, guest: null, note: "Flooring overhaul & electrical revamp", cleaning: "Oct 20, 02:00 PM" },
  { number: "205", floor: 2, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-deluxe.jpg", price: 24000, guest: "Nikhil Chawla", checkIn: "Oct 25", checkOut: "Oct 27", cleaning: "Today, 08:45 AM" },
  { number: "206", floor: 2, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-premium.jpg", price: 18500, guest: "Sunita Reddy", checkIn: "Oct 23", checkOut: "Oct 26", cleaning: "Today, 10:10 AM" },
  { number: "207", floor: 2, type: "Premium Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "bar"], image: "assets/img/room-suite.jpg", price: 22000, guest: "Rajeev Goel", checkIn: "Oct 24", checkOut: "Oct 27", cleaning: "Today, 09:40 AM" },
  { number: "208", floor: 2, type: "Suite Room", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-modern.jpg", price: 28000, guest: "Tanya Kapoor", checkIn: "Oct 25", checkOut: "Oct 29", cleaning: "Today, 08:15 AM" },
  { number: "209", floor: 2, type: "Premium Villa", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "tub"], image: "assets/img/room-deluxe.jpg", price: 32000, guest: "Harsh Vardhan", checkIn: "Oct 22", checkOut: "Oct 27", cleaning: "Today, 09:50 AM" },
  { number: "210", floor: 2, type: "Pool Cabana", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-premium.jpg", price: 25000, guest: "Zoya Akhtar", checkIn: "Oct 24", checkOut: "Oct 26", cleaning: "Today, 11:00 AM" },

  // Floor 3 (10 rooms: 301-310)
  { number: "301", floor: 3, type: "Presidential Suite", status: "occupied", guests: 4, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "balcony", "tub"], image: "assets/img/room-suite.jpg", price: 42000, guest: "Rajesh Mittal (VIP)", checkIn: "Oct 23", checkOut: "Oct 29", cleaning: "Today, 08:30 AM" },
  { number: "302", floor: 3, type: "Garden Cottage", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-modern.jpg", price: 16000, guest: "Deepak Verma", checkIn: "Oct 25", checkOut: "Oct 28", cleaning: "Today, 09:20 AM" },
  { number: "303", floor: 3, type: "Deluxe Room", status: "maintenance", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-deluxe.jpg", price: 18500, guest: null, note: "AC filter cleaning and thermostat repair", cleaning: "Yesterday, 05:00 PM" },
  { number: "304", floor: 3, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-premium.jpg", price: 24000, guest: "Sneha Gupta", checkIn: "Oct 24", checkOut: "Oct 27", cleaning: "Today, 10:30 AM" },
  { number: "305", floor: 3, type: "Pool Cabana", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "bar"], image: "assets/img/room-suite.jpg", price: 25000, guest: "Aditya Joshi", checkIn: "Oct 22", checkOut: "Oct 26", cleaning: "Today, 09:10 AM" },
  { number: "306", floor: 3, type: "Premium Room", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-modern.jpg", price: 22000, guest: null, cleaning: "Today, 11:45 AM" },
  { number: "307", floor: 3, type: "Suite Room", status: "available", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "balcony"], image: "assets/img/room-deluxe.jpg", price: 28000, guest: null, cleaning: "Today, 10:15 AM" },
  { number: "308", floor: 3, type: "Premium Villa", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "tub"], image: "assets/img/room-premium.jpg", price: 32000, guest: "Kunal Bahl", checkIn: "Oct 25", checkOut: "Oct 30", cleaning: "Today, 08:45 AM" },
  { number: "309", floor: 3, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-suite.jpg", price: 18500, guest: "Pooja Hegde", checkIn: "Oct 24", checkOut: "Oct 28", cleaning: "Today, 10:00 AM" },
  { number: "310", floor: 3, type: "Standard Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-modern.jpg", price: 14000, guest: "Manish Shah", checkIn: "Oct 25", checkOut: "Oct 27", cleaning: "Today, 09:00 AM" },

  // Floor 4 (10 rooms: 401-410)
  { number: "401", floor: 4, type: "Premium Villa", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "tub"], image: "assets/img/room-deluxe.jpg", price: 32000, guest: "Aakash Ambani (VIP)", checkIn: "Oct 22", checkOut: "Oct 28", cleaning: "Today, 08:15 AM" },
  { number: "402", floor: 4, type: "Premium Room", status: "maintenance", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-premium.jpg", price: 22000, guest: null, note: "Balcony glass replacement", cleaning: "Yesterday, 03:30 PM" },
  { number: "403", floor: 4, type: "Deluxe Room", status: "available", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-suite.jpg", price: 24000, guest: null, cleaning: "Today, 11:00 AM" },
  { number: "404", floor: 4, type: "Deluxe Room", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-modern.jpg", price: 18500, guest: null, cleaning: "Today, 10:30 AM" },
  { number: "405", floor: 4, type: "Presidential Suite", status: "occupied", guests: 4, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "balcony", "tub", "bar"], image: "assets/img/room-deluxe.jpg", price: 45000, guest: "Gaurav Sen", checkIn: "Oct 24", checkOut: "Oct 30", cleaning: "Today, 09:00 AM" },
  { number: "406", floor: 4, type: "Garden Cottage", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-premium.jpg", price: 16000, guest: "Ishaan Khattar", checkIn: "Oct 25", checkOut: "Oct 27", cleaning: "Today, 09:30 AM" },
  { number: "407", floor: 4, type: "Suite Room", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-suite.jpg", price: 28000, guest: "Tara Sutaria", checkIn: "Oct 23", checkOut: "Oct 26", cleaning: "Today, 08:45 AM" },
  { number: "408", floor: 4, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-modern.jpg", price: 18500, guest: "Vivek Oberoi", checkIn: "Oct 25", checkOut: "Oct 28", cleaning: "Today, 10:15 AM" },
  { number: "409", floor: 4, type: "Pool Cabana", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "bar"], image: "assets/img/room-deluxe.jpg", price: 25000, guest: null, cleaning: "Today, 11:20 AM" },
  { number: "410", floor: 4, type: "Standard Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-premium.jpg", price: 14000, guest: "Mohit Raina", checkIn: "Oct 24", checkOut: "Oct 27", cleaning: "Today, 09:15 AM" },

  // Floor 5 (8 rooms: 501-508)
  { number: "501", floor: 5, type: "Premium Villa", status: "available", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "tub"], image: "assets/img/room-suite.jpg", price: 35000, guest: null, cleaning: "Today, 11:30 AM" },
  { number: "502", floor: 5, type: "Garden Cottage", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-modern.jpg", price: 16000, guest: null, cleaning: "Today, 10:45 AM" },
  { number: "503", floor: 5, type: "Pool Cabana", status: "available", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv", "bar"], image: "assets/img/room-deluxe.jpg", price: 25000, guest: null, cleaning: "Today, 11:10 AM" },
  { number: "504", floor: 5, type: "Presidential Suite", status: "occupied", guests: 4, bed: "1 King Bed", amenities: ["wifi", "tv", "ac", "balcony", "tub"], image: "assets/img/room-premium.jpg", price: 48000, guest: "Sanjay Singhal (VIP)", checkIn: "Oct 24", checkOut: "Oct 31", cleaning: "Today, 08:30 AM" },
  { number: "505", floor: 5, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 Queen Bed", amenities: ["wifi", "tv"], image: "assets/img/room-suite.jpg", price: 26000, guest: "Bhavna Panday", checkIn: "Oct 25", checkOut: "Oct 28", cleaning: "Today, 09:40 AM" },
  { number: "506", floor: 5, type: "Premium Suite", status: "occupied", guests: 4, bed: "2 Beds", amenities: ["wifi", "tv", "ac"], image: "assets/img/room-modern.jpg", price: 36000, guest: "Sameer Nair", checkIn: "Oct 23", checkOut: "Oct 27", cleaning: "Today, 08:50 AM" },
  { number: "507", floor: 5, type: "Deluxe Room", status: "occupied", guests: 2, bed: "1 King Bed", amenities: ["wifi", "tv"], image: "assets/img/room-deluxe.jpg", price: 19500, guest: "Ananya Roy", checkIn: "Oct 25", checkOut: "Oct 29", cleaning: "Today, 10:00 AM" },
  { number: "508", floor: 5, type: "Suite Room", status: "occupied", guests: 3, bed: "1 King Bed", amenities: ["wifi", "tv", "balcony"], image: "assets/img/room-premium.jpg", price: 30000, guest: "Karan Johar", checkIn: "Oct 24", checkOut: "Oct 28", cleaning: "Today, 09:10 AM" }
];

const ROOM_STATE = {
  rooms: [...HOTEL_ROOMS_DATA],
  filterFloor: 'all',
  filterType: 'all',
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'number-asc',
  viewMode: 'grid',
  activeContextRoom: null
};

function getRoomStatusBadgeHtml(status) {
  switch (status) {
    case 'available':
      return `<span class="room-badge-status available"><span class="status-dot-pulse"></span> Available</span>`;
    case 'occupied':
      return `<span class="room-badge-status occupied"><span class="status-dot-pulse"></span> Occupied</span>`;
    case 'maintenance':
      return `<span class="room-badge-status maintenance"><span class="status-dot-pulse"></span> Maintenance</span>`;
    case 'out-of-service':
      return `<span class="room-badge-status out-of-service"><span class="status-dot-pulse"></span> Out of Service</span>`;
    default:
      return `<span class="room-badge-status available">${status}</span>`;
  }
}

function updateRoomStatCards() {
  const total = ROOM_STATE.rooms.length;
  const occupied = ROOM_STATE.rooms.filter(r => r.status === 'occupied').length;
  const available = ROOM_STATE.rooms.filter(r => r.status === 'available').length;
  const maintenance = ROOM_STATE.rooms.filter(r => r.status === 'maintenance').length;
  const outOfService = ROOM_STATE.rooms.filter(r => r.status === 'out-of-service').length;

  const elTotal = document.getElementById('stat-val-total');
  const elOcc = document.getElementById('stat-val-occupied');
  const elAvail = document.getElementById('stat-val-available');
  const elMaint = document.getElementById('stat-val-maintenance');
  const elOut = document.getElementById('stat-val-out-of-service');

  if (elTotal) elTotal.textContent = total;
  if (elOcc) elOcc.textContent = occupied;
  if (elAvail) elAvail.textContent = available;
  if (elMaint) elMaint.textContent = maintenance;
  if (elOut) elOut.textContent = outOfService;
}

function renderRoomsView() {
  // 1. Filter
  let list = ROOM_STATE.rooms.filter(r => {
    if (ROOM_STATE.filterFloor !== 'all' && String(r.floor) !== String(ROOM_STATE.filterFloor)) return false;
    if (ROOM_STATE.filterType !== 'all' && r.type !== ROOM_STATE.filterType) return false;
    if (ROOM_STATE.filterStatus !== 'all' && r.status !== ROOM_STATE.filterStatus) return false;
    if (ROOM_STATE.searchQuery) {
      const q = ROOM_STATE.searchQuery.toLowerCase();
      const matchNum = r.number.toLowerCase().includes(q);
      const matchType = r.type.toLowerCase().includes(q);
      const matchFloor = `floor ${r.floor}`.toLowerCase().includes(q);
      const matchStatus = r.status.toLowerCase().includes(q);
      const matchGuest = r.guest && r.guest.toLowerCase().includes(q);
      if (!matchNum && !matchType && !matchFloor && !matchStatus && !matchGuest) return false;
    }
    return true;
  });

  // 2. Sort
  list.sort((a, b) => {
    switch (ROOM_STATE.sortBy) {
      case 'number-asc': return a.number.localeCompare(b.number, undefined, {numeric: true});
      case 'number-desc': return b.number.localeCompare(a.number, undefined, {numeric: true});
      case 'floor-asc': return a.floor - b.floor;
      case 'floor-desc': return b.floor - a.floor;
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'status': return a.status.localeCompare(b.status);
      default: return 0;
    }
  });

  // 3. Update counter and empty state
  const countEl = document.getElementById('rooms-count-display');
  if (countEl) countEl.textContent = list.length;

  const gridContainer = document.getElementById('rooms-grid-container');
  const listContainer = document.getElementById('rooms-list-container');
  const emptyState = document.getElementById('rooms-empty-state');

  if (list.length === 0) {
    if (gridContainer) gridContainer.classList.add('hidden');
    if (listContainer) listContainer.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // 4. Render Grid or List
  if (ROOM_STATE.viewMode === 'grid') {
    if (listContainer) listContainer.classList.add('hidden');
    if (gridContainer) {
      gridContainer.classList.remove('hidden');
      gridContainer.innerHTML = list.map(r => generateRoomCardHtml(r)).join('');
    }
  } else {
    if (gridContainer) gridContainer.classList.add('hidden');
    if (listContainer) {
      listContainer.classList.remove('hidden');
      listContainer.innerHTML = generateRoomTableHtml(list);
    }
  }

  updateRoomStatCards();
  bindRoomEvents();

  if (window.lucide) lucide.createIcons();
}

function generateRoomCardHtml(r) {
  return `
    <div class="room-luxury-card" data-room-num="${r.number}">
      <div class="room-card-image-wrap">
        <img src="${r.image}" alt="Room ${r.number}" loading="lazy">
        ${getRoomStatusBadgeHtml(r.status)}
      </div>
      <div class="room-card-content">
        <div class="room-card-row-top">
          <span class="room-card-number">${r.number}</span>
          <span class="room-card-floor">Floor ${r.floor}</span>
        </div>
        <div class="room-card-type">${r.type}</div>
        <div class="room-card-footer">
          <div class="room-card-specs">
            <span class="spec-item" title="${r.guests} Guests"><i data-lucide="users"></i> ${r.guests}</span>
            <span class="spec-item" title="${r.bed}"><i data-lucide="bed-double"></i> ${r.bed}</span>
            <span class="spec-item" title="High-Speed Wi-Fi"><i data-lucide="wifi"></i></span>
            <span class="spec-item" title="Smart TV"><i data-lucide="tv"></i></span>
          </div>
          <button type="button" class="room-card-more-btn" data-room-num="${r.number}" title="More Actions">
            <i data-lucide="more-horizontal"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function generateRoomTableHtml(list) {
  return `
    <table class="rooms-luxury-table">
      <thead>
        <tr>
          <th>Room</th>
          <th>Floor</th>
          <th>Category</th>
          <th>Status</th>
          <th>Configuration</th>
          <th>Current Guest</th>
          <th>Rate / Night</th>
          <th style="text-align: right;">Action</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(r => `
          <tr data-room-num="${r.number}" style="cursor: pointer;">
            <td>
              <div class="table-room-cell">
                <img src="${r.image}" class="table-room-thumb" alt="Room ${r.number}">
                <strong>#${r.number}</strong>
              </div>
            </td>
            <td>Floor ${r.floor}</td>
            <td>${r.type}</td>
            <td>${getRoomStatusBadgeHtml(r.status)}</td>
            <td>${r.bed} (${r.guests} Guests)</td>
            <td>${r.guest ? `<strong>${r.guest}</strong>` : '<span style="color:#9CA3AF;">--</span>'}</td>
            <td><strong>₹${r.price.toLocaleString()}</strong></td>
            <td style="text-align: right;">
              <button type="button" class="room-card-more-btn" data-room-num="${r.number}" style="display:inline-flex;">
                <i data-lucide="more-horizontal"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function openRoomDetailDrawer(room) {
  const detailDrawer = document.getElementById('room-detail');
  if (!detailDrawer) return;

  const floorNum = parseInt(room.floor || (room.number ? room.number[0] : '1'), 10) || 1;
  const isVip = (room.guest && room.guest.includes('VIP')) || (room.vip === true) || (room.number === '101' || room.number === '401' || room.number === '405' || room.number === '501');
  const priceVal = room.price || 18500;
  const formattedRate = '₹' + priceVal.toLocaleString('en-IN');
  const normalizedStatus = (room.status === 'available' || room.status === 'vacant') ? 'vacant' : room.status;

  // 1. Header Title
  const headerTitle = document.getElementById('drawer-header-room-title');
  if (headerTitle) {
    headerTitle.textContent = `Suite #${room.number} Details`;
  }

  // 2. Hero Image & Badges
  const heroImg = document.getElementById('drawer-room-image') || detailDrawer.querySelector('.drawer-hero-img');
  if (heroImg) {
    heroImg.src = room.image || 'assets/img/room-deluxe.jpg';
  }

  const statusPill = document.getElementById('drawer-room-status-pill');
  const statusText = document.getElementById('drawer-room-status-text');
  if (statusPill && statusText) {
    statusPill.className = `room-status-luxury-pill ${normalizedStatus}`;
    if (normalizedStatus === 'vacant') {
      statusText.innerHTML = '<span class="filter-dot vacant" style="box-shadow: 0 0 8px #10B981;"></span> Vacant & Inspected';
    } else if (normalizedStatus === 'occupied') {
      statusText.innerHTML = `<span class="filter-dot occupied" style="box-shadow: 0 0 8px #E63946;"></span> ${isVip ? '👑 VIP Occupied' : 'Occupied'}`;
    } else if (normalizedStatus === 'dirty') {
      statusText.innerHTML = '<span class="filter-dot dirty" style="box-shadow: 0 0 8px #F59E0B;"></span> Housekeeping Req';
    } else if (normalizedStatus === 'maintenance') {
      statusText.innerHTML = '<span class="filter-dot" style="background:#6366F1; box-shadow: 0 0 8px #6366F1;"></span> Maintenance';
    } else {
      statusText.textContent = room.status;
    }
  }

  const tierTag = document.getElementById('drawer-room-tier-tag');
  if (tierTag) {
    tierTag.textContent = `${room.type.includes('Presidential') ? '👑' : (room.type.includes('Villa') ? '✨' : '🏨')} ${room.type}`;
  }

  const numText = document.getElementById('drawer-room-num-text');
  if (numText) numText.textContent = `Suite #${room.number}`;

  const wingText = document.getElementById('drawer-room-wing-text');
  if (wingText) {
    let wingName = 'Garden Courtyard Wing';
    if (floorNum === 2) wingName = 'Garden Courtyard Wing';
    else if (floorNum === 3) wingName = 'Sunset Terrace Wing';
    else if (floorNum === 4) wingName = 'Executive Suites Wing';
    else if (floorNum === 5) wingName = 'Imperial Sky Villas';
    wingText.innerHTML = `<i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> <span>Floor ${floorNum} • ${wingName}</span>`;
  }

  const rateText = document.getElementById('drawer-room-rate-text');
  if (rateText) rateText.textContent = formattedRate;

  // 3. Suite Specs
  const specSize = document.getElementById('drawer-spec-size');
  if (specSize) {
    let size = '540 sq.ft';
    if (room.type.includes('Presidential')) size = '1,450 sq.ft';
    else if (room.type.includes('Presidential')) size = '1,120 sq.ft';
    else if (room.type.includes('Villa')) size = '880 sq.ft';
    else if (room.type.includes('Cabana')) size = '720 sq.ft';
    else if (room.type.includes('Suite')) size = '760 sq.ft';
    else if (room.type.includes('Cottage')) size = '620 sq.ft';
    specSize.textContent = size;
  }

  const specBed = document.getElementById('drawer-spec-bed');
  if (specBed) {
    specBed.textContent = room.bed || (room.type.includes('Villa') || room.type.includes('Presidential') ? '1 Canopy King Bed' : '1 King Bed');
  }

  const specGuests = document.getElementById('drawer-spec-guests');
  if (specGuests) {
    specGuests.textContent = `${room.guests || (room.type.includes('Presidential') ? 4 : 2)} Adults, 1 Child`;
  }

  const specView = document.getElementById('drawer-spec-view');
  if (specView) {
    let view = 'Garden Courtyard';
    if (room.type.includes('Presidential')) view = 'Panoramic Skyline View';
    else if (room.type.includes('Villa')) view = 'Private Lawn & Courtyard';
    else if (room.type.includes('Cabana')) view = 'Infinity Lagoon Pool';
    else if (room.type.includes('Cottage')) view = 'Garden Lawn';
    specView.textContent = view;
  }

  // 4. Occupancy Container
  const occContainer = document.getElementById('drawer-occupancy-container');
  if (occContainer) {
    if (normalizedStatus === 'occupied' && room.guest) {
      const initials = room.guest.split(' ').map(n=>n[0]).join('').substring(0,2) || 'AM';
      const folioTotal = ((priceVal * 3) + 7200).toLocaleString('en-IN');
      occContainer.innerHTML = `
        <div class="occupied-guest-card">
            <div class="guest-profile-row">
                <div class="guest-profile-left">
                    <div class="guest-avatar-large">${initials}</div>
                    <div class="guest-info-block">
                        <h4><span>${room.guest}</span> ${isVip ? '<span class="vip-crown-badge" title="VIP Patron">👑 VIP</span>' : ''}</h4>
                        <p><i data-lucide="phone" style="width:11px; height:11px; display:inline;"></i> +91 98201 54321 • Concierge Verified</p>
                    </div>
                </div>
                <span class="header-pill-badge" style="background: rgba(var(--accent-rgb), 0.15);"><i data-lucide="shield-check"></i> In-House</span>
            </div>
            <div class="guest-stay-schedule">
                <div class="schedule-col">
                    <span>CHECK-IN</span>
                    <strong>${room.checkIn || 'Oct 24, 02:00 PM'}</strong>
                </div>
                <div class="stay-arrow"><i data-lucide="arrow-right"></i></div>
                <div class="schedule-col">
                    <span>CHECK-OUT</span>
                    <strong>${room.checkOut || 'Oct 28, 11:00 AM'}</strong>
                </div>
                <div class="schedule-col" style="text-align: right;">
                    <span>FOLIO BILL</span>
                    <strong style="color: var(--accent-strong);">₹${folioTotal}</strong>
                </div>
            </div>
        </div>
      `;
    } else if (normalizedStatus === 'maintenance') {
      occContainer.innerHTML = `
        <div class="vacant-inspection-card" style="background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.35);">
            <div class="vacant-header-row">
                <div class="vacant-icon-badge" style="background: rgba(239, 68, 68, 0.18); border-color: rgba(239, 68, 68, 0.4); color: #DC2626;">
                    <i data-lucide="wrench"></i>
                </div>
                <div class="vacant-header-text">
                    <h4 style="color: #991B1B;">Suite Under Scheduled Maintenance</h4>
                    <p>${room.note || 'Quarterly HVAC filtration & digital lock recalibration in progress. Chief Engineer on-site.'}</p>
                </div>
            </div>
        </div>
      `;
    } else if (normalizedStatus === 'out-of-service') {
      occContainer.innerHTML = `
        <div class="vacant-inspection-card" style="background: rgba(100, 116, 139, 0.08); border-color: rgba(100, 116, 139, 0.35);">
            <div class="vacant-header-row">
                <div class="vacant-icon-badge" style="background: rgba(100, 116, 139, 0.18); border-color: rgba(100, 116, 139, 0.4); color: #475569;">
                    <i data-lucide="ban"></i>
                </div>
                <div class="vacant-header-text">
                    <h4 style="color: #334155;">Suite Out of Service</h4>
                    <p>${room.note || 'Blocked for scheduled maintenance and refurbishment.'}</p>
                </div>
            </div>
        </div>
      `;
    } else if (normalizedStatus === 'dirty') {
      occContainer.innerHTML = `
        <div class="vacant-inspection-card" style="background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.35);">
            <div class="vacant-header-row">
                <div class="vacant-icon-badge" style="background: rgba(245, 158, 11, 0.18); border-color: rgba(245, 158, 11, 0.4); color: #D97706;">
                    <i data-lucide="sparkles"></i>
                </div>
                <div class="vacant-header-text">
                    <h4 style="color: #92400E;">Housekeeping Service Required</h4>
                    <p>Guest checked out at 11:00 AM. Deep linen replacement, ozone sanitisation & minibar restock dispatched.</p>
                </div>
            </div>
        </div>
      `;
    } else {
      occContainer.innerHTML = `
        <div class="vacant-inspection-card">
            <div class="vacant-header-row">
                <div class="vacant-icon-badge">
                    <i data-lucide="check-circle-2"></i>
                </div>
                <div class="vacant-header-text">
                    <h4>Vacant & White-Glove Inspected</h4>
                    <p>Sanitised, dressed in 600TC Egyptian cotton linens, and staged for immediate check-in.</p>
                </div>
            </div>
            <div class="vacant-checklist-grid">
                <div class="checklist-item"><i data-lucide="check"></i><span>Linens 600TC Changed</span></div>
                <div class="checklist-item"><i data-lucide="check"></i><span>Minibar Fully Stocked</span></div>
                <div class="checklist-item"><i data-lucide="check"></i><span>AC Pre-cooled to 22°C</span></div>
                <div class="checklist-item"><i data-lucide="check"></i><span>Welcome Platter Ready</span></div>
            </div>
            <button type="button" class="btn btn-sm btn-primary" id="btn-vacant-express-assign" style="width: 100%; height: 38px; font-size: 0.78rem;">
                <i data-lucide="zap"></i> <span>Express Check-In / Assign Guest</span>
            </button>
        </div>
      `;
    }
  }

  // 5. Housekeeping Log
  const hkLast = document.getElementById('drawer-hk-last');
  if (hkLast) {
    hkLast.textContent = room.cleaning || 'Today, 11:30 AM by Sunita';
  }

  // 6. Footer Actions
  const footerActions = document.getElementById('drawer-footer-actions');
  if (footerActions) {
    if (normalizedStatus === 'occupied') {
      const folioTotal = ((priceVal * 3) + 7200).toLocaleString('en-IN');
      footerActions.innerHTML = `
        <button type="button" class="btn btn-outline" id="room-drawer-act-chat"><i data-lucide="message-square"></i> Message</button>
        <button type="button" class="btn btn-outline" id="room-drawer-act-dining"><i data-lucide="utensils"></i> Dining</button>
        <button type="button" class="btn btn-primary" id="room-drawer-act-folio" style="flex:2;"><i data-lucide="receipt"></i> Guest Folio (₹${folioTotal})</button>
      `;
    } else if (normalizedStatus === 'dirty') {
      footerActions.innerHTML = `
        <button type="button" class="btn btn-outline" id="room-drawer-act-hold"><i data-lucide="shield"></i> Hold Room</button>
        <button type="button" class="btn btn-primary" id="room-drawer-act-clean-now" style="flex:2;"><i data-lucide="sparkles"></i> Mark as Cleaned & Inspected</button>
      `;
    } else if (normalizedStatus === 'maintenance') {
      footerActions.innerHTML = `
        <button type="button" class="btn btn-outline close-drawer"><i data-lucide="x"></i> Close</button>
        <button type="button" class="btn btn-primary" id="room-drawer-act-resolve-maint" style="flex:2;"><i data-lucide="check-check"></i> Complete Maintenance</button>
      `;
    } else {
      footerActions.innerHTML = `
        <button type="button" class="btn btn-outline" id="room-drawer-act-hold"><i data-lucide="shield"></i> Hold Room</button>
        <button type="button" class="btn btn-outline" id="room-drawer-act-inspect"><i data-lucide="sparkles"></i> Re-Inspect</button>
        <button type="button" class="btn btn-primary" id="room-drawer-act-book" style="flex:2;"><i data-lucide="plus-circle"></i> Create Reservation</button>
      `;
    }
  }

  // 7. Event listeners inside drawer
  const actBook = document.getElementById('room-drawer-act-book');
  if (actBook) {
    actBook.onclick = () => {
      closeDrawer('room-detail');
      showToast(`✨ Opening reservation flow for Suite #${room.number}...`, 'info');
      setTimeout(() => openDrawer('booking-drawer'), 250);
    };
  }

  const expressAssign = document.getElementById('btn-vacant-express-assign');
  if (expressAssign) {
    expressAssign.onclick = () => {
      closeDrawer('room-detail');
      showToast(`✨ Fast Check-in for Suite #${room.number} activated!`, 'success');
      setTimeout(() => openDrawer('booking-drawer'), 250);
    };
  }

  const actChat = document.getElementById('room-drawer-act-chat');
  if (actChat) {
    actChat.onclick = () => {
      closeDrawer('room-detail');
      showScreen('messages');
      showToast(`💬 Direct concierge channel opened with ${room.guest || 'Guest'}`, 'info');
    };
  }

  const actFolio = document.getElementById('room-drawer-act-folio');
  if (actFolio) {
    actFolio.onclick = () => {
      showToast(`📜 Folio generated for Suite #${room.number} (${room.guest}): ₹${((priceVal * 3) + 7200).toLocaleString('en-IN')}`, 'success');
    };
  }

  const actDining = document.getElementById('room-drawer-act-dining');
  if (actDining) {
    actDining.onclick = () => {
      showToast(`🍽️ In-Room Dining steward notified for Suite #${room.number}!`, 'info');
    };
  }

  const actHold = document.getElementById('room-drawer-act-hold');
  if (actHold) {
    actHold.onclick = () => {
      showToast(`🔒 Suite #${room.number} placed on temporary 45-min management hold`, 'warning');
    };
  }

  const actInspect = document.getElementById('room-drawer-act-inspect');
  if (actInspect) {
    actInspect.onclick = () => {
      showToast(`✨ Housekeeping lead Sunita dispatched to re-inspect Suite #${room.number}`, 'info');
    };
  }

  const actCleanNow = document.getElementById('room-drawer-act-clean-now');
  if (actCleanNow) {
    actCleanNow.onclick = () => {
      room.status = 'available';
      updateRoomStatCards();
      renderRoomsView();
      openRoomDetailDrawer(room);
      showToast(`✨ Suite #${room.number} marked as Vacant & Inspected!`, 'success');
    };
  }

  const actResolveMaint = document.getElementById('room-drawer-act-resolve-maint');
  if (actResolveMaint) {
    actResolveMaint.onclick = () => {
      room.status = 'available';
      updateRoomStatCards();
      renderRoomsView();
      openRoomDetailDrawer(room);
      showToast(`✅ Maintenance completed for Suite #${room.number}! Ready for guests.`, 'success');
    };
  }

  // Micro-Bar Actions
  const btnKey = document.getElementById('quick-act-keycard');
  if (btnKey) {
    btnKey.onclick = () => {
      showToast(`🔑 Digital Keycard pass NFC/BLE code regenerated for Suite #${room.number}!`, 'success');
    };
  }

  const btnTurndown = document.getElementById('quick-act-turndown');
  if (btnTurndown) {
    btnTurndown.onclick = () => {
      showToast(`🌙 Evening turndown service scheduled for 06:30 PM (Suite #${room.number}).`, 'info');
    };
  }

  const btnDiningQuick = document.getElementById('quick-act-dining');
  if (btnDiningQuick) {
    btnDiningQuick.onclick = () => {
      showToast(`🍽️ Digital in-room dining menu dispatched to Suite #${room.number}.`, 'info');
    };
  }

  const btnDnd = document.getElementById('quick-act-dnd');
  const dndLabel = document.getElementById('dnd-toggle-label');
  if (btnDnd && dndLabel) {
    btnDnd.onclick = () => {
      if (dndLabel.textContent.includes('Off')) {
        dndLabel.textContent = 'DND: ON';
        btnDnd.style.background = 'rgba(239, 68, 68, 0.15)';
        btnDnd.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        showToast(`🔕 Do Not Disturb mode ACTIVATED for Suite #${room.number}`, 'warning');
      } else {
        dndLabel.textContent = 'DND: Off';
        btnDnd.style.background = '';
        btnDnd.style.borderColor = '';
        showToast(`🔔 Do Not Disturb mode turned OFF for Suite #${room.number}`, 'info');
      }
    };
  }

  openDrawer('room-detail');
  if (window.lucide) lucide.createIcons();
}

function bindRoomEvents() {
  // Room card / table row click
  const clickableItems = document.querySelectorAll('.room-luxury-card, .rooms-luxury-table tr[data-room-num]');
  clickableItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't open if kebab button was clicked
      if (e.target.closest('.room-card-more-btn')) return;
      const num = item.getAttribute('data-room-num');
      const room = ROOM_STATE.rooms.find(r => r.number === num);
      if (room) openRoomDetailDrawer(room);
    });
  });

  // Kebab menu buttons
  const kebabBtns = document.querySelectorAll('.room-card-more-btn');
  const kebabMenu = document.getElementById('room-kebab-menu');

  kebabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const num = btn.getAttribute('data-room-num');
      const room = ROOM_STATE.rooms.find(r => r.number === num);
      if (!room || !kebabMenu) return;

      ROOM_STATE.activeContextRoom = room;

      const rect = btn.getBoundingClientRect();
      let topPos = rect.bottom + 6;
      let leftPos = rect.left - 150;

      if (leftPos < 10) leftPos = 10;
      if (topPos + 180 > window.innerHeight) topPos = rect.top - 180;

      kebabMenu.style.top = `${topPos}px`;
      kebabMenu.style.left = `${leftPos}px`;
      kebabMenu.classList.remove('hidden');

      if (window.lucide) lucide.createIcons();
    });
  });
}

function setupRoomControls() {
  // Floor filter
  const floorSelect = document.getElementById('rooms-floor-filter');
  if (floorSelect) {
    floorSelect.addEventListener('change', (e) => {
      ROOM_STATE.filterFloor = e.target.value;
      renderRoomsView();
    });
  }

  // Type filter
  const typeSelect = document.getElementById('rooms-type-filter');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      ROOM_STATE.filterType = e.target.value;
      renderRoomsView();
    });
  }

  // Status filter
  const statusSelect = document.getElementById('rooms-status-filter');
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      ROOM_STATE.filterStatus = e.target.value;
      // sync stat card active state
      document.querySelectorAll('.room-stat-card').forEach(c => {
        if (c.getAttribute('data-filter') === e.target.value) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
      renderRoomsView();
    });
  }

  // Search input
  const searchBox = document.getElementById('rooms-search-box');
  const searchClear = document.getElementById('rooms-search-clear');
  if (searchBox) {
    searchBox.addEventListener('input', (e) => {
      ROOM_STATE.searchQuery = e.target.value.trim();
      if (searchClear) {
        if (ROOM_STATE.searchQuery) searchClear.classList.remove('hidden');
        else searchClear.classList.add('hidden');
      }
      renderRoomsView();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchBox) searchBox.value = '';
      ROOM_STATE.searchQuery = '';
      searchClear.classList.add('hidden');
      renderRoomsView();
    });
  }

  // Sort select
  const sortSelect = document.getElementById('rooms-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      ROOM_STATE.sortBy = e.target.value;
      renderRoomsView();
    });
  }

  // View toggle buttons
  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');
  if (btnGrid && btnList) {
    btnGrid.addEventListener('click', () => {
      ROOM_STATE.viewMode = 'grid';
      btnGrid.classList.add('active');
      btnList.classList.remove('active');
      renderRoomsView();
    });

    btnList.addEventListener('click', () => {
      ROOM_STATE.viewMode = 'list';
      btnList.classList.add('active');
      btnGrid.classList.remove('active');
      renderRoomsView();
    });
  }

  // 5 Stat Cards Filtering
  const statCards = document.querySelectorAll('.room-stat-card');
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      if (card.classList.contains('active') && filter !== 'all') {
        // Toggle off back to all
        ROOM_STATE.filterStatus = 'all';
        statCards.forEach(c => c.classList.remove('active'));
        const totalCard = document.getElementById('stat-card-total');
        if (totalCard) totalCard.classList.add('active');
        if (statusSelect) statusSelect.value = 'all';
      } else {
        ROOM_STATE.filterStatus = filter;
        statCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (statusSelect) statusSelect.value = filter;
      }
      renderRoomsView();
    });
  });

  // Reset filters button
  const resetBtn = document.getElementById('btn-reset-room-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      ROOM_STATE.filterFloor = 'all';
      ROOM_STATE.filterType = 'all';
      ROOM_STATE.filterStatus = 'all';
      ROOM_STATE.searchQuery = '';
      ROOM_STATE.sortBy = 'number-asc';

      if (floorSelect) floorSelect.value = 'all';
      if (typeSelect) typeSelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      if (searchBox) searchBox.value = '';
      if (searchClear) searchClear.classList.add('hidden');
      if (sortSelect) sortSelect.value = 'number-asc';

      statCards.forEach(c => c.classList.remove('active'));
      const totalCard = document.getElementById('stat-card-total');
      if (totalCard) totalCard.classList.add('active');

      renderRoomsView();
      showToast('Filters reset to show all 48 rooms', 'info');
    });
  }

  // Floating Context Menu Actions
  const kebabMenu = document.getElementById('room-kebab-menu');
  if (kebabMenu) {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#room-kebab-menu') && !e.target.closest('.room-card-more-btn')) {
        kebabMenu.classList.add('hidden');
      }
    });

    kebabMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        kebabMenu.classList.add('hidden');
        const room = ROOM_STATE.activeContextRoom;
        if (!room) return;

        const action = btn.getAttribute('data-action');
        if (action === 'details') {
          openRoomDetailDrawer(room);
        } else if (action === 'status') {
          openStatusModal(room);
        } else if (action === 'housekeeping') {
          showToast(`🧹 Housekeeping dispatched to Suite #${room.number} (${room.type})`, 'success');
        } else if (action === 'book') {
          if (room.status === 'vacant' || room.status === 'available') {
            showToast(`✨ Booking Suite #${room.number} - Opening reservation flow...`, 'info');
            openDrawer('booking-drawer');
          } else {
            showToast(`Suite #${room.number} is currently ${room.status}. Opening folio...`, 'info');
            openRoomDetailDrawer(room);
          }
        }
      });
    });
  }

  // Add Room Modal Setup
  const btnOpenAddRoom = document.getElementById('btn-open-add-room');
  const modalAddRoom = document.getElementById('modal-add-room');
  const btnCloseAddRoom = document.getElementById('btn-close-add-room');
  const btnCancelAddRoom = document.getElementById('btn-cancel-add-room');
  const backdropAddRoom = document.getElementById('backdrop-add-room');
  const formAddRoom = document.getElementById('form-add-room');

  function openAddModal() {
    if (modalAddRoom) {
      modalAddRoom.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
  }

  function closeAddModal() {
    if (modalAddRoom) modalAddRoom.classList.add('hidden');
  }

  if (btnOpenAddRoom) btnOpenAddRoom.addEventListener('click', openAddModal);
  if (btnCloseAddRoom) btnCloseAddRoom.addEventListener('click', closeAddModal);
  if (btnCancelAddRoom) btnCancelAddRoom.addEventListener('click', closeAddModal);
  if (backdropAddRoom) backdropAddRoom.addEventListener('click', closeAddModal);

  if (formAddRoom) {
    formAddRoom.addEventListener('submit', (e) => {
      e.preventDefault();
      const num = document.getElementById('add-room-number').value.trim();
      const floor = parseInt(document.getElementById('add-room-floor').value, 10);
      const type = document.getElementById('add-room-type').value;
      const bed = document.getElementById('add-room-bed').value;
      const guests = parseInt(document.getElementById('add-room-guests').value, 10);
      const price = parseInt(document.getElementById('add-room-price').value, 10);
      const status = document.getElementById('add-room-status').value;
      const image = document.getElementById('add-room-image').value;

      // Check if room number already exists
      if (ROOM_STATE.rooms.some(r => r.number === num)) {
        showToast(`Room #${num} already exists in the system!`, 'danger');
        return;
      }

      const newRoom = {
        number: num,
        floor,
        type,
        bed,
        guests,
        price,
        status,
        image,
        guest: null,
        cleaning: "Just Registered"
      };

      ROOM_STATE.rooms.unshift(newRoom);
      closeAddModal();
      formAddRoom.reset();
      renderRoomsView();
      showToast(`✨ Suite #${num} (${type}) added successfully to Your Hotel!`, 'success');
    });
  }

  // Change Status Modal Setup
  const modalStatusRoom = document.getElementById('modal-status-room');
  const btnCloseStatus = document.getElementById('btn-close-status-modal');
  const backdropStatus = document.getElementById('backdrop-status-room');

  function openStatusModal(room) {
    if (!modalStatusRoom) return;
    const titleEl = document.getElementById('modal-status-title');
    if (titleEl) titleEl.textContent = `Room ${room.number} — ${room.type}`;
    modalStatusRoom.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  function closeStatusModal() {
    if (modalStatusRoom) modalStatusRoom.classList.add('hidden');
  }

  if (btnCloseStatus) btnCloseStatus.addEventListener('click', closeStatusModal);
  if (backdropStatus) backdropStatus.addEventListener('click', closeStatusModal);

  document.querySelectorAll('.btn-status-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const newStatus = btn.getAttribute('data-new-status');
      const room = ROOM_STATE.activeContextRoom;
      if (room && newStatus) {
        room.status = newStatus;
        if (newStatus !== 'occupied') room.guest = null;
        closeStatusModal();
        renderRoomsView();
        showToast(`👑 Room #${room.number} status changed to "${newStatus.replace('-', ' ')}"`, 'success');
      }
    });
  });
}

function setupRooms() {
  // Initialize Rooms Management on rooms screen
  setupRoomControls();
  renderRoomsView();
}

// ==========================================
// 16. TAB SYSTEM
// ==========================================
function setupTabs() {
  document.querySelectorAll('.tab-container, .tabs-wrapper').forEach(container => {
    const tabs = container.querySelectorAll('.tab-item, .tab-btn');
    const contents = container.querySelectorAll('.tab-content, .tab-panel');
    const indicator = container.querySelector('.tab-indicator');
    
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        if (contents[index]) contents[index].classList.add('active');
        
        if (indicator) {
          indicator.style.left = `${tab.offsetLeft}px`;
          indicator.style.width = `${tab.offsetWidth}px`;
        }
      });
    });
    
    // Init indicator
    if (indicator && tabs[0]) {
      indicator.style.left = `${tabs[0].offsetLeft}px`;
      indicator.style.width = `${tabs[0].offsetWidth}px`;
    }
  });
}

// ==========================================
// 17. MODAL/DRAWER SYSTEM
// ==========================================
function openDrawer(id) {
  const drawer = document.getElementById(id);
  if (drawer) {
    drawer.classList.remove('hidden');
    drawer.style.display = 'flex';
    drawer.style.visibility = 'visible';
    drawer.style.pointerEvents = 'auto';
    setTimeout(() => {
      drawer.classList.add('open');
      drawer.style.right = '0';
    }, 15);
    
    // Create overlay if not exists
    let overlay = document.querySelector('.global-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'global-overlay';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    setTimeout(() => overlay.classList.add('show'), 15);
    
    overlay.onclick = () => closeDrawer(id);
    
    const closeBtns = drawer.querySelectorAll('.close-drawer, .close-panel, .btn-close-drawer, [data-action="close-drawer"]');
    closeBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        closeDrawer(id);
      };
    });

    if (window.lucide) lucide.createIcons();
  }
}

function closeDrawer(id) {
  const drawer = document.getElementById(id);
  if (drawer) {
    drawer.classList.remove('open');
    drawer.style.right = '-750px';
    setTimeout(() => {
      drawer.style.display = 'none';
      drawer.style.visibility = 'hidden';
      drawer.style.pointerEvents = 'none';
      drawer.classList.add('hidden');
    }, 380);
    
    const overlay = document.querySelector('.global-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => overlay.style.display = 'none', 380);
    }
  }
}

// ==========================================
// 18. SCROLL ANIMATIONS
// ==========================================
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.animate-on-scroll:not(.animated)').forEach(el => {
    observer.observe(el);
  });
}

// ==========================================
// 19. RIPPLE EFFECT
// ==========================================
function setupRipples() {
  document.querySelectorAll('.btn, button').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ==========================================
// GOLD CONFETTI CELEBRATION
// ==========================================
function launchGoldConfetti() {
  const count = 45;
  const colors = ['var(--accent)', 'var(--accent-light)', 'var(--accent-tint)', 'var(--accent-strong)', '#FFFFFF'];
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '99999';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const size = Math.random() * 8 + 6;
    const isCircle = Math.random() > 0.5;
    particle.style.position = 'absolute';
    particle.style.width = `${size}px`;
    particle.style.height = `${isCircle ? size : size * 1.5}px`;
    particle.style.borderRadius = isCircle ? '50%' : '2px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.left = `${Math.random() * 80 + 10}%`;
    particle.style.top = '-20px';
    particle.style.opacity = '1';
    particle.style.transform = `rotate(${Math.random() * 360}deg)`;
    particle.style.boxShadow = '0 0 6px rgba(var(--accent-rgb), 0.4)';
    container.appendChild(particle);

    const fallDuration = Math.random() * 1800 + 1400;
    const horizontalDrift = (Math.random() - 0.5) * 220;
    const rotateSpeed = (Math.random() - 0.5) * 720;

    particle.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${horizontalDrift}px, 105vh) rotate(${rotateSpeed}deg)`, opacity: 0 }
    ], {
      duration: fallDuration,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    });
  }

  setTimeout(() => {
    container.remove();
  }, 3600);
}

// ==========================================
// 20. NEW BOOKING FLOW (LUXURY 4-STEP ENGINE)
// ==========================================
function setupBookingFlow() {
  const openBookingBtns = document.querySelectorAll('#open-booking-drawer, .btn-new-booking, [data-action="new-booking"], #new-booking-btn, #res-open-booking-btn');
  openBookingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      openDrawer('booking-drawer');
      if (window.lucide) lucide.createIcons();
    });
  });

  // Booking State
  const bookingState = {
    step: 0,
    guestName: 'Arjun Mehta',
    isVip: true,
    room: {
      id: 'presidential',
      name: 'Presidential Suite',
      number: '405',
      rate: 28000,
      image: 'assets/img/room-deluxe.jpg'
    },
    checkIn: '2026-09-28',
    checkOut: '2026-09-30',
    nights: 2,
    adults: 2,
    children: 0,
    mealPlan: {
      code: 'CP',
      name: 'CP Plan (Breakfast Included)',
      rate: 1200
    },
    paymentMethod: 'upi',
    preferences: ['rose-welcome', 'premium-wine', 'jain-food']
  };

  // DOM Elements
  const steps = [
    document.getElementById('booking-step-0'),
    document.getElementById('booking-step-1'),
    document.getElementById('booking-step-2'),
    document.getElementById('booking-step-3')
  ];
  const stepperItems = document.querySelectorAll('.booking-stepper .stepper-item');
  const stepperLines = [
    document.getElementById('step-line-0'),
    document.getElementById('step-line-1'),
    document.getElementById('step-line-2')
  ];
  const progressBar = document.getElementById('booking-progress-bar');
  const btnPrev = document.getElementById('booking-btn-prev');
  const btnNext = document.getElementById('booking-btn-next');
  const btnConfirm = document.getElementById('booking-btn-confirm');
  const drawerBody = document.querySelector('.luxury-drawer-body');

  const guestNameInput = document.getElementById('booking-guest-name');
  const avatarPreview = document.getElementById('booking-avatar-preview');
  const vipToggle = document.getElementById('booking-vip-toggle');
  const checkinInput = document.getElementById('booking-checkin-date');
  const checkoutInput = document.getElementById('booking-checkout-date');
  const nightsCountEl = document.getElementById('booking-nights-count');
  const adultCountEl = document.getElementById('adult-count');
  const childCountEl = document.getElementById('child-count');
  const adultMinus = document.getElementById('adult-minus');
  const adultPlus = document.getElementById('adult-plus');
  const childMinus = document.getElementById('child-minus');
  const childPlus = document.getElementById('child-plus');

  // Currency helper
  const fmtINR = (amount) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  };

  // Recalculate Nights
  const calculateNights = () => {
    if (checkinInput && checkoutInput) {
      const d1 = new Date(checkinInput.value);
      const d2 = new Date(checkoutInput.value);
      const diffTime = d2 - d1;
      let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (isNaN(nights) || nights < 1) nights = 1;
      bookingState.nights = nights;
      if (nightsCountEl) nightsCountEl.textContent = nights;
    }
  };

  // Calculate & Update Price Breakdown
  const updateFolioCalculations = () => {
    calculateNights();

    const roomSubtotal = bookingState.room.rate * bookingState.nights;
    const mealSubtotal = bookingState.mealPlan.rate * bookingState.adults * bookingState.nights;
    const serviceCharge = Math.round((roomSubtotal + mealSubtotal) * 0.05);
    const tax = Math.round((roomSubtotal + mealSubtotal + serviceCharge) * 0.18);
    const grandTotal = roomSubtotal + mealSubtotal + serviceCharge + tax;

    // Update live drawer total in footer
    const liveTotalEl = document.getElementById('drawer-live-total');
    if (liveTotalEl) liveTotalEl.textContent = fmtINR(grandTotal);

    // Update Step 4 Folio Card
    const folioRoomImg = document.getElementById('folio-room-img');
    const folioRoomName = document.getElementById('folio-room-name');
    const folioRoomNum = document.getElementById('folio-room-num');
    const folioGuestName = document.getElementById('folio-guest-name');
    const folioVipBadge = document.getElementById('folio-vip-badge');
    const folioDatesDisplay = document.getElementById('folio-dates-display');
    const folioMealDisplay = document.getElementById('folio-meal-display');

    if (folioRoomImg) folioRoomImg.src = bookingState.room.image;
    if (folioRoomName) folioRoomName.textContent = bookingState.room.name;
    if (folioRoomNum) folioRoomNum.textContent = `Room ${bookingState.room.number}`;
    if (folioGuestName) folioGuestName.textContent = bookingState.guestName || 'Guest';
    if (folioVipBadge) folioVipBadge.style.display = bookingState.isVip ? 'inline-block' : 'none';

    if (folioDatesDisplay && checkinInput && checkoutInput) {
      const d1 = new Date(checkinInput.value);
      const d2 = new Date(checkoutInput.value);
      const d1Str = isNaN(d1) ? '28 Sep 2026' : d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const d2Str = isNaN(d2) ? '30 Sep 2026' : d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      folioDatesDisplay.textContent = `📅 ${d1Str} – ${d2Str} (${bookingState.nights} Night${bookingState.nights > 1 ? 's' : ''}, ${bookingState.adults} Adult${bookingState.adults > 1 ? 's' : ''}${bookingState.children > 0 ? ', ' + bookingState.children + ' Child' : ''})`;
    }

    if (folioMealDisplay) {
      folioMealDisplay.textContent = `🍽️ ${bookingState.mealPlan.name}`;
    }

    // Line items
    const lineRoom = document.getElementById('folio-line-room');
    const valRoom = document.getElementById('folio-val-room');
    const lineMeal = document.getElementById('folio-line-meal');
    const valMeal = document.getElementById('folio-val-meal');
    const valService = document.getElementById('folio-val-service');
    const valTax = document.getElementById('folio-val-tax');
    const valTotal = document.getElementById('folio-val-total');

    if (lineRoom) lineRoom.textContent = `${bookingState.room.name} (${bookingState.nights} Night${bookingState.nights > 1 ? 's' : ''} × ${fmtINR(bookingState.room.rate)})`;
    if (valRoom) valRoom.textContent = fmtINR(roomSubtotal);

    if (lineMeal) lineMeal.textContent = `Dining / ${bookingState.mealPlan.code} Plan (${bookingState.nights} Days × ${bookingState.adults} Guests)`;
    if (valMeal) valMeal.textContent = fmtINR(mealSubtotal);

    if (valService) valService.textContent = fmtINR(serviceCharge);
    if (valTax) valTax.textContent = fmtINR(tax);
    if (valTotal) valTotal.textContent = fmtINR(grandTotal);
  };

  // Step Navigation Engine
  const goToStep = (targetStep) => {
    if (targetStep < 0 || targetStep > 3) return;

    bookingState.step = targetStep;

    // Update Steps display
    steps.forEach((stepEl, idx) => {
      if (!stepEl) return;
      if (idx === targetStep) {
        stepEl.style.display = 'block';
      } else {
        stepEl.style.display = 'none';
      }
    });

    // Update Stepper circles & progress bar
    const progressPercentages = [25, 50, 75, 100];
    if (progressBar) progressBar.style.width = `${progressPercentages[targetStep]}%`;

    stepperItems.forEach((item, idx) => {
      item.classList.remove('active', 'completed');
      if (idx === targetStep) {
        item.classList.add('active');
      } else if (idx < targetStep) {
        item.classList.add('completed');
      }
    });

    // Stepper connecting lines
    stepperLines.forEach((line, idx) => {
      if (!line) return;
      if (idx < targetStep) {
        line.classList.add('filled');
      } else {
        line.classList.remove('filled');
      }
    });

    // Update Buttons
    if (btnPrev) {
      btnPrev.style.display = targetStep > 0 ? 'inline-flex' : 'none';
    }

    if (targetStep === 3) {
      if (btnNext) btnNext.style.display = 'none';
      if (btnConfirm) btnConfirm.style.display = 'inline-flex';
    } else {
      if (btnNext) {
        btnNext.style.display = 'inline-flex';
        const nextLabels = [
          '<span>Select Suite</span> <i data-lucide="arrow-right"></i>',
          '<span>Choose Stay & Dates</span> <i data-lucide="arrow-right"></i>',
          '<span>Review & Pay</span> <i data-lucide="arrow-right"></i>'
        ];
        btnNext.innerHTML = nextLabels[targetStep];
        if (window.lucide) lucide.createIcons();
      }
      if (btnConfirm) btnConfirm.style.display = 'none';
    }

    // Scroll body to top
    if (drawerBody) drawerBody.scrollTop = 0;

    // Recalculate folio calculations on step change
    updateFolioCalculations();
  };

  // Next / Prev Button Listeners
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      goToStep(bookingState.step + 1);
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      goToStep(bookingState.step - 1);
    });
  }

  // Allow clicking on stepper circles
  stepperItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = parseInt(item.getAttribute('data-step-target'), 10);
      if (!isNaN(target)) goToStep(target);
    });
  });

  // Guest Name Live Avatar Update
  if (guestNameInput) {
    guestNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      bookingState.guestName = val || 'Guest';
      const initials = val.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'G';
      if (avatarPreview) avatarPreview.textContent = initials;
      updateFolioCalculations();
    });
  }

  // VIP Toggle
  if (vipToggle) {
    vipToggle.addEventListener('change', (e) => {
      bookingState.isVip = e.target.checked;
      updateFolioCalculations();
    });
  }

  // Preference Chips Click
  const prefChips = document.querySelectorAll('.preference-chip');
  prefChips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });

  // Room Card Selection
  const roomCards = document.querySelectorAll('.room-pick-card');
  roomCards.forEach(card => {
    card.addEventListener('click', () => {
      roomCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      bookingState.room = {
        id: card.getAttribute('data-room-id'),
        name: card.getAttribute('data-room-name'),
        number: card.getAttribute('data-room-num'),
        rate: parseInt(card.getAttribute('data-rate'), 10),
        image: card.getAttribute('data-img')
      };

      updateFolioCalculations();
    });
  });

  // Date Change Listeners
  if (checkinInput) {
    checkinInput.addEventListener('change', () => {
      updateFolioCalculations();
    });
  }
  if (checkoutInput) {
    checkoutInput.addEventListener('change', () => {
      updateFolioCalculations();
    });
  }

  // Adult / Child Counters
  if (adultMinus) {
    adultMinus.addEventListener('click', () => {
      if (bookingState.adults > 1) {
        bookingState.adults--;
        if (adultCountEl) adultCountEl.textContent = bookingState.adults;
        updateFolioCalculations();
      }
    });
  }
  if (adultPlus) {
    adultPlus.addEventListener('click', () => {
      if (bookingState.adults < 6) {
        bookingState.adults++;
        if (adultCountEl) adultCountEl.textContent = bookingState.adults;
        updateFolioCalculations();
      }
    });
  }
  if (childMinus) {
    childMinus.addEventListener('click', () => {
      if (bookingState.children > 0) {
        bookingState.children--;
        if (childCountEl) childCountEl.textContent = bookingState.children;
        updateFolioCalculations();
      }
    });
  }
  if (childPlus) {
    childPlus.addEventListener('click', () => {
      if (bookingState.children < 4) {
        bookingState.children++;
        if (childCountEl) childCountEl.textContent = bookingState.children;
        updateFolioCalculations();
      }
    });
  }

  // Meal Plan Selection
  const mealCards = document.querySelectorAll('.meal-plan-card');
  mealCards.forEach(card => {
    card.addEventListener('click', () => {
      mealCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const planCode = card.getAttribute('data-plan');
      const planRate = parseInt(card.getAttribute('data-rate'), 10);
      const planNameEl = card.querySelector('.meal-name');
      const planName = planNameEl ? planNameEl.textContent.trim().split(' ')[0] + ' Plan' : planCode;

      bookingState.mealPlan = {
        code: planCode,
        name: planName,
        rate: planRate
      };

      updateFolioCalculations();
    });
  });

  // Payment Method Selection
  const payCards = document.querySelectorAll('.pay-method-card');
  payCards.forEach(card => {
    card.addEventListener('click', () => {
      payCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // Confirm Reservation Button
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      // Button loading state
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" style="width: 14px; height: 14px; border: 2px solid #1C1C1E; border-right-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.75s linear infinite;"></span> <span>Generating Folio...</span>';

      setTimeout(() => {
        // Trigger celebratory confetti
        launchGoldConfetti();

        // Update Dashboard Activity Feed
        const activityList = document.querySelector('.timeline-list, .activity-feed, .recent-activity-list');
        if (activityList) {
          const newActivity = document.createElement('div');
          newActivity.className = 'timeline-item';
          newActivity.innerHTML = `
            <div class="timeline-dot" style="background: #2D6A4F; border-color: #52B788; box-shadow: 0 0 0 3px rgba(45,106,79,0.2);"></div>
            <div class="timeline-content">
              <div class="timeline-title">${bookingState.guestName} (${bookingState.isVip ? 'VIP' : 'Confirmed'}) - ${bookingState.room.name}</div>
              <div class="timeline-sub">New Booking • Suite #${bookingState.room.number} • ${document.getElementById('drawer-live-total')?.textContent || '₹75,331'}</div>
            </div>
            <span class="timeline-time">Just now</span>
          `;
          activityList.prepend(newActivity);
        }

        // Show Toast Notification
        showToast(`✨ Reservation #BKR-2026-882 Confirmed for ${bookingState.guestName}! Folio dispatched.`, 'success');

        // Close Drawer & Reset Step
        setTimeout(() => {
          closeDrawer('booking-drawer');
          btnConfirm.disabled = false;
          btnConfirm.innerHTML = '<i data-lucide="sparkles"></i> <span>Confirm & Issue Folio</span>';
          goToStep(0);
          if (window.lucide) lucide.createIcons();
        }, 1200);
      }, 900);
    });
  }

  // Initial calculation
  updateFolioCalculations();
}

// ==========================================
// 21. MISC INTERACTIONS & UTILS
// ==========================================
function setupMisc() {
  // Quick Action Buttons in Hero Banner
  const walkinBtn = document.getElementById('quick-walkin-btn');
  if (walkinBtn) {
    walkinBtn.addEventListener('click', () => {
      openDrawer('booking-drawer');
      showToast('Walk-in guest registration opened', 'info');
    });
  }
  
  const checkoutBtn = document.getElementById('quick-checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      showToast('Quick Checkout: Room 302 processed successfully! Folio settled.', 'success');
    });
  }
  
  const sosBtn = document.getElementById('sos-alert-btn');
  if (sosBtn) {
    sosBtn.addEventListener('click', () => {
      showToast('🚨 Emergency SOS alert broadcasted to Security & Duty Manager!', 'error');
    });
  }

  const newBookingBtn = document.getElementById('new-booking-btn');
  if (newBookingBtn) {
    newBookingBtn.addEventListener('click', () => {
      openDrawer('booking-drawer');
    });
  }

  const quickCheckinsBtn = document.getElementById('dash-quick-checkins-btn');
  if (quickCheckinsBtn) {
    quickCheckinsBtn.addEventListener('click', () => {
      showScreen('reservations');
      showToast("Showing Today's Check-ins (12 arrivals)", 'info');
    });
  }

  const quickCheckoutsBtn = document.getElementById('dash-quick-checkouts-btn');
  if (quickCheckoutsBtn) {
    quickCheckoutsBtn.addEventListener('click', () => {
      showScreen('reservations');
      showToast("Showing Today's Check-outs (8 departures)", 'info');
    });
  }

  // Chart Tab Switching (Day / Week / Month)
  const chartTabs = document.querySelectorAll('.chart-tab[data-period]');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const period = tab.getAttribute('data-period');
      if (APP_STATE.charts.revenue) {
        if (period === 'day') {
          APP_STATE.charts.revenue.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          APP_STATE.charts.revenue.data.datasets[0].data = [290000, 365000, 270000, 465000, 530000, 410000, 510000];
        } else if (period === 'week') {
          APP_STATE.charts.revenue.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          APP_STATE.charts.revenue.data.datasets[0].data = [1850000, 2150000, 1950000, 2450000];
        } else if (period === 'month') {
          APP_STATE.charts.revenue.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
          APP_STATE.charts.revenue.data.datasets[0].data = [3800000, 4200000, 5100000, 4700000, 5800000, 6200000, 7100000, 6800000, 8400000, 9200000];
        }
        APP_STATE.charts.revenue.update();
      }
    });
  });

  // Topbar Search Trigger
  const topbarSearch = document.getElementById('search-trigger');
  if (topbarSearch) {
    topbarSearch.addEventListener('click', () => {
      openModal('search-modal');
    });
  }

  // User Profile Trigger
  const userMenuBtn = document.getElementById('user-menu-btn');
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', () => {
      showToast('Logged in as Aarav Mehta (GM) • Session Active', 'info');
    });
  }

  // Room Status Blocks interaction
  const roomBlocks = document.querySelectorAll('.room-block');
  roomBlocks.forEach(rb => {
    rb.addEventListener('click', () => {
      const roomNum = rb.getAttribute('data-room');
      const roomClass = rb.className;
      let status = 'Available';
      if (roomClass.includes('occupied')) status = 'Occupied';
      if (roomClass.includes('dirty')) status = 'Needs Housekeeping';
      showToast(`Room ${roomNum} Status: ${status}`, 'info');
    });
  });

  // Activity Feed Simulator
  const feed = document.querySelector('.activity-feed');
  if (feed) {
    setInterval(() => {
      const item = MOCK_DATA.activities[Math.floor(Math.random() * MOCK_DATA.activities.length)];
      const div = document.createElement('div');
      div.className = 'activity-item slide-in';
      div.innerHTML = `
        <div class="activity-icon"><i data-lucide="${item.icon}"></i></div>
        <div class="activity-content">
          <p>${item.text}</p>
          <span class="time">Just now</span>
        </div>
      `;
      feed.prepend(div);
      if (feed.children.length > 5) feed.lastElementChild.remove();
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 8000);
  }
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} slide-in-right`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'alert-circle';
  
  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Master event listener setup
function setupEventListeners() {
  setupLogin();
  setupNavigation();
  setupSidebar();
  setupSearch();
  setupNotifications();
  setupKanban();
  setupChat();
  setupCalendar();
  setupRooms();
  setupTabs();
  setupBookingFlow();
  setupMisc();
  setupReviews();
  setupAnalytics();
  initFinancialsSystem();
  initEventsSystem();
  setupSettings();
  
  const themeToggles = document.querySelectorAll('.theme-toggle');
  themeToggles.forEach(t => t.addEventListener('click', toggleTheme));
}

// ==========================================
// 23. ANALYTICS & INSIGHTS ENGINE
// ==========================================

function initAnalyticsCharts() {
  const ctxTrends = document.getElementById('alyBookingTrendsChart');
  const ctxDemo = document.getElementById('alyDemographicsChart');

  if (ctxTrends && !APP_STATE.charts.alyTrends) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#94A3B8' : '#64748B';

    const ctx = ctxTrends.getContext('2d');
    const gradDirect = ctx.createLinearGradient(0, 0, 0, 300);
    gradDirect.addColorStop(0, `rgba(${BC.rgb}, 0.35)`);
    gradDirect.addColorStop(1, `rgba(${BC.rgb}, 0.0)`);

    const gradOta = ctx.createLinearGradient(0, 0, 0, 300);
    gradOta.addColorStop(0, 'rgba(255, 159, 10, 0.35)');
    gradOta.addColorStop(1, 'rgba(255, 159, 10, 0.0)');

    const gradWalkin = ctx.createLinearGradient(0, 0, 0, 300);
    gradWalkin.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
    gradWalkin.addColorStop(1, 'rgba(244, 63, 94, 0.0)');

    APP_STATE.charts.alyTrends = new Chart(ctxTrends, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Direct',
            data: [80, 100, 130, 150, 210, 195, 255, 275, 340, 320, 390, 380],
            borderColor: BC.accent,
            backgroundColor: gradDirect,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: BC.accent,
            pointRadius: 4,
            pointHoverRadius: 7
          },
          {
            label: 'OTA',
            data: [120, 180, 200, 250, 285, 315, 300, 345, 380, 400, 420, 445],
            borderColor: '#FF9F0A',
            backgroundColor: gradOta,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#FF9F0A',
            pointRadius: 4,
            pointHoverRadius: 7
          },
          {
            label: 'Walk-in',
            data: [35, 50, 40, 70, 85, 72, 85, 82, 100, 90, 122, 118],
            borderColor: '#F43F5E',
            backgroundColor: gradWalkin,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#F43F5E',
            pointRadius: 4,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1D1D1F',
            titleColor: BC.accent,
            bodyColor: '#FFFFFF',
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.parsed.y} bookings`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: FONT_SANS, size: 11 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: FONT_SANS, size: 11 } },
            beginAtZero: true
          }
        }
      }
    });
  }

  if (ctxDemo && !APP_STATE.charts.alyDemo) {
    APP_STATE.charts.alyDemo = new Chart(ctxDemo, {
      type: 'doughnut',
      data: {
        labels: ['Couples', 'Families', 'Business', 'Solo Travelers', 'Groups'],
        datasets: [{
          data: [42, 28, 15, 10, 5],
          backgroundColor: [BC.accent, '#34C759', '#FF9F0A', '#AF52DE', '#FF375F'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '76%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1D1D1F',
            bodyColor: '#FFFFFF',
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.parsed}% of total guests`;
              }
            }
          }
        }
      }
    });
  }
}

function setupAnalytics() {
  // Period filter in Hero Banner
  const periodFilter = document.getElementById('aly-period-filter');
  if (periodFilter) {
    periodFilter.addEventListener('change', (e) => {
      const days = e.target.value;
      updateAnalyticsData(days);
    });
  }

  // Booking Trends Filter
  const trendsFilter = document.getElementById('aly-trends-filter');
  if (trendsFilter) {
    trendsFilter.addEventListener('change', (e) => {
      const val = e.target.value;
      if (APP_STATE.charts.alyTrends) {
        if (val === '7') {
          APP_STATE.charts.alyTrends.data.labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          APP_STATE.charts.alyTrends.data.datasets[0].data = [40, 55, 62, 58, 85, 98, 80];
          APP_STATE.charts.alyTrends.data.datasets[1].data = [70, 85, 90, 88, 120, 140, 115];
          APP_STATE.charts.alyTrends.data.datasets[2].data = [15, 20, 25, 22, 35, 42, 30];
        } else if (val === '90') {
          APP_STATE.charts.alyTrends.data.labels = ['Month 1', 'Month 2', 'Month 3'];
          APP_STATE.charts.alyTrends.data.datasets[0].data = [280, 310, 340];
          APP_STATE.charts.alyTrends.data.datasets[1].data = [350, 375, 400];
          APP_STATE.charts.alyTrends.data.datasets[2].data = [80, 92, 100];
        } else {
          APP_STATE.charts.alyTrends.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          APP_STATE.charts.alyTrends.data.datasets[0].data = [80, 100, 130, 150, 210, 195, 255, 275, 340, 320, 390, 380];
          APP_STATE.charts.alyTrends.data.datasets[1].data = [120, 180, 200, 250, 285, 315, 300, 345, 380, 400, 420, 445];
          APP_STATE.charts.alyTrends.data.datasets[2].data = [35, 50, 40, 70, 85, 72, 85, 82, 100, 90, 122, 118];
        }
        APP_STATE.charts.alyTrends.update();
        showToast(`📊 Booking trends adjusted to ${val} days timeframe`, 'info');
      }
    });
  }

  // Top Insights Row Clicks
  const insightItems = document.querySelectorAll('.aly-insight-item');
  insightItems.forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-insight-type');
      if (type === 'bookings') {
        showToast('📈 Direct bookings surged by 18% following the dining campaign.', 'success');
      } else if (type === 'audience') {
        showToast('💑 Couples account for 42% of revenue. Spa package recommendations enabled.', 'info');
      } else if (type === 'stay') {
        showToast('🌙 Average length of stay holds strong at 2.3 nights with weekend peaks.', 'info');
      } else if (type === 'satisfaction') {
        showToast('⭐ Guest satisfaction rating index: 4.6/5 across 847 reviews.', 'success');
      }
    });
  });

  // Heatmap Cells Click
  const hmCells = document.querySelectorAll('.aly-hm-cell');
  hmCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const title = cell.getAttribute('title') || 'Occupancy detail';
      showToast(`🏨 ${title} occupancy rate recorded`, 'info');
    });
  });
}

function updateAnalyticsData(days) {
  const elAdr = document.getElementById('aly-val-adr');
  const elRevpar = document.getElementById('aly-val-revpar');
  const elLos = document.getElementById('aly-val-los');
  const elBookings = document.getElementById('aly-val-bookings');
  const elDemoTotal = document.getElementById('aly-demo-total');

  if (days === '7') {
    if (elAdr) elAdr.textContent = '₹9,200';
    if (elRevpar) elRevpar.textContent = '₹7,150';
    if (elLos) elLos.textContent = '2.5 nights';
    if (elBookings) elBookings.textContent = '108';
    if (elDemoTotal) elDemoTotal.textContent = '214';
    showToast('📅 Analytics metrics calibrated for Last 7 Days.', 'info');
  } else if (days === '90') {
    if (elAdr) elAdr.textContent = '₹8,350';
    if (elRevpar) elRevpar.textContent = '₹6,480';
    if (elLos) elLos.textContent = '2.2 nights';
    if (elBookings) elBookings.textContent = '1,240';
    if (elDemoTotal) elDemoTotal.textContent = '2,480';
    showToast('📅 Analytics metrics calibrated for Last Quarter.', 'info');
  } else if (days === '365') {
    if (elAdr) elAdr.textContent = '₹8,800';
    if (elRevpar) elRevpar.textContent = '₹6,900';
    if (elLos) elLos.textContent = '2.4 nights';
    if (elBookings) elBookings.textContent = '5,120';
    if (elDemoTotal) elDemoTotal.textContent = '10,240';
    showToast('📅 Analytics metrics calibrated for Last Year.', 'info');
  } else {
    if (elAdr) elAdr.textContent = '₹8,500';
    if (elRevpar) elRevpar.textContent = '₹6,630';
    if (elLos) elLos.textContent = '2.3 nights';
    if (elBookings) elBookings.textContent = '428';
    if (elDemoTotal) elDemoTotal.textContent = '847';
    showToast('📅 Analytics metrics calibrated for Last 30 Days.', 'info');
  }
}

// ==========================================
// 22. GUEST REVIEWS ENGINE
// ==========================================

const INITIAL_REVIEWS_DATA = [
  {
    id: 'rev-101',
    author: 'Sameer Desai',
    avatar: 'SD',
    verified: true,
    stayDate: 'Oct 10, 2026',
    room: 'Presidential Suite (Room 405)',
    platform: 'Airbnb',
    platformRating: '4.8 / 5',
    rating: 5,
    title: 'Exceptional Service - Unforgettable Experience!',
    text: 'Absolutely wonderful experience. The property is breathtaking and the staff treated us like family. The Presidential Suite was worth every rupee. Will definitely visit again!',
    photos: ['assets/img/room-deluxe.jpg', 'assets/img/room-premium.jpg', 'assets/img/room-suite.jpg', 'assets/img/room-modern.jpg'],
    helpfulCount: 12,
    isHelpful: false,
    managementReply: null
  },
  {
    id: 'rev-102',
    author: 'Priya Sharma',
    avatar: 'PS',
    verified: true,
    stayDate: 'Sep 26, 2026',
    room: 'Deluxe Room (Room 101)',
    platform: 'Booking.com',
    platformRating: '4.5 / 5',
    rating: 5,
    title: 'Exquisite Hospitality & Beautiful Ambiance',
    text: 'Beautiful property, amazing hospitality and delicious food. The evening live music performance was a highlight of our trip!',
    photos: ['assets/img/room-premium.jpg', 'assets/img/room-suite.jpg'],
    helpfulCount: 8,
    isHelpful: false,
    managementReply: null
  },
  {
    id: 'rev-103',
    author: 'Neha Patil',
    avatar: 'NP',
    verified: true,
    stayDate: 'Sep 20, 2026',
    room: 'Premium Villa (Room 204)',
    platform: 'TripAdvisor',
    platformRating: '4.6 / 5',
    rating: 4,
    title: 'Lovely Gardens & Serene Environment',
    text: 'Great ambiance and lovely gardens. Food was good but the service at the restaurant during breakfast was a bit slow on Sunday. Otherwise a perfect stay.',
    photos: ['assets/img/room-modern.jpg'],
    helpfulCount: 5,
    isHelpful: false,
    managementReply: {
      signatory: 'Aarav Mehta - General Manager',
      date: 'Sep 21, 2026',
      text: 'Thank you for your valuable feedback, Neha. We are glad you enjoyed the gardens and ambiance. We have addressed the breakfast service speed with our F&B team to ensure seamless service.'
    }
  },
  {
    id: 'rev-104',
    author: 'Varun Tiwari',
    avatar: 'VT',
    verified: true,
    stayDate: 'Oct 05, 2026',
    room: 'Premium Villa (Room 108)',
    platform: 'Google',
    platformRating: '4.7 / 5',
    rating: 5,
    title: 'Magical Anniversary Celebration',
    text: 'We held our anniversary dinner here. The night lighting with fireworks was spectacular. Unforgettable memories created here!',
    photos: ['assets/img/room-deluxe.jpg', 'assets/img/room-modern.jpg'],
    helpfulCount: 19,
    isHelpful: false,
    managementReply: null
  },
  {
    id: 'rev-105',
    author: 'Manish Rao',
    avatar: 'MR',
    verified: true,
    stayDate: 'Oct 02, 2026',
    room: 'Standard Room (Room 106)',
    platform: 'Google',
    platformRating: '4.7 / 5',
    rating: 2,
    title: 'AC Noise Issue & Slow Maintenance Response',
    text: 'AC in our room was making noise all night. Maintenance took 2 hours to arrive. Not the luxury standard expected for the price paid.',
    photos: [],
    helpfulCount: 3,
    isHelpful: false,
    managementReply: {
      signatory: 'Aarav Mehta - General Manager',
      date: 'Oct 03, 2026',
      text: 'Dear Manish, please accept our sincere apologies for the discomfort caused by the AC unit. We have completely overhauled the HVAC system in Room 106 and issued a credit voucher for your next stay.'
    }
  },
  {
    id: 'rev-106',
    author: 'Anjali Joshi',
    avatar: 'AJ',
    verified: true,
    stayDate: 'Sep 28, 2026',
    room: 'Pool Cabana (Room 109)',
    platform: 'Booking.com',
    platformRating: '4.5 / 5',
    rating: 5,
    title: 'Relaxing Pool Cabana & Modern Comfort',
    text: 'The pool cabana was extremely relaxing. I loved the clean aesthetic and modern comforts. Staff was super attentive!',
    photos: ['assets/img/room-suite.jpg'],
    helpfulCount: 7,
    isHelpful: false,
    managementReply: null
  }
];

const REVIEWS_STATE = {
  reviews: [...INITIAL_REVIEWS_DATA],
  filterPlatform: 'all',
  filterRating: 'all',
  filterSort: 'newest',
  searchQuery: '',
  selectedStarRating: 5
};

function getPlatformIconSvg(platform) {
  switch (platform) {
    case 'Google':
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="var(--accent)" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;
    case 'TripAdvisor':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#00AF87"/><path d="M12 7c-2.8 0-5 1.8-5.7 4.2h11.4C17 8.8 14.8 7 12 7zm-4 7a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" fill="#FFF"/></svg>`;
    case 'Booking.com':
      return `<span style="font-weight:900; color:#003580; font-size:0.85rem; line-height:1;">B.</span>`;
    case 'Airbnb':
      return `<svg width="18" height="18" viewBox="0 0 24 24" fill="#FF5A5F"><path d="M12 2C8.5 2 5.5 5.5 5.5 9.5c0 5 6.5 12.5 6.5 12.5s6.5-7.5 6.5-12.5C18.5 5.5 15.5 2 12 2zm0 10a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>`;
    default:
      return `<i data-lucide="globe" style="width:16px; height:16px; color:var(--accent);"></i>`;
  }
}

function renderStarsHtml(count) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= count) {
      html += `<i data-lucide="star" class="fill"></i>`;
    } else {
      html += `<i data-lucide="star"></i>`;
    }
  }
  return html;
}

function renderReviewsView() {
  const container = document.getElementById('rev-list-wrapper');
  if (!container) return;

  // Filter
  let list = REVIEWS_STATE.reviews.filter(r => {
    if (REVIEWS_STATE.filterPlatform !== 'all' && r.platform !== REVIEWS_STATE.filterPlatform) return false;
    if (REVIEWS_STATE.filterRating !== 'all' && String(r.rating) !== String(REVIEWS_STATE.filterRating)) return false;
    if (REVIEWS_STATE.searchQuery) {
      const q = REVIEWS_STATE.searchQuery.toLowerCase();
      const matchAuthor = r.author.toLowerCase().includes(q);
      const matchText = r.text.toLowerCase().includes(q);
      const matchRoom = r.room.toLowerCase().includes(q);
      const matchTitle = r.title && r.title.toLowerCase().includes(q);
      if (!matchAuthor && !matchText && !matchRoom && !matchTitle) return false;
    }
    return true;
  });

  // Sort
  list.sort((a, b) => {
    if (REVIEWS_STATE.filterSort === 'highest') return b.rating - a.rating;
    if (REVIEWS_STATE.filterSort === 'lowest') return a.rating - b.rating;
    if (REVIEWS_STATE.filterSort === 'helpful') return b.helpfulCount - a.helpfulCount;
    // newest first (default)
    return b.id.localeCompare(a.id);
  });

  // Active filter badge display
  const activeTag = document.getElementById('rev-active-tag');
  if (activeTag) {
    if (REVIEWS_STATE.filterPlatform !== 'all' || REVIEWS_STATE.filterRating !== 'all' || REVIEWS_STATE.searchQuery) {
      activeTag.style.display = 'inline-flex';
      let tagParts = [];
      if (REVIEWS_STATE.filterPlatform !== 'all') tagParts.push(`Platform: ${REVIEWS_STATE.filterPlatform}`);
      if (REVIEWS_STATE.filterRating !== 'all') tagParts.push(`Rating: ${REVIEWS_STATE.filterRating}★`);
      if (REVIEWS_STATE.searchQuery) tagParts.push(`"${REVIEWS_STATE.searchQuery}"`);
      activeTag.innerHTML = `Showing ${list.length} results (${tagParts.join(' • ')}) <i data-lucide="x" style="width:12px; height:12px; cursor:pointer;" id="btn-clear-rev-tag"></i>`;
      
      const clearBtn = document.getElementById('btn-clear-rev-tag');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          REVIEWS_STATE.filterPlatform = 'all';
          REVIEWS_STATE.filterRating = 'all';
          REVIEWS_STATE.searchQuery = '';
          document.getElementById('rev-filter-platform').value = 'all';
          document.getElementById('rev-filter-rating').value = 'all';
          document.getElementById('rev-search-input').value = '';
          renderReviewsView();
        });
      }
    } else {
      activeTag.style.display = 'none';
    }
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 24px; background: #FFFFFF; border-radius: 20px; border: 1px solid #E8E8ED;">
        <i data-lucide="search-x" style="width: 48px; height: 48px; color: var(--accent-strong); margin-bottom: 12px;"></i>
        <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #1D1D1F;">No Reviews Matching Filter</h3>
        <p style="color: #64748B; font-size: 0.85rem; margin-top: 4px;">Try clearing your search query or selecting "All Platforms".</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  // Render cards
  container.innerHTML = list.map(r => `
    <div class="rev-card" data-rev-id="${r.id}">
      <div class="rev-card-header">
        <div class="rev-user-meta">
          <div class="rev-avatar">${r.avatar}</div>
          <div class="rev-author-details">
            <div class="rev-author-name-row">
              <span class="rev-author-name">${r.author}</span>
              ${r.verified ? `<span class="rev-verified-tag"><i data-lucide="check-circle-2" style="width:11px; height:11px;"></i> Verified Guest</span>` : ''}
            </div>
            <div class="rev-stay-info">${r.stayDate} • ${r.room}</div>
          </div>
        </div>
        <div class="rev-plat-tag">
          ${getPlatformIconSvg(r.platform)}
          <span>${r.platform} ${r.platformRating ? r.platformRating : r.rating + ' / 5'}</span>
        </div>
      </div>

      <div class="rev-card-stars-row">
        <div class="rev-stars-flex">
          ${renderStarsHtml(r.rating)}
        </div>
        ${r.title ? `<div class="rev-card-title">${r.title}</div>` : ''}
      </div>

      <p class="rev-body-text">${r.text}</p>

      ${r.photos && r.photos.length > 0 ? `
        <div class="rev-photo-grid">
          ${r.photos.map(p => `
            <img src="${p}" alt="Guest photo" class="rev-photo-thumb" data-photo-src="${p}">
          `).join('')}
        </div>
      ` : ''}

      ${r.managementReply ? `
        <div class="rev-management-reply">
          <div class="rev-reply-header">
            <span class="rev-reply-title"><i data-lucide="shield-check" style="width:14px; height:14px;"></i> Response from ${r.managementReply.signatory}</span>
            <span class="rev-reply-date">${r.managementReply.date}</span>
          </div>
          <p class="rev-reply-text">"${r.managementReply.text}"</p>
        </div>
      ` : ''}

      <div class="rev-card-footer">
        <div class="rev-action-btns">
          <button type="button" class="btn-rev-action ${r.isHelpful ? 'active-helpful' : ''}" data-act="helpful" data-id="${r.id}">
            <i data-lucide="thumbs-up" style="width:14px; height:14px;"></i>
            <span>Helpful (${r.helpfulCount})</span>
          </button>
          <button type="button" class="btn-rev-action" data-act="reply" data-id="${r.id}" data-name="${r.author}" data-text="${r.text.substring(0, 80)}...">
            <i data-lucide="corner-up-left" style="width:14px; height:14px;"></i>
            <span>Reply</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  bindReviewEvents();
  if (window.lucide) lucide.createIcons();
}

function bindReviewEvents() {
  // Helpful button toggle
  document.querySelectorAll('.btn-rev-action[data-act="helpful"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const revId = btn.getAttribute('data-id');
      const item = REVIEWS_STATE.reviews.find(r => r.id === revId);
      if (item) {
        if (item.isHelpful) {
          item.helpfulCount--;
          item.isHelpful = false;
          showToast('Feedback updated', 'info');
        } else {
          item.helpfulCount++;
          item.isHelpful = true;
          showToast('Marked review as helpful 👍', 'success');
        }
        renderReviewsView();
      }
    });
  });

  // Reply button click opens modal
  document.querySelectorAll('.btn-rev-action[data-act="reply"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const revId = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const snippet = btn.getAttribute('data-text');

      const targetInput = document.getElementById('rev-reply-target-id');
      const quoteName = document.getElementById('rev-reply-quote-name');
      const quoteText = document.getElementById('rev-reply-quote-text');
      const modal = document.getElementById('modal-reply-review');

      if (targetInput) targetInput.value = revId;
      if (quoteName) quoteName.textContent = `Replying to ${name}`;
      if (quoteText) quoteText.textContent = snippet;

      if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
      }
    });
  });

  // Photo Lightbox click
  document.querySelectorAll('.rev-photo-thumb').forEach(img => {
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = img.getAttribute('data-photo-src');
      const fullImg = document.getElementById('lightbox-full-img');
      const modal = document.getElementById('modal-photo-lightbox');
      if (fullImg) fullImg.src = src;
      if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
      }
    });
  });
}

function setupReviews() {
  // Platform Filter Dropdown
  const platformSelect = document.getElementById('rev-filter-platform');
  if (platformSelect) {
    platformSelect.addEventListener('change', (e) => {
      REVIEWS_STATE.filterPlatform = e.target.value;
      renderReviewsView();
    });
  }

  // Rating Filter Dropdown
  const ratingSelect = document.getElementById('rev-filter-rating');
  if (ratingSelect) {
    ratingSelect.addEventListener('change', (e) => {
      REVIEWS_STATE.filterRating = e.target.value;
      renderReviewsView();
    });
  }

  // Sort Filter Dropdown
  const sortSelect = document.getElementById('rev-filter-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      REVIEWS_STATE.filterSort = e.target.value;
      renderReviewsView();
    });
  }

  // Search Input
  const searchInput = document.getElementById('rev-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      REVIEWS_STATE.searchQuery = e.target.value.trim();
      renderReviewsView();
    });
  }

  // Platform Cards Click in middle panel
  document.querySelectorAll('.rev-plat-card[data-plat-filter]').forEach(card => {
    card.addEventListener('click', () => {
      const plat = card.getAttribute('data-plat-filter');
      REVIEWS_STATE.filterPlatform = plat;
      if (platformSelect) platformSelect.value = plat;
      renderReviewsView();
      showToast(`Filtered reviews by ${plat}`, 'info');
    });
  });

  // Reset Filters link
  const resetBtn = document.getElementById('rev-reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      REVIEWS_STATE.filterPlatform = 'all';
      REVIEWS_STATE.filterRating = 'all';
      REVIEWS_STATE.searchQuery = '';
      if (platformSelect) platformSelect.value = 'all';
      if (ratingSelect) ratingSelect.value = 'all';
      if (searchInput) searchInput.value = '';
      renderReviewsView();
      showToast('Showing all platform reviews', 'info');
    });
  }

  // Write Review Modal handlers
  const btnOpenWrite = document.getElementById('btn-write-review-open');
  const modalWrite = document.getElementById('modal-write-review');
  const btnCloseWrite = document.getElementById('btn-close-write-review');
  const btnCancelWrite = document.getElementById('btn-cancel-write-review');
  const backdropWrite = document.getElementById('backdrop-write-review');
  const formWrite = document.getElementById('form-write-review');

  const closeWriteModal = () => {
    if (modalWrite) modalWrite.classList.add('hidden');
  };

  if (btnOpenWrite && modalWrite) {
    btnOpenWrite.addEventListener('click', () => {
      modalWrite.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    });
  }

  if (btnCloseWrite) btnCloseWrite.addEventListener('click', closeWriteModal);
  if (btnCancelWrite) btnCancelWrite.addEventListener('click', closeWriteModal);
  if (backdropWrite) backdropWrite.addEventListener('click', closeWriteModal);

  // Interactive Star Rating selector in Write Modal (Robust Event Delegation)
  const starPickerContainer = document.getElementById('rev-modal-star-picker');
  if (starPickerContainer) {
    starPickerContainer.addEventListener('click', (e) => {
      const star = e.target.closest('[data-val]');
      if (!star) return;
      const val = parseInt(star.getAttribute('data-val'), 10);
      REVIEWS_STATE.selectedStarRating = val;
      starPickerContainer.querySelectorAll('[data-val]').forEach((s, idx) => {
        if (idx < val) {
          s.classList.add('fill');
          s.classList.add('active');
        } else {
          s.classList.remove('fill');
          s.classList.remove('active');
        }
      });
    });
  }

  // Submit Write Review
  if (formWrite) {
    formWrite.addEventListener('submit', (e) => {
      e.preventDefault();
      const author = document.getElementById('rev-input-author').value.trim();
      const room = document.getElementById('rev-input-room').value.trim();
      const platform = document.getElementById('rev-input-platform').value;
      const title = document.getElementById('rev-input-title').value.trim();
      const text = document.getElementById('rev-input-text').value.trim();

      const initials = author.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'G';

      const newRev = {
        id: `rev-${Date.now()}`,
        author: author,
        avatar: initials,
        verified: true,
        stayDate: 'Just now',
        room: room,
        platform: platform,
        platformRating: `${REVIEWS_STATE.selectedStarRating}.0 / 5`,
        rating: REVIEWS_STATE.selectedStarRating,
        title: title,
        text: text,
        photos: ['assets/img/room-deluxe.jpg'],
        helpfulCount: 0,
        isHelpful: false,
        managementReply: null
      };

      REVIEWS_STATE.reviews.unshift(newRev);
      renderReviewsView();
      closeWriteModal();
      formWrite.reset();
      showToast(`✨ Guest review published for ${author}!`, 'success');
    });
  }

  // Reply Review Modal handlers
  const modalReply = document.getElementById('modal-reply-review');
  const btnCloseReply = document.getElementById('btn-close-reply-review');
  const btnCancelReply = document.getElementById('btn-cancel-reply-review');
  const backdropReply = document.getElementById('backdrop-reply-review');
  const formReply = document.getElementById('form-reply-review');

  const closeReplyModal = () => {
    if (modalReply) modalReply.classList.add('hidden');
  };

  if (btnCloseReply) btnCloseReply.addEventListener('click', closeReplyModal);
  if (btnCancelReply) btnCancelReply.addEventListener('click', closeReplyModal);
  if (backdropReply) backdropReply.addEventListener('click', closeReplyModal);

  if (formReply) {
    formReply.addEventListener('submit', (e) => {
      e.preventDefault();
      const revId = document.getElementById('rev-reply-target-id').value;
      const text = document.getElementById('rev-reply-input-text').value.trim();
      const signatory = document.getElementById('rev-reply-signatory').value;

      const item = REVIEWS_STATE.reviews.find(r => r.id === revId);
      if (item) {
        item.managementReply = {
          signatory: signatory,
          date: 'Just now',
          text: text
        };
        renderReviewsView();
        closeReplyModal();
        formReply.reset();
        showToast('Official management response published!', 'success');
      }
    });
  }

  // Photo Lightbox close handler
  const modalLightbox = document.getElementById('modal-photo-lightbox');
  const btnCloseLightbox = document.getElementById('btn-close-photo-lightbox');
  const backdropLightbox = document.getElementById('backdrop-photo-lightbox');

  const closeLightboxModal = () => {
    if (modalLightbox) modalLightbox.classList.add('hidden');
  };

  if (btnCloseLightbox) btnCloseLightbox.addEventListener('click', closeLightboxModal);
  if (backdropLightbox) backdropLightbox.addEventListener('click', closeLightboxModal);

  // Initial render
  renderReviewsView();
}

// ==========================================
// FINANCIALS MANAGEMENT SYSTEM
// ==========================================
const FINANCIAL_STATE = {
  activePeriod: 'month',
  invoices: [
    {
      id: 'INV-00124',
      date: '26 Sep 2026',
      guest: 'Priya Sharma',
      room: 'Suite #401 (Presidential Suite)',
      contact: '+91 98765 43210 • priya.sharma@example.com',
      dates: '24 Sep 2026 – 26 Sep 2026 (2 Nights)',
      amount: 45000,
      status: 'paid',
      items: [
        { desc: 'Presidential Suite Tariff (2 Nights @ ₹18,000)', hsn: '9963', qty: '2 Nights', rate: 18000, amount: 36000 },
        { desc: 'In-Room Dining & High Tea Service', hsn: '9963', qty: '1 Service', rate: 2135, amount: 2135 },
        { desc: 'CGST (9%) & SGST (9%) Luxury Taxes', hsn: '9963', qty: '18%', rate: 6865, amount: 6865 }
      ]
    },
    {
      id: 'INV-00123',
      date: '25 Sep 2026',
      guest: 'Arjun Mehta',
      room: 'Villa #102 (Premium Villa)',
      contact: '+91 98234 56789 • arjun.mehta@example.com',
      dates: '23 Sep 2026 – 25 Sep 2026 (2 Nights)',
      amount: 32000,
      status: 'paid',
      items: [
        { desc: 'Premium Villa Tariff (2 Nights @ ₹13,000)', hsn: '9963', qty: '2 Nights', rate: 13000, amount: 26000 },
        { desc: 'Pool Cabana Sunset Snacks & Beverages', hsn: '9963', qty: '1 Service', rate: 1119, amount: 1119 },
        { desc: 'CGST & SGST Applicable Taxes (18%)', hsn: '9963', qty: '18%', rate: 4881, amount: 4881 }
      ]
    },
    {
      id: 'INV-00122',
      date: '24 Sep 2026',
      guest: 'Anita Desai',
      room: 'Deluxe #205 (Courtyard Room)',
      contact: '+91 97112 34567 • anita.desai@example.com',
      dates: '22 Sep 2026 – 24 Sep 2026 (2 Nights)',
      amount: 28500,
      status: 'pending',
      items: [
        { desc: 'Garden Courtyard Room Tariff', hsn: '9963', qty: '2 Nights', rate: 11500, amount: 23000 },
        { desc: 'Ayurvedic Herbal Spa Rejuvenation', hsn: '9963', qty: '1 Session', rate: 1153, amount: 1153 },
        { desc: 'GST Hospitality Taxes (18%)', hsn: '9963', qty: '18%', rate: 4347, amount: 4347 }
      ]
    },
    {
      id: 'INV-00121',
      date: '23 Sep 2026',
      guest: 'Raja Holdings',
      room: 'Corporate Suite #301 + Hall',
      contact: '+91 98100 11223 • accounts@rajaholdings.in',
      dates: '20 Sep 2026 – 23 Sep 2026 (3 Nights)',
      amount: 120000,
      status: 'paid',
      items: [
        { desc: 'Corporate Luxury Suite Stay (3 Nights)', hsn: '9963', qty: '3 Nights', rate: 25000, amount: 75000 },
        { desc: 'Banquet Hall Day Rental & High Tea', hsn: '9963', qty: '1 Event', rate: 26695, amount: 26695 },
        { desc: 'GST Taxes (18%)', hsn: '9963', qty: '18%', rate: 18305, amount: 18305 }
      ]
    },
    {
      id: 'INV-00120',
      date: '22 Sep 2026',
      guest: 'Kiran Patel',
      room: 'Suite #1D1D1F (Garden Cottage)',
      contact: '+91 99201 99887 • kiran.patel@example.com',
      dates: '20 Sep 2026 – 22 Sep 2026 (2 Nights)',
      amount: 36000,
      status: 'paid',
      items: [
        { desc: 'Garden Cottage Stay (2 Nights)', hsn: '9963', qty: '2 Nights', rate: 14500, amount: 29000 },
        { desc: 'Airport Luxury Transfer (Audi Q7)', hsn: '9963', qty: 'Round Trip', rate: 1508, amount: 1508 },
        { desc: 'GST Taxes (18%)', hsn: '9963', qty: '18%', rate: 5492, amount: 5492 }
      ]
    }
  ]
};

function initFinancialsSystem() {
  renderFinancialInvoices();
  bindFinancialEvents();
}

function renderFinancialInvoices() {
  const tbody = document.getElementById('fin-invoices-tbody');
  if (!tbody) return;

  tbody.innerHTML = FINANCIAL_STATE.invoices.map(inv => `
    <tr data-invoice-id="${inv.id}" style="cursor: pointer;">
      <td class="fin-inv-num">${inv.id}</td>
      <td>${inv.date}</td>
      <td>
        <div style="font-weight: 600; color: inherit;">${inv.guest}</div>
        <div style="font-size: 0.74rem; color: #64748B;">${inv.room}</div>
      </td>
      <td class="fin-inv-amount">₹${inv.amount.toLocaleString('en-IN')}</td>
      <td>
        <span class="${inv.status === 'paid' ? 'badge-status-paid' : 'badge-status-pending'}">
          <i data-lucide="${inv.status === 'paid' ? 'check' : 'clock'}" style="width: 11px; height: 11px;"></i>
          <span>${inv.status === 'paid' ? 'Paid' : 'Pending'}</span>
        </span>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn-table-action" onclick="event.stopPropagation(); openInvoiceModal('${inv.id}')">
          <i data-lucide="eye" style="width: 12px; height: 12px;"></i>
          <span>Folio</span>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-invoice-id]').forEach(row => {
    row.onclick = () => {
      const invId = row.getAttribute('data-invoice-id');
      openInvoiceModal(invId);
    };
  });

  if (window.lucide) lucide.createIcons();
}

function openInvoiceModal(invId) {
  const inv = FINANCIAL_STATE.invoices.find(i => i.id === invId) || FINANCIAL_STATE.invoices[0];
  if (!inv) return;

  const modal = document.getElementById('modal-invoice-detail');
  if (!modal) return;

  const idEl = document.getElementById('inv-modal-id');
  const dateEl = document.getElementById('inv-modal-date');
  const guestEl = document.getElementById('inv-modal-guest-name');
  const contactEl = document.getElementById('inv-modal-guest-contact');
  const roomEl = document.getElementById('inv-modal-room');
  const datesEl = document.getElementById('inv-modal-dates');
  const statusBadge = document.getElementById('inv-modal-status-badge');

  if (idEl) idEl.textContent = inv.id;
  if (dateEl) dateEl.textContent = `Date: ${inv.date}`;
  if (guestEl) guestEl.textContent = inv.guest;
  if (contactEl) contactEl.textContent = inv.contact;
  if (roomEl) roomEl.textContent = inv.room;
  if (datesEl) datesEl.textContent = inv.dates;

  if (statusBadge) {
    statusBadge.textContent = inv.status === 'paid' ? 'PAID IN FULL' : 'PAYMENT PENDING';
    statusBadge.style.color = inv.status === 'paid' ? '#059669' : '#D97706';
    statusBadge.style.background = inv.status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  }

  // Calculate totals
  const subtotal = Math.round(inv.amount / 1.18);
  const tax = inv.amount - subtotal;
  const halfTax = Math.round(tax / 2);

  const subEl = document.getElementById('inv-modal-subtotal');
  const cgstEl = document.getElementById('inv-modal-cgst');
  const sgstEl = document.getElementById('inv-modal-sgst');
  const grandEl = document.getElementById('inv-modal-grandtotal');
  const paidEl = document.getElementById('inv-modal-paid');
  const balEl = document.getElementById('inv-modal-balance');

  if (subEl) subEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (cgstEl) cgstEl.textContent = `₹${halfTax.toLocaleString('en-IN')}`;
  if (sgstEl) sgstEl.textContent = `₹${(tax - halfTax).toLocaleString('en-IN')}`;
  if (grandEl) grandEl.textContent = `₹${inv.amount.toLocaleString('en-IN')}`;

  if (paidEl && balEl) {
    if (inv.status === 'paid') {
      paidEl.textContent = `₹${inv.amount.toLocaleString('en-IN')}`;
      balEl.textContent = '₹0 (Settled)';
      balEl.style.color = '#059669';
    } else {
      paidEl.textContent = '₹0';
      balEl.textContent = `₹${inv.amount.toLocaleString('en-IN')} (Due)`;
      balEl.style.color = '#DC2626';
    }
  }

  // Injected Items
  const itemsTbody = document.getElementById('inv-modal-items-tbody');
  if (itemsTbody) {
    itemsTbody.innerHTML = inv.items.map(item => `
      <tr>
        <td style="font-weight: 500;">${item.desc}</td>
        <td style="font-family: var(--font-sans); font-variant-numeric: tabular-nums; font-size: 0.78rem; color: #64748B;">${item.hsn}</td>
        <td>${item.qty}</td>
        <td style="text-align: right;">₹${item.rate.toLocaleString('en-IN')}</td>
        <td style="text-align: right; font-weight: 600;">₹${item.amount.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('show'), 10);

  if (window.lucide) lucide.createIcons();
}

function bindFinancialEvents() {
  // Period filter switch
  const periodSelect = document.getElementById('fin-period-select');
  if (periodSelect) {
    periodSelect.onchange = (e) => {
      const val = e.target.value;
      updateFinancialPeriodData(val);
    };
  }

  // Granularity selector in Revenue Trends
  const granSelect = document.getElementById('fin-trends-granularity');
  if (granSelect) {
    granSelect.onchange = (e) => {
      const val = e.target.value;
      updateRevenueTrendsData(val);
    };
  }

  // Export Modal Triggers
  const btnExport = document.getElementById('btn-fin-export-trigger');
  const modalExport = document.getElementById('modal-export-financials');
  const btnCloseExport = document.getElementById('btn-close-export-modal');
  const backdropExport = document.getElementById('backdrop-export-financials');
  const btnRunExport = document.getElementById('btn-run-export');

  if (btnExport && modalExport) {
    btnExport.onclick = () => {
      modalExport.classList.remove('hidden');
      modalExport.style.display = 'flex';
      setTimeout(() => modalExport.classList.add('show'), 10);
    };
  }

  const closeExportModal = () => {
    if (modalExport) {
      modalExport.classList.remove('show');
      setTimeout(() => {
        modalExport.style.display = 'none';
        modalExport.classList.add('hidden');
      }, 300);
    }
  };

  if (btnCloseExport) btnCloseExport.onclick = closeExportModal;
  if (backdropExport) backdropExport.onclick = closeExportModal;

  if (btnRunExport) {
    btnRunExport.onclick = () => {
      const type = document.getElementById('export-report-type')?.value || 'Summary';
      const range = document.getElementById('export-date-range')?.value || 'Current Month';
      const format = document.querySelector('input[name="export-format"]:checked')?.value || 'pdf';
      
      btnRunExport.innerHTML = '<i data-lucide="loader-2" class="spin"></i> <span>Compiling Ledger...</span>';
      if (window.lucide) lucide.createIcons();

      setTimeout(() => {
        btnRunExport.innerHTML = '<i data-lucide="check"></i> <span>Report Downloaded!</span>';
        showToast(`📊 Financial Report (${type.toUpperCase()} • ${format.toUpperCase()}) exported successfully!`, 'success');
        setTimeout(() => {
          closeExportModal();
          btnRunExport.innerHTML = '<i data-lucide="download-cloud"></i> <span>Generate & Download Report</span>';
          if (window.lucide) lucide.createIcons();
        }, 800);
      }, 900);
    };
  }

  // Invoice Modal Close & Actions
  const modalInv = document.getElementById('modal-invoice-detail');
  const btnCloseInv = document.getElementById('btn-close-invoice-modal');
  const backdropInv = document.getElementById('backdrop-invoice-detail');
  const btnPrintInv = document.getElementById('btn-print-invoice');
  const btnDownloadInv = document.getElementById('btn-download-pdf-invoice');

  const closeInvModal = () => {
    if (modalInv) {
      modalInv.classList.remove('show');
      setTimeout(() => {
        modalInv.style.display = 'none';
        modalInv.classList.add('hidden');
      }, 300);
    }
  };

  if (btnCloseInv) btnCloseInv.onclick = closeInvModal;
  if (backdropInv) backdropInv.onclick = closeInvModal;

  if (btnPrintInv) {
    btnPrintInv.onclick = () => {
      window.print();
    };
  }

  if (btnDownloadInv) {
    btnDownloadInv.onclick = () => {
      const invId = document.getElementById('inv-modal-id')?.textContent || 'INV-00124';
      showToast(`📄 Downloading high-resolution PDF for Folio #${invId}...`, 'success');
    };
  }

  // View All Invoices trigger
  const btnViewAll = document.getElementById('btn-view-all-invoices');
  if (btnViewAll) {
    btnViewAll.onclick = () => {
      showToast('📋 Displaying all archived and active resort guest folios.', 'info');
    };
  }

  // New Invoice trigger
  const btnNewInv = document.getElementById('btn-fin-new-invoice-trigger');
  if (btnNewInv) {
    btnNewInv.onclick = () => {
      showToast('🧾 Opening Fast Guest Billing Folio Generator...', 'info');
      openInvoiceModal('INV-00124');
    };
  }
}

function updateFinancialPeriodData(period) {
  const statToday = document.getElementById('fin-stat-today');
  const statWeek = document.getElementById('fin-stat-week');
  const statMonth = document.getElementById('fin-stat-month');
  const statYear = document.getElementById('fin-stat-year');

  if (period === 'today') {
    if (statToday) statToday.textContent = '₹4,85,000';
    if (statWeek) statWeek.textContent = '₹4,85,000';
    if (statMonth) statMonth.textContent = '₹4,85,000';
    if (statYear) statYear.textContent = '₹8,45,00,000';
    showToast('📅 Financial metrics calibrated for Today.', 'info');
  } else if (period === 'week') {
    if (statToday) statToday.textContent = '₹4,85,000';
    if (statWeek) statWeek.textContent = '₹28,50,000';
    if (statMonth) statMonth.textContent = '₹28,50,000';
    if (statYear) statYear.textContent = '₹8,45,00,000';
    showToast('📅 Financial metrics calibrated for This Week.', 'info');
  } else if (period === 'quarter') {
    if (statToday) statToday.textContent = '₹4,85,000';
    if (statWeek) statWeek.textContent = '₹28,50,000';
    if (statMonth) statMonth.textContent = '₹3,45,00,000';
    if (statYear) statYear.textContent = '₹8,45,00,000';
    showToast('📅 Financial metrics calibrated for Q2 FY26-27.', 'info');
  } else if (period === 'year') {
    if (statToday) statToday.textContent = '₹4,85,000';
    if (statWeek) statWeek.textContent = '₹28,50,000';
    if (statMonth) statMonth.textContent = '₹1,12,00,000';
    if (statYear) statYear.textContent = '₹8,45,00,000';
    showToast('📅 Financial metrics calibrated for FY 2026-27.', 'info');
  } else {
    if (statToday) statToday.textContent = '₹4,85,000';
    if (statWeek) statWeek.textContent = '₹28,50,000';
    if (statMonth) statMonth.textContent = '₹1,12,00,000';
    if (statYear) statYear.textContent = '₹8,45,00,000';
    showToast('📅 Financial metrics calibrated for This Month.', 'info');
  }
}

function updateRevenueTrendsData(granularity) {
  if (!APP_STATE.charts.finance) return;
  const chart = APP_STATE.charts.finance;

  if (granularity === 'quarterly') {
    chart.data.labels = ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'];
    chart.data.datasets[0].data = [12.5, 14.8, 18.2, 21.5];
    chart.data.datasets[1].data = [7.8, 9.2, 11.4, 12.8];
  } else if (granularity === 'weekly') {
    chart.data.labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    chart.data.datasets[0].data = [24.5, 28.2, 29.8, 31.5];
    chart.data.datasets[1].data = [14.2, 16.0, 17.5, 18.2];
  } else {
    chart.data.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    chart.data.datasets[0].data = [2.8, 3.2, 4.0, 3.7, 4.6, 5.2, 4.8, 5.5, 6.2, 6.0, 6.7, 7.3];
    chart.data.datasets[1].data = [2.0, 2.3, 2.7, 2.4, 3.0, 3.4, 3.1, 3.7, 4.0, 3.8, 4.2, 4.7];
  }

  chart.update();
  showToast(`📊 Revenue trends chart adjusted to ${granularity.toUpperCase()} view.`, 'info');
}

// ==========================================
// 25. PREMIUM EVENTS & WEDDINGS SYSTEM
// ==========================================

const EVENTS_DATA = {
  'evt-1': {
    id: 'evt-1',
    title: 'Garden Wedding',
    category: 'wedding',
    venue: 'Grand Lawn',
    date: '15 Oct 2026',
    day: '15',
    month: 'OCT',
    year: '2026',
    time: 'All Day (10:00 AM - Midnight)',
    guests: '250 Guests',
    budget: '₹18,50,000',
    primaryImg: 'assets/img/ev-wedding.jpg',
    images: ['assets/img/ev-wedding.jpg', 'assets/img/ev-table.jpg', 'assets/img/ev-balloons.jpg', 'assets/img/hotel-night.jpg'],
    captions: ['Main Lawn', 'Table Decor', 'Celebration Setup', 'Evening Illumination'],
    desc: 'Elegant garden wedding celebration featuring a floral ceremony setup on the Grand Lawn, live music, and a lavish 7-course banquet for family and friends.',
    itinerary: [
      { time: '10:00 AM', title: 'Guest Arrival & Welcome', desc: 'Courtyard welcome with floral garlands and live music.' },
      { time: '01:00 PM', title: 'Wedding Lunch', desc: 'Curated regional spread at the Grand Ballroom for wedding parties.' },
      { time: '04:30 PM', title: 'Baraat Procession', desc: 'Festive procession across the grounds with live brass band.' },
      { time: '07:00 PM', title: 'Ceremony & Vows', desc: 'Vows exchange on the illuminated Grand Lawn.' },
      { time: '09:00 PM', title: 'Banquet & Musical Evening', desc: 'Gourmet banquet with live performances and fireworks.' }
    ]
  },
  'evt-2': {
    id: 'evt-2',
    title: 'TechCorp Annual Summit',
    category: 'corporate',
    venue: 'Grand Ballroom',
    date: '22 Oct 2026',
    day: '22',
    month: 'OCT',
    year: '2026',
    time: '10:00 AM - 6:00 PM',
    guests: '150 Guests',
    budget: '₹9,20,000',
    primaryImg: 'assets/img/ev-conference.jpg',
    images: ['assets/img/ev-conference.jpg', 'assets/img/ev-audience.jpg', 'assets/img/ev-dining.jpg', 'assets/img/ev-party.jpg'],
    captions: ['Main Hall Gathering', 'Keynote Stage', 'Buffet Banquet Lounge', 'Networking Terrace'],
    desc: 'High-level executive leadership conference combining state-of-the-art keynote technology inside the Grand Ballroom with breakout sessions on private terraces.',
    itinerary: [
      { time: '09:30 AM', title: 'Registration & Morning Coffee', desc: 'Welcome kits & specialty coffee reception at the Ballroom Foyer.' },
      { time: '10:30 AM', title: 'Keynote: Next Horizon', desc: 'Keynote address by Global CEO with 4K multi-projector setup.' },
      { time: '01:00 PM', title: 'Executive Lunch Buffet', desc: 'Gourmet international buffet on the Terrace.' },
      { time: '03:00 PM', title: 'Strategy Roundtables', desc: 'Interactive workshop pods across breakout rooms.' },
      { time: '05:30 PM', title: 'Cocktail Networking Hour', desc: 'Sunset mocktails and cocktails by the poolside pavilion.' }
    ]
  },
  'evt-3': {
    id: 'evt-3',
    title: 'Annual Gala Dinner',
    category: 'cultural',
    venue: 'Garden Courtyard',
    date: '28 Oct 2026',
    day: '28',
    month: 'OCT',
    year: '2026',
    time: '6:00 PM - 10:00 PM',
    guests: '300 Guests',
    budget: '₹6,40,000',
    primaryImg: 'assets/img/ev-ballroom.jpg',
    images: ['assets/img/ev-ballroom.jpg', 'assets/img/ev-party.jpg', 'assets/img/ev-table.jpg', 'assets/img/ev-dining.jpg'],
    captions: ['Main Stage', 'Live Performance', 'Ambient Lighting', 'Banquet Seating'],
    desc: 'An elegant evening of fine dining and live entertainment, featuring a live band, stage performances, and a multi-course gala dinner for staff, partners and VIP guests.',
    itinerary: [
      { time: '06:00 PM', title: 'Welcome Reception', desc: 'Champagne reception in the courtyard with ambient lighting.' },
      { time: '07:00 PM', title: 'Live Performances', desc: 'Stage performances with a live band and dance acts.' },
      { time: '08:30 PM', title: 'Gala Dinner', desc: 'Multi-course plated dinner with wine pairings.' },
      { time: '09:45 PM', title: 'Finale Showcase', desc: 'Closing showcase and awards under the stars.' }
    ]
  },
  'evt-4': {
    id: 'evt-4',
    title: 'Kapoor Sangeet & Fireworks',
    category: 'wedding',
    venue: 'Garden Grounds',
    date: '08 Sep 2026',
    day: '08',
    month: 'SEP',
    year: '2026',
    time: '7:00 PM - 2:00 AM',
    guests: '450 Guests',
    budget: '₹24,00,000',
    primaryImg: 'assets/img/pool-night.jpg',
    images: ['assets/img/pool-night.jpg', 'assets/img/ev-ballroom.jpg', 'assets/img/pool-night.jpg', 'assets/img/ev-party.jpg'],
    captions: ['Fireworks Display', 'Banquet Hall', 'Night Lighting', 'Live Music Stage'],
    desc: 'Extravagant sangeet evening featuring live music, a synchronized fireworks display over the grounds, and customized dessert bars.',
    itinerary: [
      { time: '07:30 PM', title: 'Red Carpet Entrance', desc: 'Guest arrivals along the red carpet with a welcome band.' },
      { time: '09:00 PM', title: 'Family Dance Performances', desc: 'Spectacular choreographed showcases on the hydraulic stage.' },
      { time: '11:00 PM', title: 'Grand Midnight Fireworks', desc: '15-minute synchronized aerial firework celebration.' },
      { time: '11:30 PM', title: 'Gourmet Midnight Feast', desc: 'Late night culinary stations and artisan cocktail lounge.' }
    ]
  },
  'evt-5': {
    id: 'evt-5',
    title: 'Global Leadership Forum & Banquet',
    category: 'corporate',
    venue: 'Poolside Terrace',
    date: '28 Aug 2026',
    day: '28',
    month: 'AUG',
    year: '2026',
    time: '5:00 PM - 10:30 PM',
    guests: '120 Guests',
    budget: '₹8,80,000',
    primaryImg: 'assets/img/pool-cabana.jpg',
    images: ['assets/img/pool-cabana.jpg', 'assets/img/ev-dining.jpg', 'assets/img/ev-table.jpg', 'assets/img/ev-party.jpg'],
    captions: ['Poolside Atmosphere', 'Executive Dinner Setup', 'Welcome Drinks', 'Terrace Reception'],
    desc: 'Prestigious global summit closing banquet hosted by the tranquil illuminated pool, complete with live jazz and private sommelier tastings.',
    itinerary: [
      { time: '05:00 PM', title: 'Sundowner Cocktail Hour', desc: 'Poolside cocktails and canapés with scenic sunset views.' },
      { time: '07:00 PM', title: 'Awards & Honors Ceremony', desc: 'Presentation of global leadership accolades.' },
      { time: '08:30 PM', title: 'Four-Course Plated Gala Dinner', desc: 'Chef-curated gourmet dinner with wine pairings.' }
    ]
  },
  'evt-6': {
    id: 'evt-6',
    title: 'Kapoor Pre-Wedding Shoot',
    category: 'photoshoot',
    venue: 'Rooftop Terrace',
    date: '12 Aug 2026',
    day: '12',
    month: 'AUG',
    year: '2026',
    time: '6:00 AM - 4:00 PM',
    guests: '18 Crew & Guests',
    budget: '₹3,50,000',
    primaryImg: 'assets/img/room-garden.jpg',
    images: ['assets/img/room-garden.jpg', 'assets/img/ev-table.jpg', 'assets/img/room-classic.jpg', 'assets/img/ev-party.jpg'],
    captions: ['Garden Entrance', 'Garden Lawn', 'Garden Balcony', 'Garden Courtyard'],
    desc: 'Cinematic destination pre-wedding photo and film production capturing sunrise light across rooftop terraces, floral courtyards and grand interiors.',
    itinerary: [
      { time: '06:00 AM', title: 'Golden Hour Rooftop Shoot', desc: 'Sunrise portrait session on the rooftop terrace.' },
      { time: '11:00 AM', title: 'Courtyard Session', desc: 'Portrait session against elegant architectural backdrops.' },
      { time: '03:00 PM', title: 'Balcony Sequence', desc: 'Romantic sequences overlooking the scenic surroundings.' }
    ]
  }
};

let eventSlideIntervals = {};
let eventsSystemInitialized = false;

function initEventsSystem() {
  if (eventsSystemInitialized) return;
  eventsSystemInitialized = true;

  setupEventImageCarousels();
  setupEventsFilters();
  setupEventsSearch();
  setupEventsModals();
}

// 1. Image Carousel & Sliding System (Thumbnail click + Smooth Auto-slide on Hover)
function setupEventImageCarousels() {
  const cards = document.querySelectorAll('.event-luxury-card');

  cards.forEach(card => {
    const cardId = card.getAttribute('data-id');
    const heroImg = card.querySelector('.event-main-hero-img');
    const thumbItems = card.querySelectorAll('.event-thumb-item');

    if (!heroImg || thumbItems.length === 0) return;

    // A. Thumbnail Click handler: smooth crossfade
    thumbItems.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetImgSrc = thumb.getAttribute('data-img');
        if (!targetImgSrc || heroImg.src.includes(targetImgSrc)) return;

        // Visual transition
        heroImg.style.opacity = '0.35';
        heroImg.style.transform = 'scale(0.98)';
        setTimeout(() => {
          heroImg.src = targetImgSrc;
          heroImg.style.opacity = '1';
          heroImg.style.transform = 'scale(1)';
        }, 150);

        // Active state
        thumbItems.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    // B. Smooth Auto-slide on Card Hover
    card.addEventListener('mouseenter', () => {
      if (thumbItems.length <= 1) return;
      let currentIndex = Array.from(thumbItems).findIndex(t => t.classList.contains('active'));
      if (currentIndex === -1) currentIndex = 0;

      clearInterval(eventSlideIntervals[cardId]);
      eventSlideIntervals[cardId] = setInterval(() => {
        currentIndex = (currentIndex + 1) % thumbItems.length;
        const nextThumb = thumbItems[currentIndex];
        if (!nextThumb) return;
        const nextSrc = nextThumb.getAttribute('data-img');

        heroImg.style.opacity = '0.4';
        setTimeout(() => {
          heroImg.src = nextSrc;
          heroImg.style.opacity = '1';
        }, 140);

        thumbItems.forEach(t => t.classList.remove('active'));
        nextThumb.classList.add('active');
      }, 2400);
    });

    card.addEventListener('mouseleave', () => {
      clearInterval(eventSlideIntervals[cardId]);
    });
  });
}

// 2. Events Category Filtering
function setupEventsFilters() {
  const pills = document.querySelectorAll('#events-filter-pills .btn-event-pill');
  if (!pills.length) return;

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.getAttribute('data-category');
      applyEventFilter(category);
    });
  });

  // Also bind Stat Cards to filters
  const statCards = document.querySelectorAll('.events-stats-grid .event-stat-card[data-filter]');
  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      const targetPill = document.querySelector(`#events-filter-pills .btn-event-pill[data-category="${filter}"]`);
      if (targetPill) {
        targetPill.click();
      }
    });
  });
}

function applyEventFilter(category) {
  const cards = document.querySelectorAll('.event-luxury-card');
  let visibleUpcoming = 0;

  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    const isUpcoming = card.closest('#upcoming-events-grid');

    if (category === 'all' || cardCat === category) {
      card.style.display = '';
      card.style.animation = 'fadeIn 0.3s ease-out';
      if (isUpcoming) visibleUpcoming++;
    } else {
      card.style.display = 'none';
    }
  });

  const countEl = document.getElementById('upcoming-events-count');
  if (countEl) {
    countEl.textContent = `${visibleUpcoming} Upcoming`;
  }
}

// 3. Live Events Search
function setupEventsSearch() {
  const searchInput = document.getElementById('event-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.event-luxury-card');
    let visibleUpcoming = 0;

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      const isUpcoming = card.closest('#upcoming-events-grid');

      if (!query || text.includes(query)) {
        card.style.display = '';
        if (isUpcoming) visibleUpcoming++;
      } else {
        card.style.display = 'none';
      }
    });

    const countEl = document.getElementById('upcoming-events-count');
    if (countEl) {
      countEl.textContent = `${visibleUpcoming} Found`;
    }
  });

  const btnViewAll = document.getElementById('btn-view-all-upcoming');
  if (btnViewAll) {
    btnViewAll.addEventListener('click', () => {
      showScreen('reservations');
      showToast('📅 Showing Reservations & Events Calendar View', 'info');
    });
  }
}

// 4. Modals (Event Details & Create Event)
function setupEventsModals() {
  // Create Event Button & Modal
  const btnOpenCreate = document.getElementById('btn-open-create-event');
  const modalCreate = document.getElementById('modal-create-event');
  const btnCloseCreate = document.getElementById('btn-close-create-event');
  const btnCancelCreate = document.getElementById('btn-cancel-create-event');
  const backdropCreate = document.getElementById('backdrop-create-event');
  const formCreate = document.getElementById('form-create-event');

  const openCreateModal = () => {
    if (modalCreate) {
      modalCreate.classList.remove('hidden');
      modalCreate.classList.add('active', 'fade-in');
    }
  };

  const closeCreateModal = () => {
    if (modalCreate) {
      modalCreate.classList.remove('active');
      modalCreate.classList.add('hidden');
    }
  };

  if (btnOpenCreate) btnOpenCreate.addEventListener('click', openCreateModal);
  if (btnCloseCreate) btnCloseCreate.addEventListener('click', closeCreateModal);
  if (btnCancelCreate) btnCancelCreate.addEventListener('click', closeCreateModal);
  if (backdropCreate) backdropCreate.addEventListener('click', closeCreateModal);

  // Form Submit Handler
  if (formCreate) {
    formCreate.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('ce-title').value.trim();
      const category = document.getElementById('ce-category').value;
      const venue = document.getElementById('ce-venue').value;
      const dateVal = document.getElementById('ce-date').value;
      const time = document.getElementById('ce-time').value.trim();
      const guests = document.getElementById('ce-guests').value;
      const budget = document.getElementById('ce-budget').value.trim();
      const organizer = document.getElementById('ce-organizer').value.trim();
      const notes = document.getElementById('ce-notes').value.trim();

      // Format Date
      const dObj = new Date(dateVal || Date.now());
      const day = String(dObj.getDate()).padStart(2, '0');
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const month = months[dObj.getMonth()];
      const year = dObj.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;

      const newId = `evt-${Date.now()}`;

      // Pick image based on category
      let heroImg = 'assets/img/ev-wedding.jpg';
      let thumbImgs = ['assets/img/ev-wedding.jpg', 'assets/img/ev-table.jpg', 'assets/img/ev-balloons.jpg', 'assets/img/hotel-night.jpg'];
      let badgeClass = 'wedding';
      let badgeIcon = 'crown';
      let badgeLabel = 'Wedding';

      if (category === 'corporate') {
        heroImg = 'assets/img/ev-conference.jpg';
        thumbImgs = ['assets/img/ev-conference.jpg', 'assets/img/ev-audience.jpg', 'assets/img/ev-dining.jpg', 'assets/img/ev-party.jpg'];
        badgeClass = 'corporate';
        badgeIcon = 'briefcase';
        badgeLabel = 'Corporate';
      } else if (category === 'cultural') {
        heroImg = 'assets/img/ev-ballroom.jpg';
        thumbImgs = ['assets/img/ev-ballroom.jpg', 'assets/img/ev-party.jpg', 'assets/img/ev-table.jpg', 'assets/img/ev-dining.jpg'];
        badgeClass = 'cultural';
        badgeIcon = 'music';
        badgeLabel = 'Cultural';
      } else if (category === 'photoshoot') {
        heroImg = 'assets/img/room-garden.jpg';
        thumbImgs = ['assets/img/room-garden.jpg', 'assets/img/ev-table.jpg', 'assets/img/room-classic.jpg', 'assets/img/ev-party.jpg'];
        badgeClass = 'photoshoot';
        badgeIcon = 'camera';
        badgeLabel = 'Photoshoot';
      } else {
        heroImg = 'assets/img/pool-night.jpg';
        thumbImgs = ['assets/img/pool-night.jpg', 'assets/img/ev-ballroom.jpg', 'assets/img/pool-night.jpg', 'assets/img/ev-party.jpg'];
        badgeClass = 'wedding';
        badgeIcon = 'sparkles';
        badgeLabel = 'Private Gala';
      }

      // Store in memory
      EVENTS_DATA[newId] = {
        id: newId,
        title: title,
        category: category,
        venue: venue,
        date: formattedDate,
        day: day,
        month: month,
        year: year,
        time: time,
        guests: `${guests} Guests`,
        budget: `₹${budget}`,
        primaryImg: heroImg,
        images: thumbImgs,
        captions: ['Main Setup', 'Decor & Lighting', 'Banquet Lounge', 'Evening Atmosphere'],
        desc: notes ? notes : `Exclusive bespoke celebration hosted at ${venue} for ${organizer} and ${guests} guests with warm, personalised hospitality.`,
        itinerary: [
          { time: '11:00 AM', title: 'Welcome Drinks', desc: 'Courtyard welcome with floral garlands and live music.' },
          { time: '01:30 PM', title: 'Lunch & High Tea', desc: 'Curated hospitality luncheon.' },
          { time: '06:30 PM', title: 'Main Grand Soirée', desc: 'Main celebration and dinner banquet at ' + venue }
        ]
      };

      // Create new card HTML and prepend to Upcoming Grid
      const upcomingGrid = document.getElementById('upcoming-events-grid');
      if (upcomingGrid) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'event-luxury-card featured';
        cardDiv.setAttribute('data-id', newId);
        cardDiv.setAttribute('data-category', category);
        cardDiv.style.animation = 'scaleIn 0.4s ease-out';

        cardDiv.innerHTML = `
          <div class="event-media-container" id="media-${newId}">
              <img src="${heroImg}" alt="${title}" class="event-main-hero-img" id="hero-img-${newId}">
              <div class="event-badge-category ${badgeClass}">
                  <i data-lucide="${badgeIcon}" style="width: 12px; height: 12px;"></i>
                  <span>${badgeLabel}</span>
              </div>
              <div class="event-badge-date-box">
                  <div class="event-date-day">${day}</div>
                  <div class="event-date-month">${month}</div>
                  <div class="event-date-year">${year}</div>
              </div>
          </div>
          <div class="event-card-body">
              <h3 class="event-card-title">${title}</h3>
              <div class="event-meta-row">
                  <span class="event-meta-item"><i data-lucide="map-pin"></i> ${venue}</span>
                  <span class="event-meta-item"><i data-lucide="users"></i> ${guests} Guests</span>
                  <span class="event-meta-item"><i data-lucide="clock"></i> ${time}</span>
              </div>
              <div class="event-thumbnails-strip" data-target="${newId}">
                  <div class="event-thumb-item active" data-img="${thumbImgs[0]}">
                      <img src="${thumbImgs[0]}" alt="Thumbnail 1">
                  </div>
                  <div class="event-thumb-item" data-img="${thumbImgs[1]}">
                      <img src="${thumbImgs[1]}" alt="Thumbnail 2">
                  </div>
                  <div class="event-thumb-item" data-img="${thumbImgs[2]}">
                      <img src="${thumbImgs[2]}" alt="Thumbnail 3">
                  </div>
                  <div class="event-thumb-item" data-img="${thumbImgs[3]}">
                      <img src="${thumbImgs[3]}" alt="Thumbnail 4">
                  </div>
                  <div class="event-thumb-more" onclick="openEventDetails('${newId}')">+6</div>
              </div>
              <div class="event-card-actions">
                  <button type="button" class="btn-event-details" onclick="openEventDetails('${newId}')">
                      <i data-lucide="eye" style="width: 14px; height: 14px; margin-right: 4px;"></i> View Details
                  </button>
                  <button type="button" class="btn-event-manage" onclick="manageEventSchedule('${newId}')">
                      <i data-lucide="calendar" style="width: 14px; height: 14px; margin-right: 4px;"></i> Manage
                  </button>
              </div>
          </div>
        `;

        upcomingGrid.prepend(cardDiv);
      }

      // Update stat counters
      const totalStat = document.getElementById('stat-events-total');
      if (totalStat) {
        const cur = parseInt(totalStat.textContent, 10) || 24;
        totalStat.textContent = cur + 1;
      }
      if (category === 'wedding') {
        const wedStat = document.getElementById('stat-events-weddings');
        if (wedStat) wedStat.textContent = (parseInt(wedStat.textContent, 10) || 8) + 1;
      } else if (category === 'corporate') {
        const corpStat = document.getElementById('stat-events-corporate');
        if (corpStat) corpStat.textContent = (parseInt(corpStat.textContent, 10) || 6) + 1;
      }

      const countEl = document.getElementById('upcoming-events-count');
      if (countEl) {
        const curUpcoming = document.querySelectorAll('#upcoming-events-grid .event-luxury-card').length;
        countEl.textContent = `${curUpcoming} Upcoming`;
      }

      // Close modal, reset form
      closeCreateModal();
      formCreate.reset();

      if (typeof lucide !== 'undefined') lucide.createIcons();
      setupEventImageCarousels();

      showToast(`🎉 Celebration "${title}" created at ${venue}!`, 'success');
    });
  }

  // Event Details Modal close triggers
  const btnCloseDetail = document.getElementById('btn-close-event-detail');
  const btnCancelDetail = document.getElementById('btn-cancel-event-detail');
  const backdropDetail = document.getElementById('backdrop-event-detail');

  if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeEventDetails);
  if (btnCancelDetail) btnCancelDetail.addEventListener('click', closeEventDetails);
  if (backdropDetail) backdropDetail.addEventListener('click', closeEventDetails);
}

// 5. Open and Close Event Details Modal
window.openEventDetails = function(eventId) {
  const modal = document.getElementById('modal-event-detail');
  if (!modal) return;

  const data = EVENTS_DATA[eventId] || EVENTS_DATA['evt-1'];
  if (!data) return;

  // Set Modal Data
  const titleEl = document.getElementById('modal-evt-title');
  const badgeEl = document.getElementById('modal-evt-badge');
  const heroImgEl = document.getElementById('modal-evt-hero-img');
  const venueEl = document.getElementById('modal-evt-venue');
  const dateEl = document.getElementById('modal-evt-date');
  const guestsEl = document.getElementById('modal-evt-guests');
  const budgetEl = document.getElementById('modal-evt-budget');
  const descEl = document.getElementById('modal-evt-desc');
  const itineraryEl = document.getElementById('modal-evt-itinerary');
  const thumbsContainer = document.getElementById('modal-evt-thumbs-container');

  if (titleEl) titleEl.textContent = data.title;
  if (badgeEl) {
    badgeEl.textContent = data.category.charAt(0).toUpperCase() + data.category.slice(1);
    badgeEl.className = `badge event-badge-category ${data.category}`;
  }
  if (heroImgEl) heroImgEl.src = data.primaryImg;
  if (venueEl) venueEl.textContent = data.venue;
  if (dateEl) dateEl.textContent = `${data.date} (${data.time})`;
  if (guestsEl) guestsEl.textContent = data.guests;
  if (budgetEl) budgetEl.textContent = data.budget;
  if (descEl) descEl.textContent = data.desc;

  // Render Itinerary Timeline
  if (itineraryEl && data.itinerary) {
    itineraryEl.innerHTML = data.itinerary.map(item => `
      <div style="display: flex; gap: 14px; align-items: flex-start; padding: 8px 12px; background: rgba(0,0,0,0.02); border-radius: 10px; border-left: 3px solid var(--accent);">
          <div style="min-width: 75px; font-weight: 700; font-size: 0.8rem; color: var(--accent);">${item.time}</div>
          <div>
              <div style="font-weight: 700; font-size: 0.86rem; color: #1D1D1F;">${item.title}</div>
              <div style="font-size: 0.78rem; color: #64748B; margin-top: 2px;">${item.desc}</div>
          </div>
      </div>
    `).join('');
  }

  // Render Gallery Thumbnails
  if (thumbsContainer && data.images) {
    thumbsContainer.innerHTML = data.images.map((imgSrc, idx) => `
      <img src="${imgSrc}" class="event-modal-thumb ${idx === 0 ? 'active' : ''}" alt="Gallery ${idx + 1}" data-src="${imgSrc}">
    `).join('');

    const modalThumbs = thumbsContainer.querySelectorAll('.event-modal-thumb');
    modalThumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const src = thumb.getAttribute('data-src');
        if (heroImgEl && src) {
          heroImgEl.style.opacity = '0.35';
          setTimeout(() => {
            heroImgEl.src = src;
            heroImgEl.style.opacity = '1';
          }, 150);
        }
        modalThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();

  modal.classList.remove('hidden');
  modal.classList.add('active', 'fade-in');
};

window.closeEventDetails = function() {
  const modal = document.getElementById('modal-event-detail');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
  }
};

window.manageEventSchedule = function(eventId) {
  const event = EVENTS_DATA[eventId];
  const name = event ? event.title : 'Selected Event';
  showToast(`📅 Event Management Folio & Schedule for "${name}" opened.`, 'info');
};

window.openEditEventModal = function() {
  window.closeEventDetails();
  const modalCreate = document.getElementById('modal-create-event');
  if (modalCreate) {
    modalCreate.classList.remove('hidden');
    modalCreate.classList.add('active', 'fade-in');
  }
  showToast('✏️ Loaded Event Configuration for Editing.', 'info');
};

// ==========================================
// 26. SETTINGS & PROFILE MANAGEMENT ENGINE
// ==========================================
function setupSettings() {
  const profileForm = document.getElementById('form-stg-profile');
  const btnChangeAvatar = document.getElementById('btn-stg-change-avatar');
  const btnAvatarBadge = document.getElementById('btn-stg-avatar-badge');
  const avatarDisplay = document.getElementById('stg-avatar-display');

  // Change avatar handler
  const handleAvatarChange = () => {
    const initials = prompt('Enter your new avatar initials (e.g. AM, RS, AK):', avatarDisplay ? avatarDisplay.textContent.trim() : 'VR');
    if (initials && initials.trim()) {
      const cleanInitials = initials.trim().substring(0, 3).toUpperCase();
      if (avatarDisplay) avatarDisplay.textContent = cleanInitials;
      const topAvatar = document.querySelector('.user-avatar, .header-avatar, .user-profile .avatar');
      if (topAvatar) topAvatar.textContent = cleanInitials;
      showToast(`👤 Avatar initials updated to "${cleanInitials}".`, 'success');
    }
  };

  if (btnChangeAvatar) btnChangeAvatar.addEventListener('click', handleAvatarChange);
  if (btnAvatarBadge) btnAvatarBadge.addEventListener('click', handleAvatarChange);

  // Profile Form Save
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fn = document.getElementById('stg-input-firstname')?.value || 'Aarav';
      const ln = document.getElementById('stg-input-lastname')?.value || 'Mehta';
      const role = document.getElementById('stg-input-role')?.value || 'General Manager';

      const userNameEl = document.querySelector('.user-name, .profile-name, .sidebar-user-name');
      if (userNameEl) userNameEl.textContent = `${fn} ${ln}`;
      
      const userRoleEl = document.querySelector('.user-role, .profile-role, .sidebar-user-role');
      if (userRoleEl) userRoleEl.textContent = role;

      showToast(`✨ Profile updated successfully for ${fn} ${ln} (${role}).`, 'success');
    });
  }

  // Notification Toggle Toast Feedback
  const toggles = [
    { id: 'stg-toggle-booking', label: 'New Booking Alerts' },
    { id: 'stg-toggle-housekeeping', label: 'Housekeeping Updates' },
    { id: 'stg-toggle-messages', label: 'Guest Messages' },
    { id: 'stg-toggle-financial', label: 'Daily Financial Summary' }
  ];

  toggles.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) {
      el.addEventListener('change', () => {
        const stateStr = el.checked ? 'ENABLED' : 'DISABLED';
        const type = el.checked ? 'success' : 'info';
        showToast(`🔔 ${item.label} ${stateStr}.`, type);
      });
    }
  });

  // Security: Change Password Modal Controls
  const btnOpenPass = document.getElementById('btn-open-change-pass');
  const modalPass = document.getElementById('modal-stg-change-password');
  const btnClosePass = document.getElementById('btn-close-stg-pass');
  const btnCancelPass = document.getElementById('btn-cancel-stg-pass');
  const backdropPass = document.getElementById('backdrop-stg-pass');
  const formPass = document.getElementById('form-stg-change-password');

  const openPassModal = () => {
    if (modalPass) {
      modalPass.classList.remove('hidden');
      modalPass.classList.add('active', 'fade-in');
    }
  };

  const closePassModal = () => {
    if (modalPass) {
      modalPass.classList.remove('active');
      modalPass.classList.add('hidden');
      if (formPass) formPass.reset();
    }
  };

  if (btnOpenPass) btnOpenPass.addEventListener('click', openPassModal);
  if (btnClosePass) btnClosePass.addEventListener('click', closePassModal);
  if (btnCancelPass) btnCancelPass.addEventListener('click', closePassModal);
  if (backdropPass) backdropPass.addEventListener('click', closePassModal);

  if (formPass) {
    formPass.addEventListener('submit', (e) => {
      e.preventDefault();
      const passCurrent = document.getElementById('stg-pass-current')?.value;
      const passNew = document.getElementById('stg-pass-new')?.value;
      const passConfirm = document.getElementById('stg-pass-confirm')?.value;

      if (!passCurrent) {
        showToast('⚠️ Please enter your current password.', 'warning');
        return;
      }
      if (!passNew || passNew.length < 6) {
        showToast('⚠️ New password must be at least 6 characters long.', 'warning');
        return;
      }
      if (passNew !== passConfirm) {
        showToast('⚠️ New password and confirmation do not match.', 'error');
        return;
      }

      showToast('🔒 Password changed successfully!', 'success');
      closePassModal();
    });
  }

  // Security: Two-Factor Authentication Modal Controls
  const btnOpen2FA = document.getElementById('btn-open-2fa');
  const modal2FA = document.getElementById('modal-stg-2fa');
  const btnClose2FA = document.getElementById('btn-close-stg-2fa');
  const btnCancel2FA = document.getElementById('btn-cancel-stg-2fa');
  const backdrop2FA = document.getElementById('backdrop-stg-2fa');
  const btnConfirm2FA = document.getElementById('btn-confirm-stg-2fa');

  const open2FAModal = () => {
    if (modal2FA) {
      modal2FA.classList.remove('hidden');
      modal2FA.classList.add('active', 'fade-in');
    }
  };

  const close2FAModal = () => {
    if (modal2FA) {
      modal2FA.classList.remove('active');
      modal2FA.classList.add('hidden');
      const otpInput = document.getElementById('stg-2fa-otp');
      if (otpInput) otpInput.value = '';
    }
  };

  if (btnOpen2FA) btnOpen2FA.addEventListener('click', open2FAModal);
  if (btnClose2FA) btnClose2FA.addEventListener('click', close2FAModal);
  if (btnCancel2FA) btnCancel2FA.addEventListener('click', close2FAModal);
  if (backdrop2FA) backdrop2FA.addEventListener('click', close2FAModal);

  if (btnConfirm2FA) {
    btnConfirm2FA.addEventListener('click', () => {
      const otpInput = document.getElementById('stg-2fa-otp');
      const otpVal = otpInput ? otpInput.value.trim() : '';

      if (!otpVal || otpVal.length < 6) {
        showToast('⚠️ Please enter a valid 6-digit verification code.', 'warning');
        return;
      }

      showToast('🛡️ Two-Factor Authentication enabled successfully!', 'success');
      close2FAModal();
    });
  }
}