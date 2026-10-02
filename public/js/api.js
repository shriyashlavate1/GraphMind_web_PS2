/**
 * CivicPulse - Backend API Service Client
 * Connects securely to Node.js backend LLM endpoints without exposing API keys
 */

const API = {
  // Check backend server config & LLM status
  async getConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('[CivicPulse API] Backend offline, using client-side mock mode');
    }
    return {
      llmConfigured: false,
      mode: 'mock_moderation',
      engineName: 'Local Mock Moderation Mode',
    };
  },

  // 1. Moderate content before publish
  async moderateContent(title, description, category = '', channel = '') {
    try {
      const res = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, channel }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('[CivicPulse API] Error reaching /api/moderate:', err);
    }

    // Client-side fallback if backend is unreachable
    return this.clientFallbackModeration(title, description);
  },

  // 2. Classify content & suggest tags
  async classifyContent(title, description) {
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('[CivicPulse API] Error reaching /api/classify:', err);
    }

    return this.clientFallbackClassification(title, description);
  },

  // Fallback client moderation
  clientFallbackModeration(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const flags = [];
    const reasons = [];

    if (
      (text.includes('pay') || text.includes('fee') || text.includes('deposit') || text.includes('send money') || text.includes('1500')) &&
      (text.includes('upi') || text.includes('gpay') || text.includes('phonepe') || text.includes('guaranteed'))
    ) {
      flags.push('FINANCIAL_SOLICITATION');
      reasons.push('Mentions upfront fees or direct personal payment handles.');
    }

    if (text.includes('t.me/') || text.includes('wa.me/') || text.includes('bit.ly/')) {
      flags.push('SPAM_LINKS');
      reasons.push('Contains unverified external link patterns.');
    }

    if (text.includes('hate') || text.includes('kill') || text.includes('terrorist')) {
      return {
        score: 'BLOCKED',
        confidence: 0.99,
        flags: ['HARASSMENT'],
        reasons: ['Violates safety guidelines with hostile phrasing.'],
        recommendation: 'Content is blocked from publishing.',
        isMock: true,
        engine: 'Mock Moderation Mode (Client Fallback)',
      };
    }

    if (flags.length > 0) {
      return {
        score: 'NEEDS_REVIEW',
        confidence: 0.88,
        flags,
        reasons,
        recommendation: 'Flagged for community moderator review before wide circulation.',
        isMock: true,
        engine: 'Mock Moderation Mode (Client Fallback)',
      };
    }

    return {
      score: 'SAFE',
      confidence: 0.99,
      flags: [],
      reasons: ['No prohibited language, scams, or malicious links found.'],
      recommendation: 'Content is safe for immediate community publication.',
      isMock: true,
      engine: 'Mock Moderation Mode (Client Fallback)',
    };
  },

  // Fallback client classification
  clientFallbackClassification(title, description) {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('blood') || text.includes('donor') || text.includes('o-ve')) {
      return {
        categoryId: 'MEDICAL',
        categoryName: 'Medical',
        channelId: 'blood-donation',
        channelName: 'blood-donation',
        suggestedTags: ['BloodDonation', 'Hospital', 'Urgent', 'MedicalHelp'],
        confidence: 0.98,
        reasoning: 'Detected urgent blood donor appeal.',
      };
    }

    if (text.includes('camp') || text.includes('checkup') || text.includes('screening')) {
      return {
        categoryId: 'MEDICAL',
        categoryName: 'Medical',
        channelId: 'health-camps',
        channelName: 'health-camps',
        suggestedTags: ['HealthCamp', 'FreeCheckup', 'Medical'],
        confidence: 0.95,
        reasoning: 'Detected community health screening camp.',
      };
    }

    if (text.includes('internship') || text.includes('stipend') || text.includes('trainee')) {
      return {
        categoryId: 'EDUCATION',
        categoryName: 'Education',
        channelId: 'internships',
        channelName: 'internships',
        suggestedTags: ['Internship', 'Students', 'Software', 'Stipend'],
        confidence: 0.96,
        reasoning: 'Detected student internship posting.',
      };
    }

    if (text.includes('scholarship') || text.includes('grant') || text.includes('merit')) {
      return {
        categoryId: 'EDUCATION',
        categoryName: 'Education',
        channelId: 'scholarships',
        channelName: 'scholarships',
        suggestedTags: ['Scholarship', 'Education', 'MeritGrant'],
        confidence: 0.94,
        reasoning: 'Recognized scholarship announcement.',
      };
    }

    if (text.includes('road') || text.includes('pothole') || text.includes('traffic') || text.includes('blockage')) {
      return {
        categoryId: 'LOCAL_ISSUES',
        categoryName: 'Local Issues',
        channelId: 'roads',
        channelName: 'roads',
        suggestedTags: ['RoadBlockage', 'Traffic', 'Diversion', 'BMC'],
        confidence: 0.97,
        reasoning: 'Detected road condition / traffic issue.',
      };
    }

    if (text.includes('water') || text.includes('pipeline')) {
      return {
        categoryId: 'LOCAL_ISSUES',
        categoryName: 'Local Issues',
        channelId: 'water',
        channelName: 'water',
        suggestedTags: ['WaterSupply', 'PipelineRepair', 'BMC'],
        confidence: 0.95,
        reasoning: 'Detected water supply disruption.',
      };
    }

    if (text.includes('lost') || text.includes('misplaced') || text.includes('wallet')) {
      return {
        categoryId: 'LOST_FOUND',
        categoryName: 'Lost & Found',
        channelId: 'lost-items',
        channelName: 'lost-items',
        suggestedTags: ['LostItem', 'LostWallet', 'CommunityHelp'],
        confidence: 0.94,
        reasoning: 'Detected lost property notice.',
      };
    }

    if (text.includes('found') || text.includes('recovered')) {
      return {
        categoryId: 'LOST_FOUND',
        categoryName: 'Lost & Found',
        channelId: 'found-items',
        channelName: 'found-items',
        suggestedTags: ['FoundItem', 'ClaimBelonging'],
        confidence: 0.92,
        reasoning: 'Detected found property notice.',
      };
    }

    return {
      categoryId: 'GENERAL',
      categoryName: 'General',
      channelId: 'community-chat',
      channelName: 'community-forum',
      suggestedTags: ['General', 'CommunityNotice'],
      confidence: 0.8,
      reasoning: 'General community information notice.',
    };
  },
};
