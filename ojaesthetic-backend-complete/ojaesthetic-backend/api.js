/**
 * api.js
 * Frontend API client for Ojaesthetic
 * Include this script in ojaesthetic.html before closing </body>
 *
 * Usage: window.OjaAPI.artworks.getAll()
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  const BASE_URL = 'http://localhost:5000/api'; // Change to your deployed URL in production

  // ============================================================
  // TOKEN MANAGEMENT
  // ============================================================
  const Auth = {
    getToken:    ()    => localStorage.getItem('oja_token'),
    setToken:    (t)   => localStorage.setItem('oja_token', t),
    removeToken: ()    => localStorage.removeItem('oja_token'),
    getUser:     ()    => {
      const u = localStorage.getItem('oja_user');
      return u ? JSON.parse(u) : null;
    },
    setUser:     (u)   => localStorage.setItem('oja_user', JSON.stringify(u)),
    removeUser:  ()    => localStorage.removeItem('oja_user'),
    isLoggedIn:  ()    => !!localStorage.getItem('oja_token'),
    isAdmin:     ()    => {
      const u = Auth.getUser();
      return u && u.role === 'admin';
    },
  };

  // ============================================================
  // HTTP CLIENT
  // ============================================================
  async function request(endpoint, options = {}) {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (options.body instanceof FormData) delete headers['Content-Type'];

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({ success: false, message: 'Invalid response' }));

    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
  }

  // ============================================================
  // API MODULES
  // ============================================================

  /** AUTH */
  const authAPI = {
    signup: (name, email, password) =>
      request('/auth/signup', {
        method: 'POST',
        body:   JSON.stringify({ name, email, password }),
      }),

    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body:   JSON.stringify({ email, password }),
      });
      if (data.token) { Auth.setToken(data.token); Auth.setUser(data.user); }
      return data;
    },

    logout: () => {
      Auth.removeToken();
      Auth.removeUser();
      return Promise.resolve({ success: true });
    },

    getMe: () => request('/auth/me'),

    updateProfile: (fields) =>
      request('/auth/update-profile', { method: 'PATCH', body: JSON.stringify(fields) }),

    changePassword: (currentPassword, newPassword) =>
      request('/auth/change-password', {
        method: 'PATCH',
        body:   JSON.stringify({ currentPassword, newPassword }),
      }),
  };

  /** ARTWORKS */
  const artworksAPI = {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/artworks${qs ? '?' + qs : ''}`);
    },
    getOne:    (id)        => request(`/artworks/${id}`),
    download:  (id)        => window.open(`${BASE_URL}/artworks/${id}/download`, '_blank'),

    // Admin only
    create: (formData)   => request('/artworks', { method: 'POST', body: formData }),
    update: (id, data)   => request(`/artworks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id)         => request(`/artworks/${id}`, { method: 'DELETE' }),
  };

  /** ORDERS */
  const ordersAPI = {
    create: (formData) =>
      // formData can be FormData (with files) or plain object
      formData instanceof FormData
        ? request('/orders', { method: 'POST', body: formData })
        : request('/orders', { method: 'POST', body: JSON.stringify(formData) }),

    getMyOrders: ()    => request('/orders/my'),
    getOne:      (id)  => request(`/orders/${id}`),

    // Admin only
    getAll:       (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/orders${qs ? '?' + qs : ''}`);
    },
    updateStatus: (id, status, extra = {}) =>
      request(`/orders/${id}/status`, {
        method: 'PATCH',
        body:   JSON.stringify({ status, ...extra }),
      }),
    delete: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  };

  /** FAVORITES */
  const favoritesAPI = {
    get:    ()         => request('/favorites'),
    add:    (artworkId) => request('/favorites/add',    { method: 'POST', body: JSON.stringify({ artworkId }) }),
    remove: (artworkId) => request('/favorites/remove', { method: 'POST', body: JSON.stringify({ artworkId }) }),
  };

  /** REVIEWS */
  const reviewsAPI = {
    getApproved: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reviews${qs ? '?' + qs : ''}`);
    },
    submit: (text, rating, artworkId) =>
      request('/reviews', {
        method: 'POST',
        body:   JSON.stringify({ text, rating, artworkId }),
      }),
    // Admin
    getAll:   ()                         => request('/reviews/all'),
    approve:  (id, isApproved, isHighlighted) =>
      request(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify({ isApproved, isHighlighted }) }),
    delete:   (id)                       => request(`/reviews/${id}`, { method: 'DELETE' }),
  };

  /** NEWSLETTER */
  const newsletterAPI = {
    subscribe:   (email)  => request('/newsletter/subscribe',   { method: 'POST', body: JSON.stringify({ email }) }),
    unsubscribe: (email)  => request('/newsletter/unsubscribe', { method: 'POST', body: JSON.stringify({ email }) }),
  };

  /** UPLOAD */
  const uploadAPI = {
    avatar: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return request('/upload/avatar', { method: 'POST', body: fd });
    },
    references: (files) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('images', f));
      return request('/upload/references', { method: 'POST', body: fd });
    },
  };

  /** ADMIN */
  const adminAPI = {
    dashboard:         ()    => request('/admin/dashboard'),
    getUsers:          ()    => request('/admin/users'),
    toggleUser:        (id)  => request(`/admin/users/${id}/toggle`, { method: 'PATCH' }),
    moderateReview:    (id, isApproved, isHighlighted) =>
      request(`/admin/reviews/${id}/moderate`, {
        method: 'PATCH',
        body:   JSON.stringify({ isApproved, isHighlighted }),
      }),
    exportSubscribers: ()    => window.open(`${BASE_URL}/admin/newsletter/export`, '_blank'),
  };

  // ============================================================
  // UI HELPERS — wire up common frontend actions
  // ============================================================
  const UI = {
    /** Show a toast notification */
    toast: (message, type = 'success') => {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position:fixed; bottom:2rem; right:2rem; z-index:99999;
        padding:.85rem 1.6rem; border-radius:50px;
        background:${type === 'success' ? '#3FA7A3' : '#e05d5d'};
        color:white; font-family:'DM Sans',sans-serif; font-size:.88rem;
        box-shadow:0 8px 32px rgba(0,0,0,.18);
        animation: toastIn .3s ease;
      `;
      toast.textContent = message;
      const style = document.createElement('style');
      style.textContent = '@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}';
      document.head.appendChild(style);
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 3500);
    },

    /** Update auth UI elements based on login state */
    refreshAuthUI: () => {
      const user = Auth.getUser();
      const loggedIn = Auth.isLoggedIn();
      // Toggle elements with data-auth="true" / data-auth="false"
      document.querySelectorAll('[data-auth]').forEach((el) => {
        const show = el.dataset.auth === 'true' ? loggedIn : !loggedIn;
        el.style.display = show ? '' : 'none';
      });
      if (user) {
        document.querySelectorAll('[data-user-name]').forEach((el) => (el.textContent = user.name));
      }
    },
  };

  // ============================================================
  // WIRE ORDER FORM to backend
  // ============================================================
  async function handleOrderSubmit() {
    if (!Auth.isLoggedIn()) {
      UI.toast('Please log in to place an order 🦋', 'error');
      return;
    }

    const name        = document.getElementById('formName')?.value?.trim();
    const email       = document.getElementById('formEmail')?.value?.trim();
    const artworkType = document.getElementById('formArtType')?.value;
    const message     = document.getElementById('formMessage')?.value?.trim();

    if (!name || !email || !artworkType || !message) {
      UI.toast('Please fill in all fields 🌸', 'error');
      return;
    }

    try {
      const data = await ordersAPI.create({ name, email, artworkType, message });
      UI.toast(data.message || 'Order sent! 🌸');
      ['formName', 'formEmail', 'formMessage'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const sel = document.getElementById('formArtType');
      if (sel) sel.value = '';
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  // ============================================================
  // WIRE NEWSLETTER FORM to backend
  // ============================================================
  async function handleNewsletterSubscribe(email) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      UI.toast('Please enter a valid email 🌿', 'error');
      return;
    }
    try {
      const data = await newsletterAPI.subscribe(email);
      UI.toast(data.message || 'Subscribed! Welcome 🌸');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  // ============================================================
  // WIRE FAVORITES to backend (override localStorage version)
  // ============================================================
  async function toggleFavoriteBackend(artworkId, btn) {
    if (!Auth.isLoggedIn()) {
      UI.toast('Log in to save favorites ❤️', 'error');
      return;
    }
    try {
      const user    = Auth.getUser();
      const isSaved = btn.classList.contains('liked');

      if (isSaved) {
        await favoritesAPI.remove(artworkId);
        btn.classList.remove('liked');
        btn.textContent = '🤍';
        UI.toast('Removed from favorites');
      } else {
        await favoritesAPI.add(artworkId);
        btn.classList.add('liked');
        btn.textContent = '❤️';
        UI.toast('Saved to favorites ❤️');
      }
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  // ============================================================
  // AUTO-LOAD reviews from backend on page load
  // ============================================================
  async function loadReviews() {
    try {
      const data = await reviewsAPI.getApproved({ highlighted: 'true' });
      const grid = document.querySelector('.reviews-grid');
      if (!grid || !data.reviews.length) return;

      grid.innerHTML = '';
      data.reviews.forEach((rev) => {
        const card = document.createElement('div');
        card.className = 'review-card reveal';
        card.innerHTML = `
          <div class="stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
          <p>"${rev.text}"</p>
          <div class="reviewer">
            <div class="reviewer-avatar">${rev.userId?.name?.[0] || '🌸'}</div>
            <div class="reviewer-name">${rev.userId?.name || 'Happy Client'}</div>
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (_) {
      // Keep static reviews if API not reachable
    }
  }

  // ============================================================
  // INIT on DOM ready
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    UI.refreshAuthUI();

    // Order form submit button
    const orderBtn = document.querySelector('.btn-submit');
    if (orderBtn) {
      orderBtn.onclick = handleOrderSubmit;
    }

    // Newsletter subscribe button
    const subBtn = document.querySelector('.btn-subscribe');
    if (subBtn) {
      subBtn.onclick = () => {
        const emailInput = document.querySelector('.newsletter-input');
        if (emailInput) handleNewsletterSubscribe(emailInput.value.trim());
      };
    }

    // Load live reviews
    loadReviews();
  });

  // ============================================================
  // EXPOSE globally
  // ============================================================
  window.OjaAPI = {
    auth:       authAPI,
    artworks:   artworksAPI,
    orders:     ordersAPI,
    favorites:  favoritesAPI,
    reviews:    reviewsAPI,
    newsletter: newsletterAPI,
    upload:     uploadAPI,
    admin:      adminAPI,
    Auth,
    UI,
    toggleFavoriteBackend,
    handleOrderSubmit,
    handleNewsletterSubscribe,
  };

  console.log('🦋 OjaAPI loaded. Use window.OjaAPI to interact with the backend.');
})();
