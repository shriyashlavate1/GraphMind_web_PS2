/**
 * CivicPulse - App State & Reactive Store
 * Pure Plain JavaScript (With Full Channel CRUD & Storage Persistence)
 */

class CommunityState {
  constructor() {
    this.categories = this.loadCategories();
    this.posts = this.loadPosts();
    this.theme = localStorage.getItem('civicpulse_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.currentUser = {
      id: 'usr_rahul_99',
      name: 'Rahul Sharma',
      role: 'Resident',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    };

    this.activeView = 'FEED';
    this.selectedCategory = 'EDUCATION';
    this.selectedChannel = 'internships';

    this.filters = {
      search: '',
      categoryId: 'ALL',
      channelId: 'ALL',
      status: 'ALL',
      sortBy: 'relevance',
      onlyWithDeadlines: false,
      onlyWithImages: false,
      onlyUrgent: false,
    };

    this.selectedPostId = null;
    this.listeners = [];

    // Periodic expiration check
    this.checkExpirations();
    setInterval(() => this.checkExpirations(), 60000);
  }

  loadCategories() {
    const saved = localStorage.getItem('civicpulse_plain_categories');
    let cats = null;
    if (saved) {
      try {
        cats = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved categories', e);
      }
    }
    if (!cats) {
      cats = INITIAL_CATEGORIES;
    }
    return cats.map((cat) => {
      const seed = INITIAL_CATEGORIES.find((c) => c.id === cat.id);
      const iconKey = CATEGORY_ICONS?.[cat.id] || seed?.iconKey || cat.iconKey || 'search';
      return {
        ...cat,
        icon: iconKey,
        iconKey,
        channels: (cat.channels || []).map((ch) => ({
          ...ch,
          status: ch.status || 'active',
        })),
      };
    });
  }

  saveCategories() {
    localStorage.setItem('civicpulse_plain_categories', JSON.stringify(this.categories));
    this.notify();
  }

  loadPosts() {
    const saved = localStorage.getItem('civicpulse_plain_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved posts', e);
      }
    }
    return INITIAL_POSTS;
  }

  savePosts() {
    localStorage.setItem('civicpulse_plain_posts', JSON.stringify(this.posts));
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((fn) => fn(this));
  }

  // Theme Toggle
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('civicpulse_theme', this.theme);
    this.applyTheme();
    this.notify();
  }

  applyTheme() {
    const root = document.documentElement;
    if (this.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // Role Switcher
  toggleUserRole() {
    if (this.currentUser.role === 'Resident') {
      this.currentUser = {
        id: 'usr_priya_lead',
        name: 'Priya Desai (Mod)',
        role: 'Moderator',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      };
    } else {
      this.currentUser = {
        id: 'usr_rahul_99',
        name: 'Rahul Sharma',
        role: 'Resident',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      };
    }
    this.notify();
  }

  // Channel Selection
  selectChannel(catId, chId) {
    this.selectedCategory = catId;
    this.selectedChannel = chId;
    this.filters.categoryId = catId;
    this.filters.channelId = chId;
    this.activeView = 'FEED';
    this.notify();
  }

  // View Navigation
  setView(viewName) {
    this.activeView = viewName;
    this.notify();
  }

  // Filter Management
  setFilter(key, value) {
    this.filters[key] = value;
    if (key === 'categoryId' || key === 'channelId') {
      this.selectedCategory = this.filters.categoryId;
      this.selectedChannel = this.filters.channelId;
    }
    this.notify();
  }

  resetFilters() {
    this.filters = {
      search: '',
      categoryId: 'ALL',
      channelId: 'ALL',
      status: 'ALL',
      sortBy: 'relevance',
      onlyWithDeadlines: false,
      onlyWithImages: false,
      onlyUrgent: false,
    };
    this.selectedCategory = 'ALL';
    this.selectedChannel = 'ALL';
    this.notify();
  }

  // ==========================================================================
  // CHANNEL CRUD OPERATIONS (Admin Full Access)
  // ==========================================================================

  getAllChannels() {
    const all = [];
    this.categories.forEach((cat) => {
      cat.channels.forEach((ch) => {
        all.push({
          ...ch,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          postCount: this.posts.filter((p) => p.channelId === ch.id).length,
        });
      });
    });
    return all;
  }

  createChannel({ name, description, categoryId, icon = '#', status = 'active' }) {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const chId = cleanName;

    // Check if channel already exists
    const existing = this.getAllChannels().find((c) => c.id === chId);
    if (existing) {
      throw new Error(`Channel #${cleanName} already exists in ${existing.categoryName}.`);
    }

    let catObj = this.categories.find((c) => c.id === categoryId);
    if (!catObj) {
      catObj = this.categories[0];
    }

    const newChannel = {
      id: chId,
      name: cleanName,
      categoryId: catObj.id,
      description: description.trim(),
      icon,
      status, // 'active' or 'inactive'
    };

    catObj.channels.push(newChannel);
    this.saveCategories();
    return newChannel;
  }

  updateChannel(channelId, { name, description, categoryId, icon, status }) {
    let targetCh = null;
    let oldCat = null;

    for (const cat of this.categories) {
      const idx = cat.channels.findIndex((c) => c.id === channelId);
      if (idx !== -1) {
        targetCh = cat.channels[idx];
        oldCat = cat;
        if (categoryId && categoryId !== cat.id) {
          // Move to new category
          cat.channels.splice(idx, 1);
          const newCat = this.categories.find((c) => c.id === categoryId) || this.categories[0];
          newCat.channels.push(targetCh);
          targetCh.categoryId = newCat.id;
        }
        break;
      }
    }

    if (!targetCh) return null;

    if (name) targetCh.name = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (description !== undefined) targetCh.description = description.trim();
    if (icon) targetCh.icon = icon;
    if (status) targetCh.status = status;

    this.saveCategories();
    return targetCh;
  }

  deleteChannel(channelId) {
    for (const cat of this.categories) {
      const idx = cat.channels.findIndex((c) => c.id === channelId);
      if (idx !== -1) {
        cat.channels.splice(idx, 1);
        this.saveCategories();
        return true;
      }
    }
    return false;
  }

  toggleChannelStatus(channelId) {
    for (const cat of this.categories) {
      const ch = cat.channels.find((c) => c.id === channelId);
      if (ch) {
        ch.status = ch.status === 'active' ? 'inactive' : 'active';
        this.saveCategories();
        return ch.status;
      }
    }
    return null;
  }

  // ==========================================================================
  // POST OPERATIONS
  // ==========================================================================

  createPost(newPostData) {
    const id = `post_${Date.now()}`;
    const now = new Date().toISOString();

    const catObj = this.categories.find((c) => c.id === newPostData.categoryId);
    const chObj = catObj?.channels.find((ch) => ch.id === newPostData.channelId);

    const post = {
      id,
      title: newPostData.title || 'Untitled Community Notice',
      description: newPostData.description || '',
      categoryId: newPostData.categoryId || 'GENERAL',
      channelId: newPostData.channelId || 'announcements',
      channelName: chObj?.name || 'announcements',
      author: {
        id: this.currentUser.id,
        name: this.currentUser.name,
        role: this.currentUser.role,
        initial: this.currentUser.name.charAt(0).toUpperCase(),
        color: 'purple',
        avatar: this.currentUser.avatar,
      },
      createdAt: now,
      updatedAt: now,
      formattedDate: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: newPostData.status || 'Active',
      deadline: newPostData.deadline,
      deadlineLabel: newPostData.deadlineLabel,
      expectedResolution: newPostData.expectedResolution,
      resolutionLabel: newPostData.resolutionLabel,
      location: newPostData.location || 'Andheri, Mumbai',
      categoryPath: `${catObj?.name || 'General'} > ${chObj?.name || 'announcements'}`,
      distanceKm: newPostData.distanceKm ?? 0.8,
      tags: newPostData.tags || [],
      images: newPostData.images || [],
      attachments: newPostData.attachments || [],
      priority: newPostData.priority || 'normal',
      validation: {
        useful: 1,
        incorrect: 0,
        userVote: 'useful',
      },
      updates: [
        {
          id: `upd_init_${Date.now()}`,
          timestamp: now,
          authorName: this.currentUser.name,
          authorRole: this.currentUser.role,
          content: 'Initial information post created and verified.',
          newStatus: newPostData.status || 'Active',
        },
      ],
      comments: [],
      reports: [],
    };

    this.posts.unshift(post);
    this.savePosts();
    return post;
  }

  updatePost(postId, updateText, newStatus) {
    const now = new Date().toISOString();
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    const previousStatus = post.status;
    const targetStatus = newStatus || post.status;

    post.updates.push({
      id: `upd_${Date.now()}`,
      timestamp: now,
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      content: updateText,
      previousStatus,
      newStatus: targetStatus,
    });

    post.status = targetStatus;
    post.updatedAt = now;
    this.savePosts();
  }

  resolvePost(postId, resolutionSummary) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    this.updatePost(
      postId,
      resolutionSummary || 'Problem has been confirmed resolved by community.',
      'Resolved'
    );
  }

  reportPost(postId, reason, customNotes) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    const now = new Date().toISOString();
    post.reports.push({
      id: `rep_${Date.now()}`,
      reason,
      customNotes,
      reportedBy: this.currentUser.name,
      reportedAt: now,
    });

    post.status = 'UNDER_REVIEW';
    post.updatedAt = now;
    post.updates.push({
      id: `upd_rep_${Date.now()}`,
      timestamp: now,
      authorName: this.currentUser.name,
      authorRole: 'Community Member',
      content: `Flagged for moderator review: "${reason}".`,
      previousStatus: post.status,
      newStatus: 'UNDER_REVIEW',
    });

    this.savePosts();
  }

  validatePost(postId, type) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    const currentVote = post.validation.userVote;
    let useful = post.validation.useful;
    let incorrect = post.validation.incorrect;
    let newVote = type;

    if (currentVote === type) {
      newVote = null;
      if (type === 'useful') useful = Math.max(0, useful - 1);
      if (type === 'incorrect') incorrect = Math.max(0, incorrect - 1);
    } else if (currentVote === 'useful' && type === 'incorrect') {
      useful = Math.max(0, useful - 1);
      incorrect += 1;
    } else if (currentVote === 'incorrect' && type === 'useful') {
      incorrect = Math.max(0, incorrect - 1);
      useful += 1;
    } else {
      if (type === 'useful') useful += 1;
      if (type === 'incorrect') incorrect += 1;
    }

    post.validation = {
      useful,
      incorrect,
      userVote: newVote,
    };

    this.savePosts();
  }

  addComment(postId, content) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post || !content.trim()) return;

    const now = new Date().toISOString();
    post.comments.push({
      id: `com_${Date.now()}`,
      authorName: this.currentUser.name,
      authorAvatar: this.currentUser.avatar,
      authorRole: this.currentUser.role,
      timestamp: now,
      content: content.trim(),
      likes: 0,
    });

    this.savePosts();
  }

  moderatorApprove(postId) {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;

    post.status = 'Active';
    post.updatedAt = new Date().toISOString();
    post.reports = [];
    post.updates.push({
      id: `upd_mod_${Date.now()}`,
      timestamp: new Date().toISOString(),
      authorName: this.currentUser.name,
      authorRole: 'Community Moderator',
      content: 'Moderator reviewed reports and verified notice as valid.',
      previousStatus: 'UNDER_REVIEW',
      newStatus: 'Active',
    });
    this.savePosts();
  }

  moderatorRemove(postId) {
    this.posts = this.posts.filter((p) => p.id !== postId);
    this.savePosts();
  }

  resetDemoData() {
    localStorage.removeItem('civicpulse_plain_posts');
    localStorage.removeItem('civicpulse_plain_categories');
    this.posts = INITIAL_POSTS;
    this.categories = INITIAL_CATEGORIES.map((cat) => ({
      ...cat,
      channels: cat.channels.map((ch) => ({ ...ch, status: 'active' })),
    }));
    this.resetFilters();
    this.savePosts();
    this.saveCategories();
  }

  checkExpirations() {
    const now = new Date().getTime();
    let changed = false;

    this.posts.forEach((post) => {
      if (post.deadline && post.status !== 'Expired' && post.status !== 'Resolved') {
        const deadlineTime = new Date(post.deadline).getTime();
        if (deadlineTime <= now) {
          post.status = 'Expired';
          post.updatedAt = new Date().toISOString();
          post.updates.push({
            id: `upd_exp_${Date.now()}`,
            timestamp: new Date().toISOString(),
            authorName: 'System Scheduler',
            authorRole: 'Automated Lifecycle',
            content: `Deadline reached. Post archived as Expired.`,
            previousStatus: post.status,
            newStatus: 'Expired',
          });
          changed = true;
        }
      }
    });

    if (changed) this.savePosts();
  }

  getFilteredPosts() {
    return this.posts
      .filter((post) => {
        if (this.filters.categoryId !== 'ALL' && post.categoryId !== this.filters.categoryId) return false;
        if (this.filters.channelId !== 'ALL' && post.channelId !== this.filters.channelId) return false;
        if (this.filters.status !== 'ALL' && post.status.toLowerCase() !== this.filters.status.toLowerCase()) return false;
        if (this.filters.onlyWithDeadlines && !post.deadline) return false;
        if (this.filters.onlyWithImages && (!post.images || post.images.length === 0)) return false;
        if (this.filters.onlyUrgent && post.priority !== 'urgent') return false;

        if (this.filters.search.trim()) {
          const q = this.filters.search.toLowerCase();
          const inTitle = post.title.toLowerCase().includes(q);
          const inDesc = post.description.toLowerCase().includes(q);
          const inTags = post.tags.some((t) => t.toLowerCase().includes(q));
          const inLocation = post.location?.toLowerCase().includes(q) ?? false;
          const inAuthor = post.author.name.toLowerCase().includes(q);
          const inChannel = post.channelName.toLowerCase().includes(q);

          if (!inTitle && !inDesc && !inTags && !inLocation && !inAuthor && !inChannel) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (this.filters.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (this.filters.sortBy === 'discussed') {
          return b.comments.length - a.comments.length;
        }
        if (this.filters.sortBy === 'validated') {
          return b.validation.useful - a.validation.useful;
        }
        if (this.filters.sortBy === 'nearby') {
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        }
        if (this.filters.sortBy === 'expiring') {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }

        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  getStats() {
    return {
      total: this.posts.length,
      active: this.posts.filter((p) => p.status === 'Active' || p.status === 'ACTIVE').length,
      pending: this.posts.filter((p) => p.status === 'Pending' || p.status === 'PENDING').length,
      resolved: this.posts.filter((p) => p.status === 'Resolved' || p.status === 'RESOLVED').length,
      underReview: this.posts.filter((p) => p.status === 'UNDER_REVIEW').length,
      expired: this.posts.filter((p) => p.status === 'Expired' || p.status === 'EXPIRED').length,
    };
  }
}

const state = new CommunityState();
