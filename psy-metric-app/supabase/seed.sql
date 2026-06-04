-- PsyMetric Enterprise Platform Seed Script
-- Created at 2026-06-04

-- Clean up existing data first
truncate table public.candidate_responses cascade;
truncate table public.assessment_sessions cascade;
truncate table public.options cascade;
truncate table public.questions cascade;
truncate table public.scenarios cascade;

-- Seed Scenarios (12 Baseline Scenarios, 6 Backup Scenarios)
-- UUID mappings for scenarios:
-- R: drone_assembly, iot_wiring, robotic_arm (backup)
-- I: genetics, cryptography, model_training (backup)
-- A: vr_art, ui_design, audio_synth (backup)
-- S: peer_mentor, crisis_counsel, community_outreach (backup)
-- E: pitch_stage, product_growth, corporate_merger (backup)
-- C: financial_audit, database_migrator, compliance_audit (backup)

-- BASELINE SCENARIOS (is_backup = false)

-- Scenario 1: Realistic - Autonomous Drone Assembly
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '11111111-1111-1111-1111-111111111111',
  'Autonomous Drone Assembly Lab',
  '/videos/drone_assembly.mp4',
  'All',
  true,
  false
);

-- Scenario 2: Investigative - Bio-Genetic Sequencing
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '22222222-2222-2222-2222-222222222222',
  'Bio-Genetics Computing Center',
  '/videos/genetics.mp4',
  'All',
  true,
  false
);

-- Scenario 3: Artistic - Virtual Reality Art Canvas
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '33333333-3333-3333-3333-333333333333',
  'Mixed-Reality Creative Loft',
  '/videos/vr_art.mp4',
  'All',
  true,
  false
);

-- Scenario 4: Social - Peer Mentorship Workspace
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '44444444-4444-4444-4444-444444444444',
  'Collaborative Study Incubator',
  '/videos/peer_mentor.mp4',
  'All',
  true,
  false
);

-- Scenario 5: Enterprising - Startup Pitch Stage
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '55555555-5555-5555-5555-555555555555',
  'Venture Capital Pitch Deck Arena',
  '/videos/pitch_stage.mp4',
  'All',
  true,
  false
);

-- Scenario 6: Conventional - Financial Audit Office
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '66666666-6666-6666-6666-666666666666',
  'Systems Compliance & Financial Audit',
  '/videos/financial_audit.mp4',
  'All',
  true,
  false
);

-- Scenario 7: Realistic - Heavy Industrial Robotic Arm Maintenance
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '77777777-7777-7777-7777-777777777777',
  'Heavy Robotics Manufacturing Line',
  '/videos/robotic_arm.mp4',
  'All',
  true,
  false
);

-- Scenario 8: Investigative - Quantum Cryptography Laboratory
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '88888888-8888-8888-8888-888888888888',
  'Quantum Cryptography Lab',
  '/videos/cryptography.mp4',
  'All',
  true,
  false
);

-- Scenario 9: Artistic - Creative UI/UX Design Hub
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '99999999-9999-9999-9999-999999999999',
  'Next-Gen UI/UX Interface Studio',
  '/videos/ui_design.mp4',
  'All',
  true,
  false
);

-- Scenario 10: Social - Crisis Counseling Circle
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Peer Support & Counseling Space',
  '/videos/crisis_counsel.mp4',
  'All',
  true,
  false
);

-- Scenario 11: Enterprising - Product Growth Boardroom
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Product Growth & Expansion Deck',
  '/videos/product_growth.mp4',
  'All',
  true,
  false
);

-- Scenario 12: Conventional - System Database Migrator
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Large-Scale Database Migration Terminal',
  '/videos/database_migrator.mp4',
  'All',
  true,
  false
);


-- BACKUP SCENARIOS (is_backup = true)

-- Scenario 13: Realistic Backup - IoT Smarthome Calibration
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'IoT Home System Setup',
  '/videos/iot_wiring.mp4',
  'All',
  true,
  true
);

-- Scenario 14: Investigative Backup - Deep Learning Model Trainer
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Neural Network Training Command Line',
  '/videos/model_training.mp4',
  'All',
  true,
  true
);

-- Scenario 15: Artistic Backup - Game Audio Synthesizer
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Spatial Sound Design & Synthesizer Studio',
  '/videos/audio_synth.mp4',
  'All',
  true,
  true
);

-- Scenario 16: Social Backup - Community Support Outreach
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '00000000-0000-0000-0000-000000000000',
  'Disaster Relief Coordination Hub',
  '/videos/community_outreach.mp4',
  'All',
  true,
  true
);

-- Scenario 17: Enterprising Backup - Corporate Merger Room
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '11111111-2222-3333-4444-555555555555',
  'Mergers & Acquisitions Negotiation Deck',
  '/videos/corporate_merger.mp4',
  'All',
  true,
  true
);

-- Scenario 18: Conventional Backup - Compliance Audit Dashboard
insert into public.scenarios (id, title, video_url, target_age_group, is_active, is_backup)
values (
  '22222222-3333-4444-5555-666666666666',
  'Security & Compliance Audit Dashboard',
  '/videos/compliance_audit.mp4',
  'All',
  true,
  true
);


-- Seed Questions and Option Choices
-- For each scenario, we insert 1 question, and 4 option choices (A, B, C, D).
-- Each option choice maps to a RIASEC dimension and intensity weight.

-- Question 1 (Drone Assembly)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('10101010-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 'The autonomous drone motor calibration fails. How do you address the hardware malfunction?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('10101010-1111-1111-1111-111111111111', 'A', 'Manually disassemble the carbon-fiber shell and rewire the brushless motor leads directly.', 'Realistic', 0.9),
  ('10101010-1111-1111-1111-111111111111', 'B', 'Run an algorithmic frequency sweep to plot electromagnetic interference patterns on a chart.', 'Investigative', 0.7),
  ('10101010-1111-1111-1111-111111111111', 'C', 'Sketch a stylized conceptual body shape to redistribute wind resistance and drag aerodynamics.', 'Artistic', 0.6),
  ('10101010-1111-1111-1111-111111111111', 'D', 'Gather the flight testing crew to delegate safety monitoring tasks and reduce operational fatigue.', 'Social', 0.5);


-- Question 2 (Bio-Genetics)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('20202020-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, 'You isolate a novel gene sequence expressing an unknown protein. What is your scientific strategy?');

-- Seed Options for Question 2
insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('20202020-2222-2222-2222-222222222222', 'A', 'Conduct a statistical analysis of gene transcription rates using multi-variate statistical models.', 'Investigative', 0.9),
  ('20202020-2222-2222-2222-222222222222', 'B', 'Set up high-precision micro-pipette machinery to physically synthesize the gene strands in a petri dish.', 'Realistic', 0.8),
  ('20202020-2222-2222-2222-222222222222', 'C', 'Assemble an informative presentation to explain genetic health outcomes to the patient support community.', 'Social', 0.8),
  ('20202020-2222-2222-2222-222222222222', 'D', 'Establish a commercial testing pipeline and license the genomic discovery to pharmaceutical stakeholders.', 'Enterprising', 0.7);


-- Question 3 (VR Art Canvas)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('30303030-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 1, 'Your spatial Virtual Reality sculpture lacks emotional impact and depth. How do you redesign it?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('30303030-3333-3333-3333-333333333333', 'A', 'Sculpt abstract fluid textures and project glowing neon volumetric lighting to evoke emotional discomfort.', 'Artistic', 0.95),
  ('30303030-3333-3333-3333-333333333333', 'B', 'Consult cognitive response studies to map which shapes cause calming neurological sensations.', 'Investigative', 0.75),
  ('30303030-3333-3333-3333-333333333333', 'C', 'Lead a cooperative workshop where users can paint on the VR canvas simultaneously as collaborative expression.', 'Social', 0.7),
  ('30303030-3333-3333-3333-333333333333', 'D', 'Create an inventory system cataloging each asset by polygon count, asset size, and index folder name.', 'Conventional', 0.8);


-- Question 4 (Peer Mentorship)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('40404040-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 1, 'Two junior team members are locked in a heated disagreement over coding responsibilities. How do you arbitrate?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('40404040-4444-4444-4444-444444444444', 'A', 'Facilitate a structured active-listening session to let both parties voice feelings and repair collaboration.', 'Social', 0.9),
  ('40404040-4444-4444-4444-444444444444', 'B', 'Draft a formalized responsibility matrix with explicit, rigid rules governing daily project updates.', 'Conventional', 0.8),
  ('40404040-4444-4444-4444-444444444444', 'C', 'Persuade the team to pivot direction and launch a secondary micro-project where both can lead separate areas.', 'Enterprising', 0.75),
  ('40404040-4444-4444-4444-444444444444', 'D', 'Research statistical team-velocity models to show them objectively how conflict harms codebase throughput.', 'Investigative', 0.7);


-- Question 5 (Startup Pitch Stage)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('50505050-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 1, 'A venture capitalist challenges your startup business model during a live Q&A. What is your response?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('50505050-5555-5555-5555-555555555555', 'A', 'Deliver a charismatic, high-energy sales pitch detailing market growth metrics and potential buyout ROI.', 'Enterprising', 0.9),
  ('50505050-5555-5555-5555-555555555555', 'B', 'Analyze your unit economics on the fly and offer a highly technical margin calculation breakdown.', 'Investigative', 0.8),
  ('50505050-5555-5555-5555-555555555555', 'C', 'Tell an engaging emotional story about how your product helps disadvantaged local school students.', 'Social', 0.75),
  ('50505050-5555-5555-5555-555555555555', 'D', 'Demonstrate a physical prototype of the device to show how the mechanics actually function.', 'Realistic', 0.6);


-- Question 6 (Financial Audit)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('60606060-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 1, 'You detect a recurring $15.50 transaction anomaly in the corporate ledger. What is your procedure?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('60606060-6666-6666-6666-666666666666', 'A', 'Cross-reference bank statements and receipts item-by-item to log the discrepancy in a tracking sheet.', 'Conventional', 0.95),
  ('60606060-6666-6666-6666-666666666666', 'B', 'Write an automated Python script to run isolation forest anomaly detection across all database records.', 'Investigative', 0.8),
  ('60606060-6666-6666-6666-666666666666', 'C', 'Confront the finance director directly and advocate for systemic transparency and budget restructuring.', 'Enterprising', 0.8),
  ('60606060-6666-6666-6666-666666666666', 'D', 'Design an intuitive infographic detailing corporate spending patterns to help employees file expenses better.', 'Artistic', 0.65);


-- Question 7 (Robotic Arm Maintenance)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('70707070-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 1, 'A robotic assembly arm on the factory floor keeps jamming due to torque limits. What is your approach?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('70707070-7777-7777-7777-777777777777', 'A', 'Manually adjust the mechanical gears and apply synthetic lubricant to the physical assembly joints.', 'Realistic', 0.9),
  ('70707070-7777-7777-7777-777777777777', 'B', 'Calculate the angular stress formulas and simulate load velocity changes in CAD software.', 'Investigative', 0.85),
  ('70707070-7777-7777-7777-777777777777', 'C', 'Establish a strict daily maintenance schedule spreadsheet logging operating hours and errors.', 'Conventional', 0.75),
  ('70707070-7777-7777-7777-777777777777', 'D', 'Gather the assembly workers to provide on-site safety coaching and support their shift transition.', 'Social', 0.7);


-- Question 8 (Quantum Cryptography)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('80808080-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 1, 'Your quantum key distribution protocol is suffering from photon polarization drift. How do you fix it?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('80808080-8888-8888-8888-888888888888', 'A', 'Develop an error-correcting algorithm to mathematically compensate for optical fiber dispersion.', 'Investigative', 0.95),
  ('80808080-8888-8888-8888-888888888888', 'B', 'Physically realign the laser transmitter lenses and optical polarization controllers on the workbench.', 'Realistic', 0.8),
  ('80808080-8888-8888-8888-888888888888', 'C', 'Organize an academic seminar explaining quantum security principles to undergraduate physics students.', 'Social', 0.75),
  ('80808080-8888-8888-8888-888888888888', 'D', 'Draft an intellectual property filing outline to legally protect the proprietary security protocol.', 'Conventional', 0.7);


-- Question 9 (Creative UI/UX Design)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('90909090-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 1, 'The onboarding flow of your mobile app has a 45% drop-off rate. How do you redesign it?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('90909090-9999-9999-9999-999999999999', 'A', 'Design fluid micro-interactions, dark glassmorphism screens, and animated transitions to enchant users.', 'Artistic', 0.9),
  ('90909090-9999-9999-9999-999999999999', 'B', 'Conduct user interviews to understand their personal pain points, feelings, and frustrations.', 'Social', 0.8),
  ('90909090-9999-9999-9999-999999999999', 'C', 'Review user tracking telemetry databases to calculate the exact average milliseconds spent per screen.', 'Investigative', 0.75),
  ('90909090-9999-9999-9999-999999999999', 'D', 'Pitch a marketing rebrand to the board to position the app as the ultimate high-status productivity tool.', 'Enterprising', 0.85);


-- Question 10 (Crisis Counseling)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('a0a0a0a0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'A colleague shows clear signs of extreme academic burnout and is withdrawing from the team. How do you act?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('a0a0a0a0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A', 'Arrange a private coffee chat to offer emotional support, listen without judgment, and share coping strategies.', 'Social', 0.95),
  ('a0a0a0a0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'B', 'Help them organize their tasks into a clean, prioritized weekly checklist spreadsheet to clear their mind.', 'Conventional', 0.8),
  ('a0a0a0a0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'C', 'Brainstorm and design a visual mental-health wellness guide to distribute around the shared workspace.', 'Artistic', 0.75),
  ('a0a0a0a0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'D', 'Negotiate with the program director on their behalf to secure a formal extension and workload reduction.', 'Enterprising', 0.7);


-- Question 11 (Product Growth)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('b0b0b0b0-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'Your competitor matches your product features. How do you regain market leadership?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('b0b0b0b0-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'A', 'Formulate an aggressive market expansion plan, acquire a niche startup, and capture new user bases.', 'Enterprising', 0.95),
  ('b0b0b0b0-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B', 'Audit your internal product delivery pipelines to eliminate operational waste and optimize server budgets.', 'Conventional', 0.8),
  ('b0b0b0b0-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'C', 'Craft a high-concept marketing narrative centered on artistic integrity and bespoke visual design.', 'Artistic', 0.75),
  ('b0b0b0b0-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'D', 'Establish user feedback focus groups to build deep community connections and empathy channels.', 'Social', 0.7);


-- Question 12 (Database Migration)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('c0c0c0c0-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 'You must migrate 10 million relational rows to a new database schema. What is your operational strategy?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('c0c0c0c0-cccc-cccc-cccc-cccccccccccc', 'A', 'Write a strict step-by-step migration script with rollbacks and verify checksum counts for every single record.', 'Conventional', 0.95),
  ('c0c0c0c0-cccc-cccc-cccc-cccccccccccc', 'B', 'Design a visual database schema graph mapping entities and tables to present to engineering leads.', 'Artistic', 0.6),
  ('c0c0c0c0-cccc-cccc-cccc-cccccccccccc', 'C', 'Analyze the index structures and write query optimizations to minimize execution time to seconds.', 'Investigative', 0.85),
  ('c0c0c0c0-cccc-cccc-cccc-cccccccccccc', 'D', 'Set up physical redundant storage arrays and network switches on the server rack to handle raw data transfer.', 'Realistic', 0.7);


-- BACKUP QUESTIONS (is_backup = true)

-- Question 13 (IoT Smarthome Calibration - Realistic Backup)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('d0d0d0d0-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 'You are calibrating a network of physical environmental sensors in a smart home. What is your focus?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('d0d0d0d0-dddd-dddd-dddd-dddddddddddd', 'A', 'Physically solder the sensor pins and route electrical conduits cleanly through the wall fixtures.', 'Realistic', 0.9),
  ('d0d0d0d0-dddd-dddd-dddd-dddddddddddd', 'B', 'Formulate calibration algorithms to filter noise and model humidity trends mathematically.', 'Investigative', 0.8),
  ('d0d0d0d0-dddd-dddd-dddd-dddddddddddd', 'C', 'Document sensor serial numbers, locations, and installation dates in a tracking database.', 'Conventional', 0.85),
  ('d0d0d0d0-dddd-dddd-dddd-dddddddddddd', 'D', 'Teach local homeowners how to interact with and adjust their smart appliances.', 'Social', 0.6);


-- Question 14 (Model Training - Investigative Backup)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('e0e0e0e0-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, 'A deep learning image classifier is suffering from high validation variance (overfitting). How do you resolve this?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('e0e0e0e0-eeee-eeee-eeee-eeeeeeeeeeee', 'A', 'Apply mathematical regularization techniques (L2 penalty, dropout) and audit loss equations.', 'Investigative', 0.95),
  ('e0e0e0e0-eeee-eeee-eeee-eeeeeeeeeeee', 'B', 'Log validation metrics, epoch numbers, and hyperparameters systematically in a spreadsheet tracker.', 'Conventional', 0.8),
  ('e0e0e0e0-eeee-eeee-eeee-eeeeeeeeeeee', 'C', 'Create a visual data-augmentation pipeline to flip, crop, and recolor input training images.', 'Artistic', 0.7),
  ('e0e0e0e0-eeee-eeee-eeee-eeeeeeeeeeee', 'D', 'Procure additional high-performance GPU server rigs, physically mounting them in the server chassis.', 'Realistic', 0.6);


-- Question 15 (Game Audio Synth - Artistic Backup)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('f0f0f0f0-ffff-ffff-ffff-ffffffffffff', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 'A sound effect for a science-fiction spacecraft propulsion engine sounds too generic. What is your redesign?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('f0f0f0f0-ffff-ffff-ffff-ffffffffffff', 'A', 'Synthesize original waves using custom frequency modulation, adding granular echoes for an alien atmosphere.', 'Artistic', 0.95),
  ('f0f0f0f0-ffff-ffff-ffff-ffffffffffff', 'B', 'Write code using audio APIs to mathematically filter and normalize decibel thresholds dynamically.', 'Investigative', 0.8),
  ('f0f0f0f0-ffff-ffff-ffff-ffffffffffff', 'C', 'Connect physical patch cords on an analog modular synthesizer dashboard, turning dials to shape voltage.', 'Realistic', 0.85),
  ('f0f0f0f0-ffff-ffff-ffff-ffffffffffff', 'D', 'Catalog the audio sample rate, bit depth, folder structure, and license files for standard compliance.', 'Conventional', 0.75);


-- Question 16 (Community Support - Social Backup)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 1, 'A major storm hits the city, and local shelters need immediate supply coordination. What do you do?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('00000000-0000-0000-0000-000000000000', 'A', 'Coordinate volunteer teams, delegate relief assignments, and comfort displaced community families.', 'Social', 0.95),
  ('00000000-0000-0000-0000-000000000000', 'B', 'Establish a centralized logistics sheet tracking water crates, blankets, and battery inventory.', 'Conventional', 0.85),
  ('00000000-0000-0000-0000-000000000000', 'C', 'Take charge of the emergency council, pitching resource-sharing strategies to local government chiefs.', 'Enterprising', 0.8),
  ('00000000-0000-0000-0000-000000000000', 'D', 'Physically operate supply transport trucks and assemble structural canvas tents in the shelter courtyard.', 'Realistic', 0.7);


-- Question 17 (Corporate Merger - Enterprising Backup)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('10101010-2222-3333-4444-555555555555', '11111111-2222-3333-4444-555555555555', 1, 'A joint-venture negotiation is stalling because the partner refuses to share distribution channels. How do you proceed?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('10101010-2222-3333-4444-555555555555', 'A', 'Present a high-reward strategic proposal detailing mutual revenue share and convince the partner board.', 'Enterprising', 0.95),
  ('10101010-2222-3333-4444-555555555555', 'B', 'Conduct a competitive market analysis to calculate the financial impact of building a proprietary channel.', 'Investigative', 0.8),
  ('10101010-2222-3333-4444-555555555555', 'C', 'Draft a comprehensive legal contract detailing access clauses, liability boundaries, and filing rules.', 'Conventional', 0.85),
  ('10101010-2222-3333-4444-555555555555', 'D', 'Design a series of visually compelling pitch slides explaining the partnership vision for press release.', 'Artistic', 0.65);


-- Question 18 (Compliance Audit - Conventional Backup)
insert into public.questions (id, scenario_id, sequence_order, question_text)
values ('20202020-3333-4444-5555-666666666666', '22222222-3333-4444-5555-666666666666', 1, 'You are auditing a company for ISO-27001 data security compliance. What is your audit methodology?');

insert into public.options (question_id, option_letter, option_text, target_dimension, intensity_weight)
values 
  ('20202020-3333-4444-5555-666666666666', 'A', 'Review policy logs and verify physical security keycards and encryption key rotation spreadsheets.', 'Conventional', 0.95),
  ('20202020-3333-4444-5555-666666666666', 'B', 'Perform penetration testing and trace network packets to check for cryptographic vulnerabilities.', 'Investigative', 0.85),
  ('20202020-3333-4444-5555-666666666666', 'C', 'Advocate for security awareness training and host workshops to support workers in changing their habits.', 'Social', 0.7),
  ('20202020-3333-4444-5555-666666666666', 'D', 'Pitch a cybersecurity vendor agreement to senior management to outsource compliance liabilities.', 'Enterprising', 0.75);
