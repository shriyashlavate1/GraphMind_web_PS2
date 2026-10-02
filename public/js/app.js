/**
 * CivicPulse - Pixel-Perfect UI Logic
 * Pure Plain JavaScript (Zero external UI libraries)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Apply initial theme
  state.applyTheme();

  // Check backend server config
  const config = await API.getConfig();
  console.log('[CivicPulse] Initialized with backend engine:', config.engineName);

  // Set default active channel to 'internships' to match the mockup
  state.selectedCategory = 'EDUCATION';
  state.selectedChannel = 'internships';
  state.activeView = 'FEED';

  // Initialize UI Events
  initHeaderEvents();
  renderAll();

  // Reactive state listener
  state.subscribe(() => {
    renderAll();
  });
});

function renderAll() {
  renderHeader();
  renderLeftSidebar();
  renderCenterArea();
}

// 1. Header Events & Rendering
function initHeaderEvents() {
  document.getElementById('btn-brand-home').addEventListener('click', () => {
    state.setView('HOME');
  });

  document.getElementById('nav-home').addEventListener('click', () => {
    state.setView('HOME');
  });
  document.getElementById('nav-feed').addEventListener('click', () => {
    state.setView('FEED');
  });
  document.getElementById('nav-mod').addEventListener('click', () => {
    state.setView('MODERATION');
  });

  document.getElementById('btn-toggle-theme').addEventListener('click', () => {
    state.toggleTheme();
  });

  document.getElementById('btn-toggle-role').addEventListener('click', () => {
    state.toggleUserRole();
  });

  document.getElementById('btn-open-create').addEventListener('click', () => {
    openCreateModal();
  });

  const searchInput = document.getElementById('global-search-input');
  searchInput.addEventListener('input', (e) => {
    state.setFilter('search', e.target.value);
    if (state.activeView !== 'FEED') {
      state.setView('FEED');
    }
  });

  // ⌘ K or Ctrl+K shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

function renderHeader() {
  document.getElementById('header-user-name').textContent = state.currentUser.name;
  document.getElementById('header-user-role').textContent = state.currentUser.role;
  document.getElementById('header-avatar-img').src = state.currentUser.avatar;
  document.getElementById('btn-toggle-theme').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

// 2. Left Sidebar
function renderLeftSidebar() {
  // Top nav active states
  document.getElementById('nav-home').classList.toggle('active', state.activeView === 'HOME');
  document.getElementById('nav-feed').classList.toggle('active', state.activeView === 'FEED' && state.selectedChannel === 'ALL');
  document.getElementById('nav-mod').classList.toggle('active', state.activeView === 'MODERATION');

  const container = document.getElementById('sidebar-categories-container');
  if (!container) return;

  let html = '';

  state.categories.forEach((cat) => {
    html += `
      <div class="sidebar-category-block">
        <div class="category-heading">
          <span class="category-icon">${cat.icon}</span>
          <span>${cat.name}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
    `;

    cat.channels.forEach((ch) => {
      const isActive = state.activeView === 'FEED' && state.selectedChannel === ch.id;
      html += `
        <div class="channel-link-item ${isActive ? 'active' : ''}" onclick="state.selectChannel('${cat.id}', '${ch.id}')">
          <span class="channel-hash">#</span>
          <span>#${ch.name}</span>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  container.innerHTML = html;
}

// 3. Center Area
function renderCenterArea() {
  const container = document.getElementById('center-main-area');
  if (!container) return;

  if (state.activeView === 'HOME') {
    renderHomeView(container);
  } else if (state.activeView === 'MODERATION') {
    renderModerationView(container);
  } else {
    renderFeedView(container);
  }
}

// 3A. Center Feed View (Matching UI Mockup)
function renderFeedView(container) {
  const currentCat = state.categories.find((c) => c.id === state.selectedCategory);
  const currentCh = currentCat?.channels.find((ch) => ch.id === state.selectedChannel);

  const channelTitle = currentCh ? `# ${capitalize(currentCh.name)}` : '# All Information';
  const channelDesc = currentCh?.description || 'Community updates, local notices, and civic alerts across all categories.';

  const filtered = state.getFilteredPosts();

  container.innerHTML = `
    <!-- Feed Header Section -->
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${channelTitle}</h1>
        <p class="feed-desc-line">${channelDesc}</p>
      </div>

      <!-- Filter Row: Status Pills + Dropdowns -->
      <div class="feed-filter-row">
        <!-- Status Pills -->
        <div class="status-pills-group">
          <button class="filter-pill ${state.filters.status === 'ALL' ? 'active' : ''}" onclick="state.setFilter('status', 'ALL')">All</button>
          <button class="filter-pill ${state.filters.status === 'Active' ? 'active' : ''}" onclick="state.setFilter('status', 'Active')">Active</button>
          <button class="filter-pill ${state.filters.status === 'Pending' ? 'active' : ''}" onclick="state.setFilter('status', 'Pending')">Pending</button>
          <button class="filter-pill ${state.filters.status === 'Resolved' ? 'active' : ''}" onclick="state.setFilter('status', 'Resolved')">Resolved</button>
          <button class="filter-pill ${state.filters.status === 'Expired' ? 'active' : ''}" onclick="state.setFilter('status', 'Expired')">Expired</button>
        </div>

        <!-- Dropdowns -->
        <div class="dropdown-filters-group">
          <select class="filter-select-pill" id="filter-location-select">
            <option value="">Location ∨</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Andheri">Andheri</option>
            <option value="BKC">BKC</option>
          </select>

          <select class="filter-select-pill" id="filter-date-select">
            <option value="">Date ∨</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select class="filter-select-pill" id="filter-sort-select">
            <option value="relevance" ${state.filters.sortBy === 'relevance' ? 'selected' : ''}>Most Relevant ∨</option>
            <option value="newest" ${state.filters.sortBy === 'newest' ? 'selected' : ''}>Newest ∨</option>
            <option value="expiring" ${state.filters.sortBy === 'expiring' ? 'selected' : ''}>Expiring Soon ∨</option>
            <option value="discussed" ${state.filters.sortBy === 'discussed' ? 'selected' : ''}>Most Discussed ∨</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Scrollable Cards Feed -->
    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        ${
          filtered.length > 0
            ? filtered.map((post) => renderPostCardHtml(post)).join('')
            : `
              <div style="text-align:center;padding:48px 20px;color:var(--text-muted);background:var(--bg-sidebar);border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                <div style="font-size:32px;margin-bottom:8px;">📥</div>
                <h3 style="font-size:15px;font-weight:700;color:var(--text-main);">No matching information</h3>
                <p style="font-size:12px;margin:4px 0 14px 0;">Try adjusting your filters or search keywords.</p>
                <button class="filter-pill active" onclick="state.resetFilters()">Clear Filters</button>
              </div>
            `
        }
      </div>
    </div>
  `;

  // Attach dropdown change listeners
  document.getElementById('filter-sort-select')?.addEventListener('change', (e) => {
    state.setFilter('sortBy', e.target.value);
  });
}

// 4. Render Single Post Card (Exact Match to Screenshot)
function renderPostCardHtml(post) {
  const authorInitial = post.author.initial || post.author.name.charAt(0).toUpperCase();
  const avatarColor = post.author.color || 'purple';
  const statusClass = (post.status || 'Active').toLowerCase();

  const formattedDate = post.formattedDate || new Date(post.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ', ' + new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const categoryPath = post.categoryPath || `${post.categoryId} > ${post.channelName}`;

  // Image box on the right
  const hasImage = post.images && post.images.length > 0;

  return `
    <article class="post-card">
      <!-- Left Content -->
      <div class="card-left-content">
        <!-- Top Row: Author Avatar + Name + Date + Status + Menu -->
        <div class="card-header-row">
          <div class="author-meta-block">
            <div class="author-circle-avatar ${avatarColor}">${authorInitial}</div>
            <span class="author-name-text">${post.author.name}</span>
            <span class="post-time-text">${formattedDate}</span>
          </div>

          <div class="card-header-actions">
            <span class="status-pill-badge ${statusClass}">${post.status}</span>
            <button class="dots-menu-btn" onclick="openReportModal('${post.id}')" title="More options / Report">•••</button>
          </div>
        </div>

        <!-- Title -->
        <h2 class="card-main-title" onclick="openDetailModal('${post.id}')">${post.title}</h2>

        <!-- Location & Category Row -->
        <div class="card-sub-info-row">
          ${post.location ? `<span class="location-tag">📍 ${post.location}</span>` : ''}
          <span class="category-breadcrumb-pill">🎓 ${categoryPath}</span>
        </div>

        <!-- Description -->
        <p class="card-description-paragraph">${post.description}</p>

        <!-- Deadline / Resolution Badge & Tags Row -->
        <div class="card-badges-row">
          ${
            post.deadlineLabel
              ? `<span class="deadline-pill-tag">📅 ${post.deadlineLabel}</span>`
              : post.resolutionLabel
              ? `<span class="expected-resolution-pill">⏰ ${post.resolutionLabel}</span>`
              : post.deadline
              ? `<span class="deadline-pill-tag">📅 Deadline: ${new Date(post.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>`
              : ''
          }

          ${
            post.tags && post.tags.length > 0
              ? post.tags.map((t) => `<span class="hashtag-pill">#${t}</span>`).join('')
              : ''
          }
        </div>

        <!-- Footer: Votes & View Details -->
        <div class="card-footer-row">
          <div class="votes-comments-group">
            <button class="vote-action-btn ${post.validation.userVote === 'useful' ? 'active-up' : ''}" onclick="state.validatePost('${post.id}', 'useful')">
              <span>👍</span>
              <span>${post.validation.useful}</span>
            </button>
            <button class="vote-action-btn ${post.validation.userVote === 'incorrect' ? 'active-down' : ''}" onclick="state.validatePost('${post.id}', 'incorrect')">
              <span>👎</span>
              <span>${post.validation.incorrect}</span>
            </button>
            <button class="comments-count-btn" onclick="openDetailModal('${post.id}')">
              <span>💬</span>
              <span>${post.comments.length} Comments</span>
            </button>
          </div>

          <button class="btn-view-details" onclick="openDetailModal('${post.id}')">
            <span>View Details</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <!-- Right Image Thumbnail -->
      ${
        hasImage
          ? `
            <div class="card-right-image-box" onclick="openLightbox('${post.images[0]}')">
              <img src="${post.images[0]}" alt="${post.title}" class="card-thumb-img">
            </div>
          `
          : ''
      }
    </article>
  `;
}

// 3B. Home View
function renderHomeView(container) {
  const activePosts = state.posts.filter((p) => p.status === 'Active').slice(0, 2);
  const resolvedPosts = state.posts.filter((p) => p.status === 'Resolved').slice(0, 2);

  container.innerHTML = `
    <div class="feed-header-section">
      <h1 class="feed-title-line">🏠 Community Home</h1>
      <p class="feed-desc-line">Welcome back, ${state.currentUser.name}. Stay informed with verified neighborhood notices.</p>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        <h3 style="font-size:14px;font-weight:700;color:var(--text-main);margin-bottom:4px;">🌟 Active Opportunities & Alerts</h3>
        ${activePosts.map((p) => renderPostCardHtml(p)).join('')}

        <h3 style="font-size:14px;font-weight:700;color:var(--text-main);margin:16px 0 4px 0;">✅ Recently Resolved</h3>
        ${resolvedPosts.map((p) => renderPostCardHtml(p)).join('')}
      </div>
    </div>
  `;
}

// 3C. Moderation View
function renderModerationView(container) {
  const reported = state.posts.filter((p) => p.status === 'UNDER_REVIEW' || (p.reports && p.reports.length > 0));

  container.innerHTML = `
    <div class="feed-header-section">
      <h1 class="feed-title-line">🛡️ Moderation Desk</h1>
      <p class="feed-desc-line">Audit reported notices, scam flags, and verify resolutions.</p>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        ${
          reported.length > 0
            ? reported
                .map(
                  (p) => `
                <div class="post-card" style="border-left:4px solid #dc2626;">
                  <div class="card-left-content">
                    <div style="font-size:12px;font-weight:700;color:#dc2626;">🚩 Flagged by Community (${p.reports.length} Reports)</div>
                    <h2 class="card-main-title">${p.title}</h2>
                    <p class="card-description-paragraph">${p.description}</p>
                    <div style="display:flex;gap:8px;margin-top:8px;">
                      <button class="filter-pill active" onclick="state.moderatorApprove('${p.id}')">Approve Notice</button>
                      <button class="filter-pill" style="color:#dc2626;" onclick="if(confirm('Remove this post?')) state.moderatorRemove('${p.id}')">Remove Post</button>
                    </div>
                  </div>
                </div>
              `
                )
                .join('')
            : `<div style="text-align:center;padding:40px;color:var(--text-muted);">✅ Moderation queue is clean.</div>`
        }
      </div>
    </div>
  `;
}

// ==========================================================================
// Interactive Modals
// ==========================================================================

// Create Modal with Real-time AI Assistant
function openCreateModal() {
  const root = document.getElementById('modals-root');
  let selectedTags = [];
  let uploadedImage = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80';

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:680px;">
        <div class="modal-header">
          <div class="modal-title">+ Share Community Information</div>
          <button class="dots-menu-btn" onclick="closeModals()">✕</button>
        </div>

        <form id="create-post-form" class="modal-body">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="inp-title" required placeholder="e.g. Summer Software Engineering Internship (React / Node.js)">
          </div>

          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="inp-desc" rows="3" required placeholder="Provide accurate details, eligibility criteria, or problem symptoms..."></textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="inp-category">
                ${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Channel</label>
              <select class="form-select" id="inp-channel">
                <!-- Channels populated dynamically -->
              </select>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
              <label class="form-label">Location</label>
              <input type="text" class="form-input" id="inp-location" placeholder="e.g. BKC, Mumbai">
            </div>
            <div class="form-group">
              <label class="form-label">Deadline / Date (optional)</label>
              <input type="text" class="form-input" id="inp-deadline" placeholder="e.g. 5 Oct 2026">
            </div>
          </div>

          <!-- Live AI Assistant Box -->
          <div style="background:var(--bg-active-pill);padding:12px;border-radius:var(--radius-md);border:1px solid rgba(2, 132, 199, 0.2);display:flex;flex-direction:column;gap:6px;">
            <div style="font-size:12px;font-weight:700;color:var(--primary-blue);">✨ AI Classification & Moderation Check</div>
            <div id="ai-live-output" style="font-size:12px;color:var(--text-secondary);">
              Type your title and description above to see real-time AI suggestions and safety audits.
            </div>
          </div>

          <div class="modal-footer" style="padding:0;border:none;background:none;margin-top:8px;">
            <button type="button" class="filter-pill" onclick="closeModals()">Cancel</button>
            <button type="submit" class="btn-share-info">Publish Notice</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const catSel = document.getElementById('inp-category');
  const chSel = document.getElementById('inp-channel');

  const updateChOptions = () => {
    const cat = state.categories.find((c) => c.id === catSel.value);
    if (cat) {
      chSel.innerHTML = cat.channels.map((ch) => `<option value="${ch.id}">#${ch.name}</option>`).join('');
    }
  };
  catSel.addEventListener('change', updateChOptions);
  updateChOptions();

  // AI Typing Listener
  const titleInp = document.getElementById('inp-title');
  const descInp = document.getElementById('inp-desc');
  const aiOutput = document.getElementById('ai-live-output');

  let timer;
  const runAi = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const t = titleInp.value.trim();
      const d = descInp.value.trim();
      if (!t && !d) return;

      const classification = await API.classifyContent(t, d);
      const safety = await API.moderateContent(t, d);

      aiOutput.innerHTML = `
        <div><strong>Suggested Channel:</strong> ${classification.categoryName} > #${classification.channelName}</div>
        <div style="color:${safety.score === 'SAFE' ? '#16a34a' : '#d97706'};font-weight:600;">
          ${safety.score === 'SAFE' ? '🟢 Safe to Publish' : '🟡 Requires Review'}: ${safety.reasons.join(', ')}
        </div>
      `;

      catSel.value = classification.categoryId;
      updateChOptions();
      chSel.value = classification.channelId;
    }, 350);
  };

  titleInp.addEventListener('input', runAi);
  descInp.addEventListener('input', runAi);

  // Form Submit
  document.getElementById('create-post-form').onsubmit = (e) => {
    e.preventDefault();
    const title = titleInp.value.trim();
    const desc = descInp.value.trim();
    const category = catSel.value;
    const channel = chSel.value;
    const location = document.getElementById('inp-location').value.trim() || 'Mumbai';
    const deadlineText = document.getElementById('inp-deadline').value.trim();

    const created = state.createPost({
      title,
      description: desc,
      categoryId: category,
      channelId: channel,
      location,
      deadlineLabel: deadlineText ? `Deadline: ${deadlineText}` : undefined,
      categoryPath: `${category} > ${channel}`,
      status: 'Active',
      images: [uploadedImage],
    });

    closeModals();
    state.selectChannel(category, channel);
  };
}

// Post Detail Modal
function openDetailModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const root = document.getElementById('modals-root');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:650px;">
        <div class="modal-header">
          <div class="card-sub-info-row">
            <span class="category-breadcrumb-pill">🎓 ${post.categoryPath || post.channelName}</span>
            <span class="status-pill-badge ${(post.status || 'active').toLowerCase()}">${post.status}</span>
          </div>
          <button class="dots-menu-btn" onclick="closeModals()">✕</button>
        </div>

        <div class="modal-body">
          <h2 class="card-main-title" style="font-size:18px;">${post.title}</h2>

          <div class="author-meta-block">
            <div class="author-circle-avatar ${post.author.color || 'purple'}">${post.author.initial || 'A'}</div>
            <span class="author-name-text">${post.author.name}</span>
            <span class="post-time-text">${post.formattedDate || 'Recently'}</span>
          </div>

          <p class="card-description-paragraph" style="font-size:14px;line-height:1.6;">${post.description}</p>

          ${
            post.images && post.images.length > 0
              ? `<div><img src="${post.images[0]}" style="width:100%;max-height:240px;object-fit:cover;border-radius:var(--radius-lg);cursor:pointer;" onclick="openLightbox('${post.images[0]}')"></div>`
              : ''
          }

          <!-- Comments Section -->
          <div style="border-top:1px solid var(--border-color);padding-top:12px;margin-top:6px;">
            <h4 style="font-size:13px;font-weight:700;margin-bottom:8px;">Community Comments (${post.comments.length})</h4>

            <form id="comment-form" style="display:flex;gap:6px;margin-bottom:12px;">
              <input type="text" class="form-input" id="inp-comment" placeholder="Write a comment..." style="flex:1;" required>
              <button type="submit" class="btn-share-info" style="padding:6px 12px;font-size:12px;">Post</button>
            </form>

            <div style="display:flex;flex-direction:column;gap:8px;">
              ${post.comments
                .map(
                  (c) => `
                <div style="background:var(--bg-sidebar);padding:8px 12px;border-radius:var(--radius-md);font-size:12px;">
                  <div style="display:flex;justify-content:space-between;color:var(--text-muted);font-size:11px;">
                    <strong>${c.authorName}</strong>
                    <span>${new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style="margin-top:2px;">${c.content}</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="filter-pill" onclick="openResolveModal('${post.id}')">✓ Mark Resolved</button>
          <button class="filter-pill" onclick="openReportModal('${post.id}')">🚩 Report</button>
          <button class="filter-pill active" onclick="closeModals()">Close</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('comment-form').onsubmit = (e) => {
    e.preventDefault();
    const inp = document.getElementById('inp-comment');
    if (inp.value.trim()) {
      state.addComment(post.id, inp.value.trim());
      openDetailModal(post.id);
    }
  };
}

// Resolve Modal
function openResolveModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const root = document.getElementById('modals-root');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:440px;">
        <div class="modal-header">
          <div class="modal-title">✓ Mark Problem as Resolved</div>
          <button class="dots-menu-btn" onclick="closeModals()">✕</button>
        </div>
        <form id="resolve-form" class="modal-body">
          <div style="font-size:12px;color:var(--text-muted);">Resolving: <strong>${post.title}</strong></div>
          <div class="form-group">
            <label class="form-label">Resolution Note *</label>
            <textarea class="form-textarea" id="inp-resolve-note" rows="3" required placeholder="e.g. Road reopened, or position filled..."></textarea>
          </div>
          <div class="modal-footer" style="padding:0;border:none;background:none;margin-top:6px;">
            <button type="button" class="filter-pill" onclick="closeModals()">Cancel</button>
            <button type="submit" class="btn-share-info" style="background:#16a34a;">Confirm Resolution</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('resolve-form').onsubmit = (e) => {
    e.preventDefault();
    const note = document.getElementById('inp-resolve-note').value.trim();
    state.resolvePost(postId, note);
    closeModals();
  };
}

// Report Modal
function openReportModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const root = document.getElementById('modals-root');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:440px;">
        <div class="modal-header">
          <div class="modal-title">🚩 Report Notice</div>
          <button class="dots-menu-btn" onclick="closeModals()">✕</button>
        </div>
        <form id="report-form" class="modal-body">
          <div style="font-size:12px;color:var(--text-muted);">Reporting: <strong>${post.title}</strong></div>
          <div class="form-group">
            <label class="form-label">Reason</label>
            <select class="form-select" id="inp-report-reason">
              <option value="Incorrect information">Incorrect information</option>
              <option value="Outdated">Outdated</option>
              <option value="Spam / Scam">Spam / Scam</option>
              <option value="Duplicate">Duplicate</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Details</label>
            <textarea class="form-textarea" id="inp-report-notes" rows="2" placeholder="Explain discrepancy..."></textarea>
          </div>
          <div class="modal-footer" style="padding:0;border:none;background:none;margin-top:6px;">
            <button type="button" class="filter-pill" onclick="closeModals()">Cancel</button>
            <button type="submit" class="btn-share-info" style="background:#dc2626;">Submit Report</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('report-form').onsubmit = (e) => {
    e.preventDefault();
    state.reportPost(postId, document.getElementById('inp-report-reason').value, document.getElementById('inp-report-notes').value);
    closeModals();
    alert('Notice reported and sent to moderation desk.');
  };
}

// Lightbox
function openLightbox(url) {
  const root = document.getElementById('modals-root');
  root.innerHTML = `
    <div class="modal-overlay" onclick="closeModals()" style="cursor:zoom-out;">
      <div style="position:relative;max-width:90vw;max-height:90vh;" onclick="event.stopPropagation()">
        <img src="${url}" style="max-width:100%;max-height:85vh;border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);">
      </div>
    </div>
  `;
}

function closeModals() {
  document.getElementById('modals-root').innerHTML = '';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
