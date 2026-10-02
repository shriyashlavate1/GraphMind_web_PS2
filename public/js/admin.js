/**
 * CivicPulse - Dedicated Admin & Channel Management Controller
 * Pure Plain JavaScript (Zero External UI Libraries)
 */

class AdminStateController {
  constructor() {
    this.activeView = 'CHANNELS'; // Default to CHANNELS view per user request
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
    this.engineConfig = null;
  }

  setView(viewName) {
    this.activeView = viewName;
    renderAdminAll();
  }

  setSearch(q) {
    this.searchQuery = q;
    renderAdminMainArea();
  }

  setCategory(cat) {
    this.categoryFilter = cat;
    renderAdminMainArea();
  }

  // ==========================================================================
  // CHANNEL CRUD OPERATIONS
  // ==========================================================================

  createChannel(data) {
    try {
      const created = state.createChannel(data);
      renderAdminAll();
      showToast(`✓ Channel #${created.name} successfully created in ${data.categoryId}.`);
      return created;
    } catch (err) {
      alert(err.message);
      return null;
    }
  }

  updateChannel(channelId, data) {
    const updated = state.updateChannel(channelId, data);
    if (updated) {
      renderAdminAll();
      showToast(`✓ Channel #${updated.name} successfully updated.`);
    }
    return updated;
  }

  deleteChannel(channelId) {
    const channel = state.getAllChannels().find((c) => c.id === channelId);
    if (!channel) return;

    if (confirm(`Are you sure you want to delete channel #${channel.name} from ${channel.categoryName}?\nThis action will remove the channel from public navigation.`)) {
      state.deleteChannel(channelId);
      renderAdminAll();
      showToast(`🗑️ Channel #${channel.name} has been deleted.`);
    }
  }

  toggleChannelStatus(channelId) {
    const newStatus = state.toggleChannelStatus(channelId);
    if (newStatus) {
      renderAdminAll();
      showToast(`🔄 Channel status changed to ${newStatus.toUpperCase()}.`);
    }
  }

  // ==========================================================================
  // POST MODERATION ACTIONS
  // ==========================================================================

  approveNotice(postId) {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;

    post.status = 'Active';
    post.reports = [];
    post.updatedAt = new Date().toISOString();
    post.updates.push({
      id: `upd_adm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorName: 'Priya Desai',
      authorRole: 'Admin / Moderator',
      content: 'Admin verified post validity and dismissed community reports.',
      previousStatus: 'UNDER_REVIEW',
      newStatus: 'Active',
    });

    state.savePosts();
    renderAdminAll();
    showToast('✓ Notice approved & published to community feed.');
  }

  removeNotice(postId, reason = 'Violates community guidelines') {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;

    if (confirm(`Confirm removal of notice "${post.title}"?\nReason: ${reason}`)) {
      state.posts = state.posts.filter((p) => p.id !== postId);
      state.savePosts();
      renderAdminAll();
      showToast('🗑️ Notice removed from public community feed.');
    }
  }

  resolveNotice(postId, note = 'Resolved by community moderator') {
    const post = state.posts.find((p) => p.id === postId);
    if (!post) return;

    post.status = 'Resolved';
    post.updatedAt = new Date().toISOString();
    post.updates.push({
      id: `upd_adm_res_${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorName: 'Priya Desai',
      authorRole: 'Admin / Moderator',
      content: note,
      newStatus: 'Resolved',
    });

    state.savePosts();
    renderAdminAll();
    showToast('✅ Problem marked as verified Resolved.');
  }
}

const adminState = new AdminStateController();

document.addEventListener('DOMContentLoaded', async () => {
  // Apply theme
  state.applyTheme();

  // Fetch backend LLM config
  adminState.engineConfig = await API.getConfig();
  const engineLbl = document.getElementById('adm-engine-label');
  if (engineLbl && adminState.engineConfig) {
    engineLbl.textContent = adminState.engineConfig.engineName;
  }

  // Theme button
  document.getElementById('btn-admin-theme')?.addEventListener('click', () => {
    state.toggleTheme();
    document.getElementById('btn-admin-theme').innerHTML = `${icon(state.theme === 'dark' ? 'sun' : 'moon', 'md')}`;
  });

  // Reset button
  document.getElementById('btn-admin-reset')?.addEventListener('click', () => {
    if (confirm('Reset community database and channels to default realistic demo records?')) {
      state.resetDemoData();
      renderAdminAll();
      showToast('🔄 Demo database reset to default records.');
    }
  });

  // Subscribe to core state
  state.subscribe(() => {
    renderAdminAll();
  });

  renderAdminAll();
});

function renderAdminAll() {
  renderAdminSidebar();
  renderAdminMainArea();
}

function renderAdminSidebar() {
  const allChannels = state.getAllChannels();
  const reportedCount = state.posts.filter((p) => p.status === 'UNDER_REVIEW' || (p.reports && p.reports.length > 0)).length;
  const aiCount = state.posts.filter((p) => p.id === 'post-110').length;
  const resolvedCount = state.posts.filter((p) => p.status === 'Resolved' || p.status === 'RESOLVED').length;

  document.getElementById('badge-channel-count').textContent = allChannels.length;
  document.getElementById('badge-reported-count').textContent = reportedCount;
  document.getElementById('badge-ai-count').textContent = aiCount;
  document.getElementById('badge-resolved-count').textContent = resolvedCount;

  document.getElementById('nav-adm-overview')?.classList.toggle('active', adminState.activeView === 'OVERVIEW');
  document.getElementById('nav-adm-channels')?.classList.toggle('active', adminState.activeView === 'CHANNELS');
  document.getElementById('nav-adm-reported')?.classList.toggle('active', adminState.activeView === 'REPORTED');
  document.getElementById('nav-adm-ai')?.classList.toggle('active', adminState.activeView === 'AI_FLAGS');
  document.getElementById('nav-adm-resolved')?.classList.toggle('active', adminState.activeView === 'RESOLVED');
  document.getElementById('nav-adm-all')?.classList.toggle('active', adminState.activeView === 'ALL_POSTS');
  document.getElementById('nav-adm-settings')?.classList.toggle('active', adminState.activeView === 'SETTINGS');
}

function renderAdminMainArea() {
  const main = document.getElementById('admin-main-area');
  if (!main) return;

  if (adminState.activeView === 'CHANNELS') {
    renderAdminChannelsView(main);
  } else if (adminState.activeView === 'OVERVIEW') {
    renderAdminOverview(main);
  } else if (adminState.activeView === 'REPORTED') {
    renderAdminReportedQueue(main);
  } else if (adminState.activeView === 'AI_FLAGS') {
    renderAdminAiFlagsQueue(main);
  } else if (adminState.activeView === 'RESOLVED') {
    renderAdminResolvedAudits(main);
  } else if (adminState.activeView === 'ALL_POSTS') {
    renderAdminAllPosts(main);
  } else if (adminState.activeView === 'SETTINGS') {
    renderAdminSettings(main);
  }
}

// ==========================================================================
// 1. Channel Management View (Full CRUD)
// ==========================================================================
function renderAdminChannelsView(container) {
  const allChannels = state.getAllChannels();

  container.innerHTML = `
    <div class="feed-header-section">
      <div class="page-toolbar">
        <div>
          <h1 class="feed-title-line">${icon('folder', 'lg')} Channel management</h1>
          <p class="feed-desc-line">Create, configure, activate, and retire community channels across all categories.</p>
        </div>

        <button class="btn-share-info" onclick="openCreateChannelModal()">
          ${icon('plus', 'sm')}
          <span>Create channel</span>
        </button>
      </div>

      <!-- Search & Category Filters -->
      <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap;">
        <input type="text" class="header-search-input" placeholder="Search channels by name or description..." style="max-width:320px;" oninput="adminState.setSearch(this.value)">

        <select class="filter-select-pill" onchange="adminState.setCategory(this.value)">
          <option value="ALL">All Categories (${state.categories.length})</option>
          ${state.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- Scrollable Channels Directory -->
    <div class="feed-cards-scroll">
      <div class="feed-cards-container" style="max-width:1000px;gap:20px;">
        ${state.categories
          .filter((cat) => adminState.categoryFilter === 'ALL' || cat.id === adminState.categoryFilter)
          .map((cat) => {
            const catChannels = cat.channels.filter(
              (ch) =>
                !adminState.searchQuery ||
                ch.name.toLowerCase().includes(adminState.searchQuery.toLowerCase()) ||
                ch.description.toLowerCase().includes(adminState.searchQuery.toLowerCase())
            );

            if (catChannels.length === 0) return '';

            return `
              <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:18px;box-shadow:var(--shadow-sm);">
                <!-- Category Heading -->
                <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border-color);padding-bottom:10px;margin-bottom:12px;">
                  <div style="display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;color:var(--text-main);">
                    ${categoryIconImg(cat, 'sm')}
                    <span>${cat.name} CATEGORY</span>
                    <span style="font-size:11px;background:var(--bg-sidebar);color:var(--text-muted);padding:2px 8px;border-radius:var(--radius-full);font-weight:600;">${catChannels.length} channels</span>
                  </div>
                  <button class="btn btn-secondary" style="font-size:11px;padding:3px 8px;" onclick="openCreateChannelModal('${cat.id}')">+ Add to ${cat.name}</button>
                </div>

                <!-- Channels Grid/List -->
                <div style="display:flex;flex-direction:column;gap:10px;">
                  ${catChannels
                    .map((ch) => {
                      const isActive = ch.status !== 'inactive';
                      const postCount = state.posts.filter((p) => p.channelId === ch.id).length;

                      return `
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--bg-sidebar);border:1px solid var(--border-color);border-radius:var(--radius-md);flex-wrap:wrap;gap:10px;">
                          <!-- Left: Icon, Name & Description -->
                          <div style="flex:1;min-width:240px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                              <span style="font-size:14px;">${ch.icon || '#'}</span>
                              <span style="font-size:14px;font-weight:700;color:var(--text-main);">#${ch.name}</span>
                              <span class="status-pill-badge ${isActive ? 'active' : 'expired'}" style="font-size:10px;padding:2px 8px;display:inline-flex;align-items:center;gap:3px;">
                                ${isActive
                                  ? '<img src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20green%20circle%20dot%20healthy%20online%20status%20icon%20corporate%20clean%20minimal%20white%20background&image_size=square" alt="" class="ai-icon ai-icon-xs"> Active'
                                  : '<img src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20gray%20circle%20dot%20inactive%20offline%20archived%20status%20icon%20corporate%20clean%20minimal%20white%20background&image_size=square" alt="" class="ai-icon ai-icon-xs"> Inactive'}
                              </span>
                              <span style="font-size:11px;color:var(--text-muted);background:var(--bg-surface);padding:1px 6px;border-radius:4px;border:1px solid var(--border-color);">
                                ${postCount} posts
                              </span>
                            </div>
                            <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">
                              ${ch.description || 'No channel description set.'}
                            </div>
                          </div>

                          <!-- Right: CRUD Action Buttons -->
                          <div style="display:flex;align-items:center;gap:6px;">
                            <button class="filter-pill" style="font-size:11px;padding:4px 10px;" onclick="openEditChannelModal('${ch.id}')" title="Edit channel details">
                              ${icon('pencil', 'xs')} Edit
                            </button>

                            <button class="filter-pill" style="font-size:11px;padding:4px 10px;color:${isActive ? '#b45309' : '#15803d'};" onclick="adminState.toggleChannelStatus('${ch.id}')" title="Toggle active/inactive status">
                              ${icon(isActive ? 'pause' : 'play', 'xs')} ${isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <button class="filter-pill" style="font-size:11px;padding:4px 10px;color:#dc2626;" onclick="adminState.deleteChannel('${ch.id}')" title="Delete channel">
                              ${icon('trash', 'xs')} Delete
                            </button>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

// 2. Channel Create Modal
function openCreateChannelModal(defaultCategoryId = 'EDUCATION') {
  const root = document.getElementById('admin-modals-root');
  const plusModal = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20plus%20add%20create%20new%20icon%20corporate%20clean%20minimal%20purple%20white%20background&image_size=square';

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:500px;">
        <div class="modal-header" style="background:#f3e8ff;">
          <div class="modal-title" style="color:#7c3aed;display:flex;align-items:center;gap:4px;"><img src="${plusModal}" alt="" class="ai-icon ai-icon-sm"> Create New Community Channel</div>
          <button class="dots-menu-btn" onclick="closeAdminModals()">✕</button>
        </div>

        <form id="form-create-channel" class="modal-body">
          <div class="form-group">
            <label class="form-label">Channel Name (slug) *</label>
            <input type="text" class="form-input" id="inp-ch-name" required placeholder="e.g. hackathons, blood-donation, civic-alerts">
            <span style="font-size:10px;color:var(--text-muted);">Will appear as #channel-name in lowercase</span>
          </div>

          <div class="form-group">
            <label class="form-label">Parent Category *</label>
            <select class="form-select" id="inp-ch-category">
              ${state.categories.map((c) => `<option value="${c.id}" ${c.id === defaultCategoryId ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="inp-ch-desc" rows="3" required placeholder="Describe what kind of community information belongs in this channel..."></textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
              <label class="form-label">Icon / Emoji</label>
              <input type="text" class="form-input" id="inp-ch-icon" value="📌" placeholder="e.g. 💼, 🩸, 🚧">
            </div>

            <div class="form-group">
              <label class="form-label">Initial Status</label>
              <select class="form-select" id="inp-ch-status">
                <option value="active">🟢 Active (Visible)</option>
                <option value="inactive">⚪ Inactive (Archived)</option>
              </select>
            </div>
          </div>

          <div class="modal-footer" style="padding:0;border:none;background:none;margin-top:10px;">
            <button type="button" class="filter-pill" onclick="closeAdminModals()">Cancel</button>
            <button type="submit" class="btn-share-info" style="background:#7c3aed;">Create Channel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-create-channel').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('inp-ch-name').value;
    const categoryId = document.getElementById('inp-ch-category').value;
    const description = document.getElementById('inp-ch-desc').value;
    const icon = document.getElementById('inp-ch-icon').value || '#';
    const status = document.getElementById('inp-ch-status').value;

    const created = adminState.createChannel({
      name,
      categoryId,
      description,
      icon,
      status,
    });

    if (created) {
      closeAdminModals();
    }
  };
}

// 3. Channel Edit Modal
function openEditChannelModal(channelId) {
  const allChannels = state.getAllChannels();
  const ch = allChannels.find((c) => c.id === channelId);
  if (!ch) return;

  const root = document.getElementById('admin-modals-root');
  const pencilModal = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20pencil%20edit%20write%20icon%20corporate%20clean%20minimal%20yellow%20white%20background&image_size=square';

  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:500px;">
        <div class="modal-header">
          <div class="modal-title" style="display:flex;align-items:center;gap:4px;"><img src="${pencilModal}" alt="" class="ai-icon ai-icon-sm"> Edit Channel: #${ch.name}</div>
          <button class="dots-menu-btn" onclick="closeAdminModals()">✕</button>
        </div>

        <form id="form-edit-channel" class="modal-body">
          <div class="form-group">
            <label class="form-label">Channel Name *</label>
            <input type="text" class="form-input" id="inp-edit-ch-name" value="${ch.name}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Parent Category *</label>
            <select class="form-select" id="inp-edit-ch-category">
              ${state.categories.map((c) => `<option value="${c.id}" ${c.id === ch.categoryId ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="inp-edit-ch-desc" rows="3" required>${ch.description || ''}</textarea>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
              <label class="form-label">Icon / Emoji</label>
              <input type="text" class="form-input" id="inp-edit-ch-icon" value="${ch.icon || '📌'}">
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-select" id="inp-edit-ch-status">
                <option value="active" ${ch.status !== 'inactive' ? 'selected' : ''}>🟢 Active</option>
                <option value="inactive" ${ch.status === 'inactive' ? 'selected' : ''}>⚪ Inactive</option>
              </select>
            </div>
          </div>

          <div class="modal-footer" style="padding:0;border:none;background:none;margin-top:10px;">
            <button type="button" class="filter-pill" onclick="closeAdminModals()">Cancel</button>
            <button type="submit" class="btn-share-info" style="background:#7c3aed;">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('form-edit-channel').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('inp-edit-ch-name').value;
    const categoryId = document.getElementById('inp-edit-ch-category').value;
    const description = document.getElementById('inp-edit-ch-desc').value;
    const icon = document.getElementById('inp-edit-ch-icon').value;
    const status = document.getElementById('inp-edit-ch-status').value;

    adminState.updateChannel(channelId, {
      name,
      categoryId,
      description,
      icon,
      status,
    });

    closeAdminModals();
  };
}

// 4. Admin Overview View
function renderAdminOverview(container) {
  const stats = state.getStats();
  const allChannels = state.getAllChannels();
  const reportedPosts = state.posts.filter((p) => p.status === 'UNDER_REVIEW' || (p.reports && p.reports.length > 0));

  container.innerHTML = `
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${icon('chart', 'lg')} Moderation overview</h1>
        <p class="feed-desc-line">Channel health, citizen reports, and live notices across CivicPulse Mumbai.</p>
      </div>

      <div class="metric-grid">
        <div class="metric-card" onclick="adminState.setView('CHANNELS')">
          <div class="metric-card-label">${icon('folder', 'xs')} Active channels</div>
          <div class="metric-card-value">${allChannels.length}</div>
          <div class="metric-card-hint">Across ${state.categories.length} categories</div>
        </div>

        <div class="metric-card" onclick="adminState.setView('REPORTED')">
          <div class="metric-card-label">${icon('flag', 'xs')} Pending reports</div>
          <div class="metric-card-value">${reportedPosts.length}</div>
          <div class="metric-card-hint">Awaiting moderator review</div>
        </div>

        <div class="metric-card" onclick="adminState.setView('ALL_POSTS')">
          <div class="metric-card-label">${icon('feed', 'xs')} Active notices</div>
          <div class="metric-card-value">${stats.active + stats.pending}</div>
          <div class="metric-card-hint">Live in the community feed</div>
        </div>

        <div class="metric-card" onclick="adminState.setView('RESOLVED')">
          <div class="metric-card-label">${icon('checkCircle', 'xs')} Resolved audits</div>
          <div class="metric-card-value">${stats.resolved}</div>
          <div class="metric-card-hint">Confirmed solved</div>
        </div>
      </div>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        <div class="page-toolbar">
          <h3 class="section-heading">${icon('alert', 'sm')} Priority items (${reportedPosts.length})</h3>
          <button class="filter-pill" onclick="adminState.setView('REPORTED')">View full queue ${icon('arrowRight', 'xs')}</button>
        </div>

        ${
          reportedPosts.length > 0
            ? reportedPosts.map((p) => renderAdminCardHtml(p)).join('')
            : `<div class="empty-state">${icon('checkCircle', 'xl')}<h3>All reports reviewed</h3><p>No notices are waiting in the moderation queue.</p></div>`
        }
      </div>
    </div>
  `;
}

// 5. Reported Queue View
function renderAdminReportedQueue(container) {
  const reportedPosts = state.posts.filter((p) => p.status === 'UNDER_REVIEW' || (p.reports && p.reports.length > 0));

  container.innerHTML = `
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${icon('flag', 'lg')} Citizen Reported Notices Queue (${reportedPosts.length})</h1>
        <p class="feed-desc-line">Notices flagged by community members for misinformation, spam, scams, or incorrect channels.</p>
      </div>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        ${
          reportedPosts.length > 0
            ? reportedPosts.map((p) => renderAdminCardHtml(p)).join('')
            : `<div style="text-align:center;padding:48px;color:var(--text-muted);background:var(--bg-sidebar);border-radius:var(--radius-lg);border:1px solid var(--border-color);">
                <div style="margin-bottom:8px;">${icon('checkCircle', '2xl')}</div>
                <h3 style="font-size:15px;font-weight:700;color:var(--text-main);">Queue is completely clear</h3>
                <p style="font-size:12px;margin-top:4px;">No citizen reports pending moderator evaluation.</p>
              </div>`
        }
      </div>
    </div>
  `;
}

// 6. AI Safety Flags View
function renderAdminAiFlagsQueue(container) {
  const aiFlagged = state.posts.filter((p) => p.id === 'post-110' || p.title.toLowerCase().includes('scam') || p.description.toLowerCase().includes('upi'));

  container.innerHTML = `
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${icon('bot', 'lg')} AI Pre-Publish Safety Flags (${aiFlagged.length})</h1>
        <p class="feed-desc-line">Notices caught by automated safety audits before broad distribution.</p>
      </div>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        ${aiFlagged
          .map(
            (p) => `
            <div class="post-card" style="border-left:4px solid #d97706;">
              <div class="card-left-content">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="status-pill-badge" style="background:#fef3c7;color:#b45309;font-weight:700;display:flex;align-items:center;gap:4px;">${icon('flag', 'xs')} AI SAFETY FLAG: FINANCIAL_SOLICITATION</span>
                  <span style="font-size:11px;color:var(--text-muted);">${p.formattedDate || 'Recently'}</span>
                </div>

                <h2 class="card-main-title">${p.title}</h2>
                <p class="card-description-paragraph">${p.description}</p>

                <div style="background:var(--bg-sidebar);padding:10px 14px;border-radius:var(--radius-md);border:1px solid var(--border-color);font-size:12px;">
                  <div style="font-weight:700;color:#b45309;margin-bottom:4px;">Automated Safety Audit Reasoning:</div>
                  <ul style="padding-left:18px;color:var(--text-secondary);line-height:1.4;">
                    <li>Mentions mandatory upfront fee (₹1,500) via personal payment handles.</li>
                    <li>Western Railway recruitment confirmed counterfeit notice.</li>
                  </ul>
                </div>

                <div class="card-footer-row" style="margin-top:8px;">
                  <div style="font-size:12px;color:var(--text-muted);">
                    Author: <strong>${p.author.name}</strong> (${p.author.role})
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button class="filter-pill" style="color:#16a34a;font-weight:700;display:flex;align-items:center;gap:4px;" onclick="adminState.approveNotice('${p.id}')">${icon('checkCircle', 'xs')} Mark as Safe Notice</button>
                    <button class="filter-pill" style="color:#dc2626;font-weight:700;display:flex;align-items:center;gap:4px;" onclick="adminState.removeNotice('${p.id}', 'Fraudulent recruitment scam')">${icon('trash', 'xs')} Remove Scam Post</button>
                  </div>
                </div>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    </div>
  `;
}

// 7. Resolution Audits View
function renderAdminResolvedAudits(container) {
  const resolvedPosts = state.posts.filter((p) => p.status === 'Resolved' || p.status === 'RESOLVED');

  container.innerHTML = `
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${icon('checkCircle', 'lg')} Community Resolution Audits (${resolvedPosts.length})</h1>
        <p class="feed-desc-line">Verified resolved civic issues, repair updates, and completed events.</p>
      </div>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        ${resolvedPosts
          .map(
            (p) => `
            <div class="post-card" style="border-left:4px solid #16a34a;">
              <div class="card-left-content">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="status-pill-badge resolved">VERIFIED RESOLVED</span>
                  <span style="font-size:11px;color:var(--text-muted);">${p.formattedDate || 'Recently'}</span>
                </div>

                <h2 class="card-main-title">${p.title}</h2>
                <p class="card-description-paragraph">${p.description}</p>

                <div style="background:#dcfce7;color:#15803d;padding:10px 14px;border-radius:var(--radius-md);border:1px solid #86efac;font-size:12px;">
                  <strong>Resolution Audit Trail:</strong>
                  <div>${p.updates && p.updates.length > 0 ? p.updates[p.updates.length - 1].content : 'Confirmed resolved by author and verified by community.'}</div>
                </div>

                <div class="card-footer-row" style="margin-top:8px;">
                  <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
                    <span style="display:flex;align-items:center;gap:2px;">${icon('mapPin', 'xs')} ${p.location || 'Mumbai'}</span>
                    <span>•</span>
                    <span style="display:flex;align-items:center;gap:2px;">${icon('thumbsUp', 'xs')} ${p.validation.useful} Citizens Validated</span>
                  </div>
                  <button class="btn-view-details" onclick="openAdminInspectModal('${p.id}')">Inspect Audit Log →</button>
                </div>
              </div>
            </div>
          `
          )
          .join('')}
      </div>
    </div>
  `;
}

// 8. All Notices Directory View
function renderAdminAllPosts(container) {

  container.innerHTML = `
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${icon('files', 'lg')} All Community Notices Directory (${state.posts.length})</h1>
        <p class="feed-desc-line">Comprehensive overview of all notices published across all categories.</p>
      </div>

      <div style="display:flex;gap:10px;margin-top:8px;">
        <input type="text" class="header-search-input" placeholder="Filter by title, author, or keyword..." style="max-width:320px;" oninput="adminState.setSearch(this.value)">
      </div>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container">
        ${state.posts
          .filter((p) => !adminState.searchQuery || p.title.toLowerCase().includes(adminState.searchQuery.toLowerCase()))
          .map((p) => renderAdminCardHtml(p, false))
          .join('')}
      </div>
    </div>
  `;
}

// 9. Settings View
function renderAdminSettings(container) {

  container.innerHTML = `
    <div class="feed-header-section">
      <div>
        <h1 class="feed-title-line">${icon('settings', 'lg')} LLM Moderation Engine & System Settings</h1>
        <p class="feed-desc-line">Inspect secure backend AI integration and moderation policies.</p>
      </div>
    </div>

    <div class="feed-cards-scroll">
      <div class="feed-cards-container" style="max-width:720px;">
        <div style="background:var(--bg-surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:14px;">
          <h3 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:4px;">${icon('key', 'sm')} Backend LLM Security Model</h3>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.5;">
            The CivicPulse frontend communicates with <code style="background:var(--bg-sidebar);padding:2px 6px;border-radius:4px;">POST /api/moderate</code>. API keys are strictly retained on the backend in environment variables (<code style="background:var(--bg-sidebar);padding:2px 6px;border-radius:4px;">.env</code>) and are never exposed to the client.
          </p>

          <div style="background:var(--bg-sidebar);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-color);font-size:12px;display:flex;flex-direction:column;gap:6px;">
            <div><strong>Active Backend Engine:</strong> ${adminState.engineConfig?.engineName || 'Local Mock Moderation Mode'}</div>
            <div><strong>Mode:</strong> ${adminState.engineConfig?.mode || 'mock_moderation'}</div>
            <div><strong>Backend Health:</strong> <span style="color:#16a34a;font-weight:700;display:flex;align-items:center;gap:3px;">${icon('checkCircle', 'xs')} Healthy (Port 3000)</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render Admin Structured Card
function renderAdminCardHtml(post, showReportBox = true) {
  const isReported = post.reports && post.reports.length > 0;

  const cardIcons = {
    category: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20graduation%20cap%20category%20classify%20icon%20corporate%20clean%20minimal%20blue%20white%20background&image_size=square',
    flag: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20red%20flag%20report%20alert%20icon%20corporate%20clean%20minimal%20red%20white%20background&image_size=square',
    loc: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20map%20pin%20location%20marker%20pinpoint%20icon%20corporate%20clean%20minimal%20red%20white%20background&image_size=square',
    like: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20thumbs%20up%20like%20approve%20hand%20icon%20corporate%20clean%20minimal%20blue%20white%20background&image_size=square',
    comment: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20speech%20bubble%20comment%20chat%20icon%20corporate%20clean%20minimal%20green%20white%20background&image_size=square',
    check: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20checkmark%20tick%20approve%20icon%20corporate%20clean%20minimal%20green%20white%20background&image_size=square',
    resolve: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20green%20checkmark%20circle%20success%20verified%20resolved%20icon%20corporate%20clean%20minimal%20green%20white%20background&image_size=square',
    trash: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20trash%20bin%20delete%20remove%20icon%20corporate%20clean%20minimal%20red%20white%20background&image_size=square',
  };

  return `
    <div class="post-card" style="${isReported ? 'border-left:4px solid #dc2626;' : ''}">
      <div class="card-left-content">
        <div class="card-header-row">
          <div class="author-meta-block">
            <div class="author-circle-avatar ${post.author.color || 'purple'}">${post.author.initial || 'A'}</div>
            <span class="author-name-text">${post.author.name}</span>
            <span class="post-time-text">${post.formattedDate || 'Recently'}</span>
          </div>

          <div class="card-header-actions">
            <span class="status-pill-badge ${(post.status || 'active').toLowerCase()}">${post.status}</span>
            <span class="category-breadcrumb-pill"><img src="${cardIcons.category}" alt="" class="ai-icon ai-icon-xs" style="vertical-align:-2px;"> ${post.categoryPath || post.channelName}</span>
          </div>
        </div>

        <h2 class="card-main-title" onclick="openAdminInspectModal('${post.id}')">${post.title}</h2>
        <p class="card-description-paragraph">${post.description}</p>

        <!-- Reports Details Box -->
        ${
          showReportBox && isReported
            ? `
              <div style="background:var(--badge-review-bg);color:var(--badge-review-text);padding:10px 14px;border-radius:var(--radius-md);border:1px solid #fca5a5;font-size:12px;">
                <div style="font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:4px;"><img src="${cardIcons.flag}" alt="" class="ai-icon ai-icon-xs"> Citizen Reports (${post.reports.length}):</div>
                <ul style="padding-left:18px;">
                  ${post.reports.map((r) => `<li><strong>${r.reason}:</strong> ${r.customNotes || 'Flagged by resident'} (by ${r.reportedBy})</li>`).join('')}
                </ul>
              </div>
            `
            : ''
        }

        <!-- Admin Action Buttons -->
        <div class="card-footer-row" style="margin-top:8px;">
          <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;">
            <span style="display:flex;align-items:center;gap:2px;"><img src="${cardIcons.loc}" alt="" class="ai-icon ai-icon-xs"> ${post.location || 'Mumbai'}</span>
            <span>•</span>
            <span style="display:flex;align-items:center;gap:2px;"><img src="${cardIcons.like}" alt="" class="ai-icon ai-icon-xs"> ${post.validation.useful} Useful</span>
            <span>•</span>
            <span style="display:flex;align-items:center;gap:2px;"><img src="${cardIcons.comment}" alt="" class="ai-icon ai-icon-xs"> ${post.comments.length} Comments</span>
          </div>

          <div style="display:flex;align-items:center;gap:8px;">
            <button class="filter-pill" onclick="openAdminInspectModal('${post.id}')">Inspect Full</button>
            <button class="filter-pill" style="color:#16a34a;font-weight:700;background:#dcfce7;display:flex;align-items:center;gap:4px;" onclick="adminState.approveNotice('${post.id}')"><img src="${cardIcons.check}" alt="" class="ai-icon ai-icon-xs"> Approve Notice</button>
            <button class="filter-pill" style="color:#0284c7;font-weight:700;display:flex;align-items:center;gap:4px;" onclick="adminState.resolveNotice('${post.id}')"><img src="${cardIcons.resolve}" alt="" class="ai-icon ai-icon-xs"> Mark Resolved</button>
            <button class="filter-pill" style="color:#dc2626;font-weight:700;background:#fee2e2;display:flex;align-items:center;gap:4px;" onclick="adminState.removeNotice('${post.id}')"><img src="${cardIcons.trash}" alt="" class="ai-icon ai-icon-xs"> Remove</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Admin Inspect Modal
function openAdminInspectModal(postId) {
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const shield = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20shield%20guard%20moderation%20safety%20protection%20icon%20corporate%20clean%20minimal%20purple%20white%20background&image_size=square';
  const checkAI = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20checkmark%20tick%20approve%20icon%20corporate%20clean%20minimal%20green%20white%20background&image_size=square';
  const resolveAI = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20green%20checkmark%20circle%20success%20verified%20resolved%20icon%20corporate%20clean%20minimal%20green%20white%20background&image_size=square';
  const trashAI = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=simple%20flat%202D%20trash%20bin%20delete%20remove%20icon%20corporate%20clean%20minimal%20red%20white%20background&image_size=square';

  const root = document.getElementById('admin-modals-root');
  root.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-dialog" style="max-width:680px;">
        <div class="modal-header" style="background:#f3e8ff;">
          <div class="modal-title" style="color:#7c3aed;display:flex;align-items:center;gap:4px;"><img src="${shield}" alt="" class="ai-icon ai-icon-sm"> Moderator Post Audit Log</div>
          <button class="dots-menu-btn" onclick="closeAdminModals()">✕</button>
        </div>

        <div class="modal-body">
          <h2 style="font-size:17px;font-weight:700;">${post.title}</h2>
          <div style="font-size:12px;color:var(--text-muted);">Posted by <strong>${post.author.name}</strong> (${post.author.role}) • Status: <strong>${post.status}</strong></div>

          <p style="font-size:13px;line-height:1.5;">${post.description}</p>

          <!-- Audit Timeline -->
          <div style="border-top:1px solid var(--border-color);padding-top:10px;">
            <h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px;">Post Update & Audit Trail</h4>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
              ${post.updates.map((u) => `<div style="background:var(--bg-sidebar);padding:6px 10px;border-radius:4px;"><strong>${u.authorName}</strong> (${u.authorRole}): ${u.content}</div>`).join('')}
            </div>
          </div>

          <!-- Comments -->
          <div style="border-top:1px solid var(--border-color);padding-top:10px;">
            <h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px;">Community Comments (${post.comments.length})</h4>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;">
              ${post.comments.length > 0 ? post.comments.map((c) => `<div><strong>${c.authorName}:</strong> ${c.content}</div>`).join('') : '<div style="color:var(--text-muted);">No comments yet.</div>'}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="filter-pill" style="color:#16a34a;display:flex;align-items:center;gap:4px;" onclick="adminState.approveNotice('${post.id}');closeAdminModals();"><img src="${checkAI}" alt="" class="ai-icon ai-icon-xs"> Approve</button>
          <button class="filter-pill" style="color:#0284c7;display:flex;align-items:center;gap:4px;" onclick="adminState.resolveNotice('${post.id}');closeAdminModals();"><img src="${resolveAI}" alt="" class="ai-icon ai-icon-xs"> Resolve</button>
          <button class="filter-pill" style="color:#dc2626;display:flex;align-items:center;gap:4px;" onclick="adminState.removeNotice('${post.id}');closeAdminModals();"><img src="${trashAI}" alt="" class="ai-icon ai-icon-xs"> Remove</button>
          <button class="filter-pill active" onclick="closeAdminModals()">Close</button>
        </div>
      </div>
    </div>
  `;
}

function closeAdminModals() {
  document.getElementById('admin-modals-root').innerHTML = '';
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0f172a;color:#ffffff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 10px 15px rgba(0,0,0,0.2);z-index:999;transition:opacity 0.3s ease;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
