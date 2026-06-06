// Fallback data and in-memory stores for PsyMetric offline/resilient mode
// Used when local or remote Supabase instances are not configured or offline.

export interface Option {
  id: string;
  option_letter: string;
  option_text: string;
  target_dimension: string;
  intensity_weight: number;
}

export interface Question {
  id: string;
  sequence_order: number;
  question_text: string;
  show_at_seconds?: number;
  timer_duration?: number;
  options: Option[];
}

export interface Scenario {
  id: string;
  title: string;
  video_url: string;
  target_age_group: string;
  is_active: boolean;
  is_backup: boolean;
  questions: Question[];
}

// Global in-memory stores for sessions and responses when database is unavailable
export const inMemoryProfiles: Record<string, any> = {
  'mock-user-id': {
    id: 'mock-user-id',
    full_name: 'Jane Doe',
    age_tier: 'College (18-21)',
    institution_type: 'College',
    is_admin: true
  }
};

export const inMemorySessions: Record<string, any> = {};
export const inMemoryResponses: Record<string, any[]> = {};

// Full 18 Scenario Matrix seeded in memory
export const fallbackScenarios: Scenario[] = [
  // 12 Baseline Scenarios
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Autonomous Drone Assembly Lab',
    video_url: '/videos/drone_assembly.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '10101010-1111-1111-1111-111111111111',
        sequence_order: 1,
        question_text: 'The autonomous drone motor calibration fails. How do you address the hardware malfunction?',
        options: [
          { id: '1a', option_letter: 'A', option_text: 'Manually disassemble the carbon-fiber shell and rewire the brushless motor leads directly.', target_dimension: 'Realistic', intensity_weight: 0.9 },
          { id: '1b', option_letter: 'B', option_text: 'Run an algorithmic frequency sweep to plot electromagnetic interference patterns on a chart.', target_dimension: 'Investigative', intensity_weight: 0.7 },
          { id: '1c', option_letter: 'C', option_text: 'Sketch a stylized conceptual body shape to redistribute wind resistance and drag aerodynamics.', target_dimension: 'Artistic', intensity_weight: 0.6 },
          { id: '1d', option_letter: 'D', option_text: 'Gather the flight testing crew to delegate safety monitoring tasks and reduce operational fatigue.', target_dimension: 'Social', intensity_weight: 0.5 }
        ]
      }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Bio-Genetics Computing Center',
    video_url: '/videos/genetics.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '20202020-2222-2222-2222-222222222222',
        sequence_order: 1,
        question_text: 'You isolate a novel gene sequence expressing an unknown protein. What is your scientific strategy?',
        options: [
          { id: '2a', option_letter: 'A', option_text: 'Conduct a statistical analysis of gene transcription rates using multi-variate statistical models.', target_dimension: 'Investigative', intensity_weight: 0.9 },
          { id: '2b', option_letter: 'B', option_text: 'Set up high-precision micro-pipette machinery to physically synthesize the gene strands in a petri dish.', target_dimension: 'Realistic', intensity_weight: 0.8 },
          { id: '2c', option_letter: 'C', option_text: 'Assemble an informative presentation to explain genetic health outcomes to the patient support community.', target_dimension: 'Social', intensity_weight: 0.8 },
          { id: '2d', option_letter: 'D', option_text: 'Establish a commercial testing pipeline and license the genomic discovery to pharmaceutical stakeholders.', target_dimension: 'Enterprising', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Mixed-Reality Creative Loft',
    video_url: '/videos/vr_art.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '30303030-3333-3333-3333-333333333333',
        sequence_order: 1,
        question_text: 'Your spatial Virtual Reality sculpture lacks emotional impact and depth. How do you redesign it?',
        options: [
          { id: '3a', option_letter: 'A', option_text: 'Sculpt abstract fluid textures and project glowing neon volumetric lighting to evoke emotional discomfort.', target_dimension: 'Artistic', intensity_weight: 0.95 },
          { id: '3b', option_letter: 'B', option_text: 'Consult cognitive response studies to map which shapes cause calming neurological sensations.', target_dimension: 'Investigative', intensity_weight: 0.75 },
          { id: '3c', option_letter: 'C', option_text: 'Lead a cooperative workshop where users can paint on the VR canvas simultaneously as collaborative expression.', target_dimension: 'Social', intensity_weight: 0.7 },
          { id: '3d', option_letter: 'D', option_text: 'Create an inventory system cataloging each asset by polygon count, asset size, and index folder name.', target_dimension: 'Conventional', intensity_weight: 0.8 }
        ]
      }
    ]
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Collaborative Study Incubator',
    video_url: '/videos/peer_mentor.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '40404040-4444-4444-4444-444444444444',
        sequence_order: 1,
        question_text: 'Two junior team members are locked in a heated disagreement over coding responsibilities. How do you arbitrate?',
        options: [
          { id: '4a', option_letter: 'A', option_text: 'Facilitate a structured active-listening session to let both parties voice feelings and repair collaboration.', target_dimension: 'Social', intensity_weight: 0.9 },
          { id: '4b', option_letter: 'B', option_text: 'Draft a formalized responsibility matrix with explicit, rigid rules governing daily project updates.', target_dimension: 'Conventional', intensity_weight: 0.8 },
          { id: '4c', option_letter: 'C', option_text: 'Persuade the team to pivot direction and launch a secondary micro-project where both can lead separate areas.', target_dimension: 'Enterprising', intensity_weight: 0.75 },
          { id: '4d', option_letter: 'D', option_text: 'Research statistical team-velocity models to show them objectively how conflict harms codebase throughput.', target_dimension: 'Investigative', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Venture Capital Pitch Deck Arena',
    video_url: '/videos/pitch_stage.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '50505050-5555-5555-5555-555555555555',
        sequence_order: 1,
        question_text: 'A venture capitalist challenges your startup business model during a live Q&A. What is your response?',
        options: [
          { id: '5a', option_letter: 'A', option_text: 'Deliver a charismatic, high-energy sales pitch detailing market growth metrics and potential buyout ROI.', target_dimension: 'Enterprising', intensity_weight: 0.9 },
          { id: '5b', option_letter: 'B', option_text: 'Analyze your unit economics on the fly and offer a highly technical margin calculation breakdown.', target_dimension: 'Investigative', intensity_weight: 0.8 },
          { id: '5c', option_letter: 'C', option_text: 'Tell an engaging emotional story about how your product helps disadvantaged local school students.', target_dimension: 'Social', intensity_weight: 0.75 },
          { id: '5d', option_letter: 'D', option_text: 'Demonstrate a physical prototype of the device to show how the mechanics actually function.', target_dimension: 'Realistic', intensity_weight: 0.6 }
        ]
      }
    ]
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    title: 'Systems Compliance & Financial Audit',
    video_url: '/videos/financial_audit.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '60606060-6666-6666-6666-666666666666',
        sequence_order: 1,
        question_text: 'You detect a recurring $15.50 transaction anomaly in the corporate ledger. What is your procedure?',
        options: [
          { id: '6a', option_letter: 'A', option_text: 'Cross-reference bank statements and receipts item-by-item to log the discrepancy in a tracking sheet.', target_dimension: 'Conventional', intensity_weight: 0.95 },
          { id: '6b', option_letter: 'B', option_text: 'Write an automated Python script to run isolation forest anomaly detection across all database records.', target_dimension: 'Investigative', intensity_weight: 0.8 },
          { id: '6c', option_letter: 'C', option_text: 'Confront the finance director directly and advocate for systemic transparency and budget restructuring.', target_dimension: 'Enterprising', intensity_weight: 0.8 },
          { id: '6d', option_letter: 'D', option_text: 'Design an intuitive infographic detailing corporate spending patterns to help employees file expenses better.', target_dimension: 'Artistic', intensity_weight: 0.65 }
        ]
      }
    ]
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    title: 'Heavy Robotics Manufacturing Line',
    video_url: '/videos/robotic_arm.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '70707070-7777-7777-7777-777777777777',
        sequence_order: 1,
        question_text: 'A robotic assembly arm on the factory floor keeps jamming due to torque limits. What is your approach?',
        options: [
          { id: '7a', option_letter: 'A', option_text: 'Manually adjust the mechanical gears and apply synthetic lubricant to the physical assembly joints.', target_dimension: 'Realistic', intensity_weight: 0.9 },
          { id: '7b', option_letter: 'B', option_text: 'Calculate the angular stress formulas and simulate load velocity changes in CAD software.', target_dimension: 'Investigative', intensity_weight: 0.85 },
          { id: '7c', option_letter: 'C', option_text: 'Establish a strict daily maintenance schedule spreadsheet logging operating hours and errors.', target_dimension: 'Conventional', intensity_weight: 0.75 },
          { id: '7d', option_letter: 'D', option_text: 'Gather the assembly workers to provide on-site safety coaching and support their shift transition.', target_dimension: 'Social', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    title: 'Quantum Cryptography Lab',
    video_url: '/videos/cryptography.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '80808080-8888-8888-8888-888888888888',
        sequence_order: 1,
        question_text: 'Your quantum key distribution protocol is suffering from photon polarization drift. How do you fix it?',
        options: [
          { id: '8a', option_letter: 'A', option_text: 'Develop an error-correcting algorithm to mathematically compensate for optical fiber dispersion.', target_dimension: 'Investigative', intensity_weight: 0.95 },
          { id: '8b', option_letter: 'B', option_text: 'Physically realign the laser transmitter lenses and optical polarization controllers on the workbench.', target_dimension: 'Realistic', intensity_weight: 0.8 },
          { id: '8c', option_letter: 'C', option_text: 'Organize an academic seminar explaining quantum security principles to undergraduate physics students.', target_dimension: 'Social', intensity_weight: 0.75 },
          { id: '8d', option_letter: 'D', option_text: 'Draft an intellectual property filing outline to legally protect the proprietary security protocol.', target_dimension: 'Conventional', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    title: 'Next-Gen UI/UX Interface Studio',
    video_url: '/videos/ui_design.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: '90909090-9999-9999-9999-999999999999',
        sequence_order: 1,
        question_text: 'The onboarding flow of your mobile app has a 45% drop-off rate. How do you redesign it?',
        options: [
          { id: '9a', option_letter: 'A', option_text: 'Design fluid micro-interactions, dark glassmorphism screens, and animated transitions to enchant users.', target_dimension: 'Artistic', intensity_weight: 0.9 },
          { id: '9b', option_letter: 'B', option_text: 'Conduct user interviews to understand their personal pain points, feelings, and frustrations.', target_dimension: 'Social', intensity_weight: 0.8 },
          { id: '9c', option_letter: 'C', option_text: 'Review user tracking telemetry databases to calculate the exact average milliseconds spent per screen.', target_dimension: 'Investigative', intensity_weight: 0.75 },
          { id: '9d', option_letter: 'D', option_text: 'Pitch a marketing rebrand to the board to position the app as the ultimate high-status productivity tool.', target_dimension: 'Enterprising', intensity_weight: 0.85 }
        ]
      }
    ]
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Peer Support & Counseling Space',
    video_url: '/videos/crisis_counsel.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: 'a0a0a0a0-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        sequence_order: 1,
        question_text: 'A colleague shows clear signs of extreme academic burnout and is withdrawing from the team. How do you act?',
        options: [
          { id: 'aa', option_letter: 'A', option_text: 'Arrange a private coffee chat to offer emotional support, listen without judgment, and share coping strategies.', target_dimension: 'Social', intensity_weight: 0.95 },
          { id: 'ab', option_letter: 'B', option_text: 'Help them organize their tasks into a clean, prioritized weekly checklist spreadsheet to clear their mind.', target_dimension: 'Conventional', intensity_weight: 0.8 },
          { id: 'ac', option_letter: 'C', option_text: 'Brainstorm and design a visual mental-health wellness guide to distribute around the shared workspace.', target_dimension: 'Artistic', intensity_weight: 0.75 },
          { id: 'ad', option_letter: 'D', option_text: 'Negotiate with the program director on their behalf to secure a formal extension and workload reduction.', target_dimension: 'Enterprising', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'Product Growth & Expansion Deck',
    video_url: '/videos/product_growth.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: 'b0b0b0b0-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        sequence_order: 1,
        question_text: 'Your competitor matches your product features. How do you regain market leadership?',
        options: [
          { id: 'ba', option_letter: 'A', option_text: 'Formulate an aggressive market expansion plan, acquire a niche startup, and capture new user bases.', target_dimension: 'Enterprising', intensity_weight: 0.95 },
          { id: 'bb', option_letter: 'B', option_text: 'Audit your internal product delivery pipelines to eliminate operational waste and optimize server budgets.', target_dimension: 'Conventional', intensity_weight: 0.8 },
          { id: 'bc', option_letter: 'C', option_text: 'Craft a high-concept marketing narrative centered on artistic integrity and bespoke visual design.', target_dimension: 'Artistic', intensity_weight: 0.75 },
          { id: 'bd', option_letter: 'D', option_text: 'Establish user feedback focus groups to build deep community connections and empathy channels.', target_dimension: 'Social', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    title: 'Large-Scale Database Migration Terminal',
    video_url: '/videos/database_migrator.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: false,
    questions: [
      {
        id: 'c0c0c0c0-cccc-cccc-cccc-cccccccccccc',
        sequence_order: 1,
        question_text: 'You must migrate 10 million relational rows to a new database schema. What is your operational strategy?',
        options: [
          { id: 'ca', option_letter: 'A', option_text: 'Write a strict step-by-step migration script with rollbacks and verify checksum counts for every single record.', target_dimension: 'Conventional', intensity_weight: 0.95 },
          { id: 'cb', option_letter: 'B', option_text: 'Design a visual database schema graph mapping entities and tables to present to engineering leads.', target_dimension: 'Artistic', intensity_weight: 0.6 },
          { id: 'cc', option_letter: 'C', option_text: 'Analyze the index structures and write query optimizations to minimize execution time to seconds.', target_dimension: 'Investigative', intensity_weight: 0.85 },
          { id: 'cd', option_letter: 'D', option_text: 'Set up physical redundant storage arrays and network switches on the server rack to handle raw data transfer.', target_dimension: 'Realistic', intensity_weight: 0.7 }
        ]
      }
    ]
  },

  // 6 Backup Scenarios (is_backup = true)
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    title: 'IoT Home System Setup',
    video_url: '/videos/iot_wiring.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: true,
    questions: [
      {
        id: 'd0d0d0d0-dddd-dddd-dddd-dddddddddddd',
        sequence_order: 1,
        question_text: 'You are calibrating a network of physical environmental sensors in a smart home. What is your focus?',
        options: [
          { id: 'da', option_letter: 'A', option_text: 'Physically solder the sensor pins and route electrical conduits cleanly through the wall fixtures.', target_dimension: 'Realistic', intensity_weight: 0.9 },
          { id: 'db', option_letter: 'B', option_text: 'Formulate calibration algorithms to filter noise and model humidity trends mathematically.', target_dimension: 'Investigative', intensity_weight: 0.8 },
          { id: 'dc', option_letter: 'C', option_text: 'Document sensor serial numbers, locations, and installation dates in a tracking database.', target_dimension: 'Conventional', intensity_weight: 0.85 },
          { id: 'dd', option_letter: 'D', option_text: 'Teach local homeowners how to interact with and adjust their smart appliances.', target_dimension: 'Social', intensity_weight: 0.6 }
        ]
      }
    ]
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    title: 'Neural Network Training Command Line',
    video_url: '/videos/model_training.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: true,
    questions: [
      {
        id: 'e0e0e0e0-eeee-eeee-eeee-eeeeeeeeeeee',
        sequence_order: 1,
        question_text: 'A deep learning image classifier is suffering from high validation variance (overfitting). How do you resolve this?',
        options: [
          { id: 'ea', option_letter: 'A', option_text: 'Apply mathematical regularization techniques (L2 penalty, dropout) and audit loss equations.', target_dimension: 'Investigative', intensity_weight: 0.95 },
          { id: 'eb', option_letter: 'B', option_text: 'Log validation metrics, epoch numbers, and hyperparameters systematically in a spreadsheet tracker.', target_dimension: 'Conventional', intensity_weight: 0.8 },
          { id: 'ec', option_letter: 'C', option_text: 'Create a visual data-augmentation pipeline to flip, crop, and recolor input training images.', target_dimension: 'Artistic', intensity_weight: 0.7 },
          { id: 'ed', option_letter: 'D', option_text: 'Procure additional high-performance GPU server rigs, physically mounting them in the server chassis.', target_dimension: 'Realistic', intensity_weight: 0.6 }
        ]
      }
    ]
  },
  {
    id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    title: 'Spatial Sound Design & Synthesizer Studio',
    video_url: '/videos/audio_synth.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: true,
    questions: [
      {
        id: 'f0f0f0f0-ffff-ffff-ffff-ffffffffffff',
        sequence_order: 1,
        question_text: 'A sound effect for a science-fiction spacecraft propulsion engine sounds too generic. What is your redesign?',
        options: [
          { id: 'fa', option_letter: 'A', option_text: 'Synthesize original waves using custom frequency modulation, adding granular echoes for an alien atmosphere.', target_dimension: 'Artistic', intensity_weight: 0.95 },
          { id: 'fb', option_letter: 'B', option_text: 'Write code using audio APIs to mathematically filter and normalize decibel thresholds dynamically.', target_dimension: 'Investigative', intensity_weight: 0.8 },
          { id: 'fc', option_letter: 'C', option_text: 'Connect physical patch cords on an analog modular synthesizer dashboard, turning dials to shape voltage.', target_dimension: 'Realistic', intensity_weight: 0.85 },
          { id: 'fd', option_letter: 'D', option_text: 'Catalog the audio sample rate, bit depth, folder structure, and license files for standard compliance.', target_dimension: 'Conventional', intensity_weight: 0.75 }
        ]
      }
    ]
  },
  {
    id: '00000000-0000-0000-0000-000000000000',
    title: 'Disaster Relief Coordination Hub',
    video_url: '/videos/community_outreach.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: true,
    questions: [
      {
        id: '00000000-0000-0000-0000-000000000000',
        sequence_order: 1,
        question_text: 'A major storm hits the city, and local shelters need immediate supply coordination. What do you do?',
        options: [
          { id: '0a', option_letter: 'A', option_text: 'Coordinate volunteer teams, delegate relief assignments, and comfort displaced community families.', target_dimension: 'Social', intensity_weight: 0.95 },
          { id: '0b', option_letter: 'B', option_text: 'Establish a centralized logistics sheet tracking water crates, blankets, and battery inventory.', target_dimension: 'Conventional', intensity_weight: 0.85 },
          { id: '0c', option_letter: 'C', option_text: 'Take charge of the emergency council, pitching resource-sharing strategies to local government chiefs.', target_dimension: 'Enterprising', intensity_weight: 0.8 },
          { id: '0d', option_letter: 'D', option_text: 'Physically operate supply transport trucks and assemble structural canvas tents in the shelter courtyard.', target_dimension: 'Realistic', intensity_weight: 0.7 }
        ]
      }
    ]
  },
  {
    id: '11111111-2222-3333-4444-555555555555',
    title: 'Mergers & Acquisitions Negotiation Deck',
    video_url: '/videos/corporate_merger.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: true,
    questions: [
      {
        id: '10101010-2222-3333-4444-555555555555',
        sequence_order: 1,
        question_text: 'A joint-venture negotiation is stalling because the partner refuses to share distribution channels. How do you proceed?',
        options: [
          { id: '17a', option_letter: 'A', option_text: 'Present a high-reward strategic proposal detailing mutual revenue share and convince the partner board.', target_dimension: 'Enterprising', intensity_weight: 0.95 },
          { id: '17b', option_letter: 'B', option_text: 'Conduct a competitive market analysis to calculate the financial impact of building a proprietary channel.', target_dimension: 'Investigative', intensity_weight: 0.8 },
          { id: '17c', option_letter: 'C', option_text: 'Draft a comprehensive legal contract detailing access clauses, liability boundaries, and filing rules.', target_dimension: 'Conventional', intensity_weight: 0.85 },
          { id: '17d', option_letter: 'D', option_text: 'Design a series of visually compelling pitch slides explaining the partnership vision for press release.', target_dimension: 'Artistic', intensity_weight: 0.65 }
        ]
      }
    ]
  },
  {
    id: '22222222-3333-4444-5555-666666666666',
    title: 'Security & Compliance Audit Dashboard',
    video_url: '/videos/compliance_audit.mp4',
    target_age_group: 'All',
    is_active: true,
    is_backup: true,
    questions: [
      {
        id: '20202020-3333-4444-5555-666666666666',
        sequence_order: 1,
        question_text: 'You are auditing a company for ISO-27001 data security compliance. What is your audit methodology?',
        options: [
          { id: '18a', option_letter: 'A', option_text: 'Review policy logs and verify physical security keycards and encryption key rotation spreadsheets.', target_dimension: 'Conventional', intensity_weight: 0.95 },
          { id: '18b', option_letter: 'B', option_text: 'Perform penetration testing and trace network packets to check for cryptographic vulnerabilities.', target_dimension: 'Investigative', intensity_weight: 0.85 },
          { id: '18c', option_letter: 'C', option_text: 'Advocate for security awareness training and host workshops to support workers in changing their habits.', target_dimension: 'Social', intensity_weight: 0.7 },
          { id: '18d', option_letter: 'D', option_text: 'Pitch a cybersecurity vendor agreement to senior management to outsource compliance liabilities.', target_dimension: 'Enterprising', intensity_weight: 0.75 }
        ]
      }
    ]
  }
];

// Dynamically generate Set 2 and Set 3 questions for any scenario that has only 1 question.
// This guarantees that all 18 fallback scenarios have exactly 3 sets of questions for progress tracking.
fallbackScenarios.forEach(scen => {
  if (scen.questions && scen.questions.length === 1) {
    const q1 = scen.questions[0];
    
    // Set 2 Question
    const q2: Question = {
      id: q1.id + '_set2',
      sequence_order: 2,
      question_text: q1.question_text.replace(/\?$/, ' (Alternate Scenario)?') || `Alternate assessment scenario for ${scen.title}?`,
      show_at_seconds: (q1.show_at_seconds || 5) + 3,
      options: q1.options.map(opt => ({
        ...opt,
        id: opt.id + '_set2',
        option_text: opt.option_text.replace(/\.$/, ' (Refined method).')
      }))
    };

    // Set 3 Question
    const q3: Question = {
      id: q1.id + '_set3',
      sequence_order: 3,
      question_text: q1.question_text.replace(/\?$/, ' (Advanced Challenge)?') || `Advanced operational scenario for ${scen.title}?`,
      show_at_seconds: (q1.show_at_seconds || 5) + 6,
      options: q1.options.map(opt => ({
        ...opt,
        id: opt.id + '_set3',
        option_text: opt.option_text.replace(/\.$/, ' (Strategic expansion).')
      }))
    };

    scen.questions.push(q2, q3);
  }
});

