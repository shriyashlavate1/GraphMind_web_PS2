/**
 * CivicPulse - Initial Community Dataset
 * Pure Plain JavaScript Data Store (Matching UI Mockup)
 */

const INITIAL_CATEGORIES = [
  {
    id: 'GENERAL',
    name: 'GENERAL',
    icon: '📢',
    channels: [
      { id: 'announcements', name: 'announcements', categoryId: 'GENERAL', description: 'Official municipal circulars, public notices, and verified announcements' },
      { id: 'community-forum', name: 'community-forum', categoryId: 'GENERAL', description: 'Open discussion forum for local neighbourhood affairs and queries' },
    ],
  },
  {
    id: 'EDUCATION',
    name: 'EDUCATION',
    icon: '🎓',
    channels: [
      { id: 'internships', name: 'internships', categoryId: 'EDUCATION', description: 'Internship opportunities, placement updates and career-related information.' },
      { id: 'scholarships', name: 'scholarships', categoryId: 'EDUCATION', description: 'Government, merit-based, and need-based scholarship grants' },
      { id: 'workshops', name: 'workshops', categoryId: 'EDUCATION', description: 'Skill development bootcamps, technical seminars, and masterclasses' },
      { id: 'admissions', name: 'admissions', categoryId: 'EDUCATION', description: 'College entry dates, cutoffs, and counseling notifications' },
    ],
  },
  {
    id: 'MEDICAL',
    name: 'MEDICAL',
    icon: '➕',
    channels: [
      { id: 'medical-help', name: 'medical-help', categoryId: 'MEDICAL', description: 'Doctor availability, specialized care assistance, and pharmacy stocks' },
      { id: 'blood-donation', name: 'blood-donation', categoryId: 'MEDICAL', description: 'Urgent blood requirements and nearby donor registry appeals' },
      { id: 'health-camps', name: 'health-camps', categoryId: 'MEDICAL', description: 'Free medical checkups, vaccination drives, and eye/dental clinics' },
    ],
  },
  {
    id: 'LOCAL_ISSUES',
    name: 'LOCAL ISSUES',
    icon: '⚠️',
    channels: [
      { id: 'roads', name: 'roads', categoryId: 'LOCAL_ISSUES', description: 'Potholes, road closures, diversions, and traffic disruptions' },
      { id: 'water', name: 'water', categoryId: 'LOCAL_ISSUES', description: 'Water pipeline maintenance, cutoffs, tanker schedules, and purity alerts' },
      { id: 'electricity', name: 'electricity', categoryId: 'LOCAL_ISSUES', description: 'Grid maintenance outages, transformer repairs, and voltage alerts' },
      { id: 'public-services', name: 'public-services', categoryId: 'LOCAL_ISSUES', description: 'Garbage disposal, park upkeep, streetlights, and sanitation' },
    ],
  },
  {
    id: 'LOST_FOUND',
    name: 'LOST & FOUND',
    icon: '🔍',
    channels: [
      { id: 'lost-items', name: 'lost-items', categoryId: 'LOST_FOUND', description: 'Report misplaced personal effects, documents, electronics, or pets' },
      { id: 'found-items', name: 'found-items', categoryId: 'LOST_FOUND', description: 'Recovered belongings waiting for rightful owners at local checkpoints' },
    ],
  },
  {
    id: 'EVENTS',
    name: 'EVENTS',
    icon: '📅',
    channels: [
      { id: 'local-events', name: 'local-events', categoryId: 'EVENTS', description: 'Neighborhood cultural festivals, farmers markets, and town halls' },
      { id: 'college-events', name: 'college-events', categoryId: 'EVENTS', description: 'Inter-college symposiums, tech fests, sports meets, and cultural nights' },
    ],
  },
];

const INITIAL_POSTS = [
  {
    id: 'post-101',
    title: 'Summer Software Engineering Internship (React / Node.js)',
    description:
      'XYZ Technologies is offering 10 paid internship positions for pre-final and final year engineering students. Roles involve full-stack product engineering, building civic tech software. Monthly stipend of ₹28,000 + certificate.',
    categoryId: 'EDUCATION',
    channelId: 'internships',
    channelName: 'internships',
    author: {
      id: 'usr_ananya',
      name: 'Ananya Mehta',
      initial: 'A',
      color: 'purple',
      role: 'Student',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    },
    createdAt: '2026-10-02T10:24:00.000Z',
    updatedAt: '2026-10-02T10:24:00.000Z',
    formattedDate: '2 Oct 2026, 10:24 AM',
    status: 'Active',
    deadline: '2026-10-05T18:00:00.000Z',
    deadlineLabel: 'Deadline: 5 Oct 2026',
    location: 'BKC, Mumbai',
    categoryPath: 'Education > Internships',
    distanceKm: 4.2,
    tags: ['internship', 'software', 'students'],
    images: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    ],
    validation: {
      useful: 24,
      incorrect: 2,
      userVote: 'useful',
    },
    updates: [
      {
        id: 'upd_101_1',
        timestamp: '2026-10-02T10:24:00.000Z',
        authorName: 'Ananya Mehta',
        authorRole: 'Student',
        content: 'Applications are now open on the portal.',
      },
    ],
    comments: [
      {
        id: 'com_101_1',
        authorName: 'Kunal Verma',
        authorRole: 'Student',
        timestamp: '2026-10-02T10:30:00.000Z',
        content: 'Is this open for pre-final year students as well?',
        likes: 3,
      },
      {
        id: 'com_101_2',
        authorName: 'Ananya Mehta',
        authorRole: 'Student',
        timestamp: '2026-10-02T10:35:00.000Z',
        content: 'Yes! Both 3rd and 4th year students can apply.',
        likes: 5,
      },
    ],
    reports: [],
  },
  {
    id: 'post-102',
    title: 'Major Road Blockage & Water Pipe Repair on S.V. Road',
    description:
      'Due to an ongoing water pipe repair, the left lane on S.V. Road near Andheri Station is currently blocked. Traffic is slow, and commuters are advised to take the alternate route via Link Road.',
    categoryId: 'LOCAL_ISSUES',
    channelId: 'roads',
    channelName: 'roads',
    author: {
      id: 'usr_rohit',
      name: 'Rohit Verma',
      initial: 'R',
      color: 'blue',
      role: 'Resident',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    },
    createdAt: '2026-10-01T18:15:00.000Z',
    updatedAt: '2026-10-01T18:15:00.000Z',
    formattedDate: '1 Oct 2026, 6:15 PM',
    status: 'Pending',
    expectedResolution: '2026-10-02T20:00:00.000Z',
    resolutionLabel: 'Expected resolution: Today, 8:00 PM',
    location: 'Andheri West, Mumbai',
    categoryPath: 'Local Issues > Roads',
    distanceKm: 0.8,
    tags: ['road'],
    images: [
      'https://images.unsplash.com/photo-1578991624414-276ef23a534f?w=600&auto=format&fit=crop&q=80',
    ],
    validation: {
      useful: 18,
      incorrect: 1,
      userVote: null,
    },
    updates: [
      {
        id: 'upd_102_1',
        timestamp: '2026-10-01T18:15:00.000Z',
        authorName: 'Rohit Verma',
        authorRole: 'Resident',
        content: 'Traffic police have established a single-lane diversion.',
      },
    ],
    comments: [
      {
        id: 'com_102_1',
        authorName: 'Sunita Rao',
        authorRole: 'Resident',
        timestamp: '2026-10-01T19:00:00.000Z',
        content: 'Avoid SV road junction between 5 PM and 8 PM.',
        likes: 6,
      },
    ],
    reports: [],
  },
  {
    id: 'post-103',
    title: 'Free Community Eye, Dental & Diabetes Health Camp',
    description:
      'A free health checkup camp organized by Andheri Municipal Hospital. Services include eye checkup, dental consultation, and diabetes screening. Open for all residents.',
    categoryId: 'MEDICAL',
    channelId: 'health-camps',
    channelName: 'health-camps',
    author: {
      id: 'usr_priya_nair',
      name: 'Priya Nair',
      initial: 'P',
      color: 'green',
      role: 'Volunteer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    },
    createdAt: '2026-10-01T15:40:00.000Z',
    updatedAt: '2026-10-01T15:40:00.000Z',
    formattedDate: '1 Oct 2026, 3:40 PM',
    status: 'Resolved',
    deadline: '2026-10-10T17:00:00.000Z',
    deadlineLabel: 'Date: 10 Oct 2026',
    location: 'Andheri West, Mumbai',
    categoryPath: 'Medical > Health Camps',
    distanceKm: 2.3,
    tags: ['health', 'community'],
    images: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    ],
    validation: {
      useful: 32,
      incorrect: 0,
      userVote: 'useful',
    },
    updates: [
      {
        id: 'upd_103_1',
        timestamp: '2026-10-01T15:40:00.000Z',
        authorName: 'Priya Nair',
        authorRole: 'Volunteer',
        content: 'Doctors and volunteers registration completed. Health camp scheduled.',
      },
    ],
    comments: [
      {
        id: 'com_103_1',
        authorName: 'Ramesh G.',
        authorRole: 'Resident',
        timestamp: '2026-10-01T16:00:00.000Z',
        content: 'Is prior registration mandatory?',
        likes: 4,
      },
    ],
    reports: [],
  },
];
