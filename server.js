import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// LLM API Config (Kept strictly on backend!)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const isLLMConfigured = Boolean(GEMINI_API_KEY || OPENAI_API_KEY);

console.log(`[CivicPulse Backend] Moderation Engine: ${isLLMConfigured ? 'Live LLM API Connected' : 'Clearly Labeled Mock Moderation Engine'}`);

// Config Status Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    llmConfigured: isLLMConfigured,
    mode: isLLMConfigured ? 'live_llm' : 'mock_moderation',
    engineName: GEMINI_API_KEY
      ? 'Google Gemini API (Backend Secured)'
      : OPENAI_API_KEY
      ? 'OpenAI API (Backend Secured)'
      : 'Local Mock Moderation Engine (Configured in server.js)',
  });
});

// 1. Secure Moderation Endpoint
app.post('/api/moderate', async (req, res) => {
  const { title = '', description = '', category = '', channel = '' } = req.body;
  const content = `${title}\n\n${description}`.trim();

  if (!content) {
    return res.status(400).json({ error: 'Title and description are required for moderation.' });
  }

  // If Gemini API Key is configured on the backend
  if (GEMINI_API_KEY) {
    try {
      const prompt = `You are a strict civic safety and community moderation engine for a local public information sharing platform.
Analyze this user submission:
Category: ${category}
Channel: #${channel}
Content:
"""
${content}
"""

Evaluate for:
1. Financial scams, fraudulent recruitment, fake UPI fee requests, or phishing links.
2. Hate speech, targeted harassment, threats, or vulgarity.
3. Severe misinformation or panic-inducing unverified disaster claims.
4. Spam or irrelevant commercial promotion.

Respond strictly with valid JSON only in this exact format:
{
  "score": "SAFE" | "NEEDS_REVIEW" | "BLOCKED",
  "confidence": 0.95,
  "flags": ["SPAM", "FINANCIAL_SOLICITATION", etc],
  "reasons": ["Short explanation bullet point 1", "..."],
  "recommendation": "Recommendation for user or community moderators"
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          return res.json({
            ...parsed,
            isMock: false,
            engine: 'Gemini LLM (Backend Secured)',
          });
        }
      }
    } catch (err) {
      console.error('[CivicPulse Backend] Live LLM call failed, falling back to mock engine:', err);
    }
  }

  // Clearly labeled fallback / Local Mock Moderation Engine
  const textLower = content.toLowerCase();
  const flags = [];
  const reasons = [];

  if (
    (textLower.includes('pay') || textLower.includes('fee') || textLower.includes('deposit') || textLower.includes('send money') || textLower.includes('1500') || textLower.includes('processing')) &&
    (textLower.includes('upi') || textLower.includes('gpay') || textLower.includes('phonepe') || textLower.includes('qr code') || textLower.includes('wire') || textLower.includes('guaranteed'))
  ) {
    flags.push('FINANCIAL_SOLICITATION');
    reasons.push('Submission mentions direct financial transfer or processing fee via personal payment handles.');
  }

  if (
    textLower.includes('t.me/') ||
    textLower.includes('wa.me/') ||
    textLower.includes('bit.ly/') ||
    textLower.includes('earnmoney') ||
    textLower.includes('crypto profits') ||
    textLower.includes('win lottery')
  ) {
    flags.push('SPAM_PROMOTION');
    reasons.push('Contains shortened promotional URLs or unverified external link patterns.');
  }

  const abusiveTerms = ['hate', 'kill', 'terrorist', 'fraudster bastard', 'idiot fool'];
  if (abusiveTerms.some((t) => textLower.includes(t))) {
    flags.push('HARASSMENT_OR_PROFANITY');
    reasons.push('Detected hostile, threatening, or derogatory phrasing.');
  }

  if (textLower.includes('bomb') || textLower.includes('riot in progress') || textLower.includes('stampede happening')) {
    flags.push('CRITICAL_EMERGENCY_CLAIM');
    reasons.push('Critical civic crisis claim requires moderator verification before wide broadcast.');
  }

  let score = 'SAFE';
  let recommendation = 'Content is clear, verified, and safe for immediate community publication.';

  if (flags.includes('HARASSMENT_OR_PROFANITY')) {
    score = 'BLOCKED';
    recommendation = 'Content violates community safety guidelines. Please remove prohibited language.';
  } else if (flags.length > 0) {
    score = 'NEEDS_REVIEW';
    recommendation = 'Post flagged for potential financial solicitation or promotional links. Flagged for civic moderator verification.';
  }

  return res.json({
    score,
    confidence: 0.96,
    flags,
    reasons: reasons.length > 0 ? reasons : ['No prohibited keywords, financial solicitations, or malicious links detected.'],
    recommendation,
    isMock: true,
    engine: 'Mock Moderation Mode (Safe Local Fallback)',
  });
});

// 2. Classification & Tag Suggestion Endpoint
app.post('/api/classify', (req, res) => {
  const { title = '', description = '' } = req.body;
  const text = (title + ' ' + description).toLowerCase();

  let categoryId = 'GENERAL';
  let categoryName = 'General';
  let channelId = 'community-chat';
  let channelName = 'community-forum';
  let suggestedTags = ['General', 'CommunityNotice'];
  let confidence = 0.85;
  let reasoning = 'General community information.';

  if (text.includes('blood') || text.includes('donor') || text.includes('o-ve') || text.includes('platelet')) {
    categoryId = 'MEDICAL';
    categoryName = 'Medical';
    channelId = 'blood-donation';
    channelName = 'blood-donation';
    suggestedTags = ['BloodDonation', 'Urgent', 'Hospital', 'MedicalHelp'];
    confidence = 0.98;
    reasoning = 'Detected urgent blood requirement appeal.';
  } else if (text.includes('camp') || text.includes('checkup') || text.includes('screening') || text.includes('clinic')) {
    categoryId = 'MEDICAL';
    categoryName = 'Medical';
    channelId = 'health-camps';
    channelName = 'health-camps';
    suggestedTags = ['HealthCamp', 'FreeCheckup', 'Medical'];
    confidence = 0.95;
    reasoning = 'Detected community healthcare screening camp.';
  } else if (text.includes('internship') || text.includes('stipend') || text.includes('trainee') || text.includes('software intern')) {
    categoryId = 'EDUCATION';
    categoryName = 'Education';
    channelId = 'internships';
    channelName = 'internships';
    suggestedTags = ['Internship', 'Students', 'Software', 'Stipend', 'Mumbai'];
    confidence = 0.96;
    reasoning = 'Detected student internship opportunity.';
  } else if (text.includes('scholarship') || text.includes('grant') || text.includes('financial aid') || text.includes('merit')) {
    categoryId = 'EDUCATION';
    categoryName = 'Education';
    channelId = 'scholarships';
    channelName = 'scholarships';
    suggestedTags = ['Scholarship', 'Education', 'MeritGrant', 'FinancialAid'];
    confidence = 0.94;
    reasoning = 'Detected academic scholarship notification.';
  } else if (text.includes('road') || text.includes('pothole') || text.includes('traffic') || text.includes('blockage') || text.includes('diversion')) {
    categoryId = 'LOCAL_ISSUES';
    categoryName = 'Local Issues';
    channelId = 'roads';
    channelName = 'roads';
    suggestedTags = ['RoadBlockage', 'Traffic', 'Diversion', 'BMC', 'LocalIssue'];
    confidence = 0.97;
    reasoning = 'Detected road condition and traffic diversion notice.';
  } else if (text.includes('water') || text.includes('pipeline') || text.includes('tanker')) {
    categoryId = 'LOCAL_ISSUES';
    categoryName = 'Local Issues';
    channelId = 'water';
    channelName = 'water';
    suggestedTags = ['WaterSupply', 'PipelineRepair', 'BMC'];
    confidence = 0.95;
    reasoning = 'Detected municipal water supply disruption report.';
  } else if (text.includes('lost') || text.includes('misplaced') || text.includes('wallet') || text.includes('keys')) {
    categoryId = 'LOST_FOUND';
    categoryName = 'Lost & Found';
    channelId = 'lost-items';
    channelName = 'lost-items';
    suggestedTags = ['LostItem', 'CommunityAlert', 'LostWallet'];
    confidence = 0.93;
    reasoning = 'Detected misplaced personal belongings notice.';
  } else if (text.includes('found') || text.includes('recovered') || text.includes('id card')) {
    categoryId = 'LOST_FOUND';
    categoryName = 'Lost & Found';
    channelId = 'found-items';
    channelName = 'found-items';
    suggestedTags = ['FoundItem', 'ClaimBelonging'];
    confidence = 0.92;
    reasoning = 'Detected recovered lost item report.';
  } else if (text.includes('hackathon') || text.includes('fest') || text.includes('symposium') || text.includes('event')) {
    categoryId = 'EVENTS';
    categoryName = 'Events';
    channelId = 'college-events';
    channelName = 'college-events';
    suggestedTags = ['CollegeFest', 'Hackathon', 'Tektonix', 'Students'];
    confidence = 0.95;
    reasoning = 'Detected inter-college tech event or festival.';
  }

  res.json({
    categoryId,
    categoryName,
    channelId,
    channelName,
    suggestedTags,
    confidence,
    reasoning,
  });
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` CivicPulse Platform running at http://localhost:${PORT}`);
  console.log(` Pure HTML, CSS, Plain JavaScript with Secure Node API `);
  console.log(`=======================================================`);
});
