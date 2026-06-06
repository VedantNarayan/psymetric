/**
 * Automated Verification Suite for PsyMetric Multi-Set Yearly Assessment Spacing & Scenario Uniqueness
 */

const assert = require('assert');

// 1. Replicated Spacing / Set-Selection logic from next-item route
function calculateSetNumber(pastSessions, currentUserId) {
  const pastCount = pastSessions.length;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Filter completed sessions within the past year
  const recentSets = pastSessions
    .filter(s => s.is_completed && (!s.created_at || new Date(s.created_at) >= oneYearAgo))
    .map(s => s.theta_vector?.set_number)
    .filter(Boolean);

  const uniqueRecentSets = Array.from(new Set(recentSets));

  let set_number;
  if (!uniqueRecentSets.includes(1)) {
    set_number = 1;
  } else if (!uniqueRecentSets.includes(2)) {
    set_number = 2;
  } else if (!uniqueRecentSets.includes(3)) {
    set_number = 3;
  } else {
    // If all sets are exhausted within the past 1 year, fall back to logical progression to avoid crashing
    set_number = (pastCount % 3) + 1;
  }

  return set_number;
}

// Mock scenarios database
const mockScenarios = Array.from({ length: 25 }, (_, idx) => {
  const isBackup = idx >= 12; // 12 baseline, rest backup
  return {
    id: `scen_${idx + 1}`,
    title: `Scenario Title ${idx + 1}`,
    is_backup: isBackup,
    questions: [
      { id: `q_${idx + 1}_s1`, sequence_order: 1, question_text: `Set 1 Question for Scenario ${idx + 1}` },
      { id: `q_${idx + 1}_s2`, sequence_order: 2, question_text: `Set 2 Question for Scenario ${idx + 1}` },
      { id: `q_${idx + 1}_s3`, sequence_order: 3, question_text: `Set 3 Question for Scenario ${idx + 1}` }
    ]
  };
});

// Replicated scheduler progression simulator
function simulateNextItem(sessionId, answeredQuestionIds, set_number, isExtended, totalExtendedScenarios) {
  const scenarioQuestionStatus = mockScenarios.map(sc => {
    const qs = sc.questions || [];
    
    const candidates = qs.filter(q => q.sequence_order === set_number);
    let activeQ = candidates.find(q => !answeredQuestionIds.has(q.id));
    if (!activeQ && candidates.length > 0) {
      activeQ = candidates[0];
    }
    if (!activeQ && qs.length > 0) {
      activeQ = qs.sort((a, b) => a.sequence_order - b.sequence_order)[0];
    }

    const isCompleted = candidates.length > 0 ? candidates.every(q => answeredQuestionIds.has(q.id)) : true;
    const isInProgress = candidates.length > 0 ? (candidates.some(q => answeredQuestionIds.has(q.id)) && !isCompleted) : false;

    return {
      ...sc,
      activeQuestion: activeQ,
      isCompleted,
      isInProgress
    };
  });

  const completedBaselineScenarios = scenarioQuestionStatus.filter(s => !s.is_backup && s.isCompleted);
  const completedBackupScenarios = scenarioQuestionStatus.filter(s => s.is_backup && s.isCompleted);
  const completedScenariosCount = completedBaselineScenarios.length + completedBackupScenarios.length;

  const targetScenariosCount = isExtended ? (12 + totalExtendedScenarios) : 12;
  if (completedScenariosCount >= targetScenariosCount || completedScenariosCount >= 18) {
    return { is_completed: true };
  }

  let nextScenario = null;
  if (isExtended && completedScenariosCount >= 12) {
    nextScenario = scenarioQuestionStatus.find(s => s.is_backup && s.isInProgress);
    if (!nextScenario) {
      nextScenario = scenarioQuestionStatus.find(s => s.is_backup && !s.isCompleted);
    }
  } else {
    nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && s.isInProgress);
    if (!nextScenario) {
      nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && !s.isCompleted);
    }
  }

  if (!nextScenario || !nextScenario.activeQuestion) {
    return { is_completed: true };
  }

  return {
    is_completed: false,
    nextScenario,
    nextQuestion: nextScenario.activeQuestion,
    completedScenariosCount,
    targetScenariosCount
  };
}

// ─── RUN VERIFICATION TESTS ───
function runTests() {
  console.log('====================================================');
  console.log('PSYMETRIC MULTI-SET ASSESSMENT & UNIQUENESS VERIFIER');
  console.log('====================================================');

  // Test 1: First-time user should get Set 1
  console.log('\n- Test 1: First-time user');
  const pastSessions1 = [];
  const set1 = calculateSetNumber(pastSessions1, 'u1');
  console.log(`  Set Number: ${set1} (Expected: 1)`);
  assert.strictEqual(set1, 1);
  console.log('  ✅ Pass');

  // Test 2: Past session taken 2 years ago (Set 1) -> should allow Set 1 again
  console.log('\n- Test 2: Past session > 1 year ago');
  const dateTwoYearsAgo = new Date();
  dateTwoYearsAgo.setFullYear(dateTwoYearsAgo.getFullYear() - 2);
  const pastSessions2 = [
    { is_completed: true, created_at: dateTwoYearsAgo.toISOString(), theta_vector: { set_number: 1 } }
  ];
  const set2 = calculateSetNumber(pastSessions2, 'u1');
  console.log(`  Set Number: ${set2} (Expected: 1)`);
  assert.strictEqual(set2, 1);
  console.log('  ✅ Pass');

  // Test 3: Past session taken 6 months ago (Set 1) -> should select Set 2
  console.log('\n- Test 3: Past session 6 months ago (Set 1)');
  const dateSixMonthsAgo = new Date();
  dateSixMonthsAgo.setMonth(dateSixMonthsAgo.getMonth() - 6);
  const pastSessions3 = [
    { is_completed: true, created_at: dateSixMonthsAgo.toISOString(), theta_vector: { set_number: 1 } }
  ];
  const set3 = calculateSetNumber(pastSessions3, 'u1');
  console.log(`  Set Number: ${set3} (Expected: 2)`);
  assert.strictEqual(set3, 2);
  console.log('  ✅ Pass');

  // Test 4: Past sessions: Set 1 (6 months ago), Set 2 (3 months ago) -> should select Set 3
  console.log('\n- Test 4: Past sessions (Set 1 & Set 2 taken recently)');
  const dateThreeMonthsAgo = new Date();
  dateThreeMonthsAgo.setMonth(dateThreeMonthsAgo.getMonth() - 3);
  const pastSessions4 = [
    { is_completed: true, created_at: dateSixMonthsAgo.toISOString(), theta_vector: { set_number: 1 } },
    { is_completed: true, created_at: dateThreeMonthsAgo.toISOString(), theta_vector: { set_number: 2 } }
  ];
  const set4 = calculateSetNumber(pastSessions4, 'u1');
  console.log(`  Set Number: ${set4} (Expected: 3)`);
  assert.strictEqual(set4, 3);
  console.log('  ✅ Pass');

  // Test 5: All 3 sets taken within the past 6 months -> should fall back and cycle to Set 1 (no crash)
  console.log('\n- Test 5: All 3 sets taken within 1 year (inventory exhaustion)');
  const dateOneMonthAgo = new Date();
  dateOneMonthAgo.setMonth(dateOneMonthAgo.getMonth() - 1);
  const pastSessions5 = [
    { is_completed: true, created_at: dateSixMonthsAgo.toISOString(), theta_vector: { set_number: 1 } },
    { is_completed: true, created_at: dateThreeMonthsAgo.toISOString(), theta_vector: { set_number: 2 } },
    { is_completed: true, created_at: dateOneMonthAgo.toISOString(), theta_vector: { set_number: 3 } }
  ];
  const set5 = calculateSetNumber(pastSessions5, 'u1');
  console.log(`  Set Number: ${set5} (Expected: 1 - cycled)`);
  assert.strictEqual(set5, 1);
  console.log('  ✅ Pass');

  // Test 6: Scenario Uniqueness in a single session
  console.log('\n- Test 6: Single-session scenario uniqueness check');
  const answeredQuestionIds = new Set();
  const seenScenarioIds = new Set();
  let currentStep = simulateNextItem('s_test', answeredQuestionIds, 1, false, 0);

  let stepsCount = 0;
  while (!currentStep.is_completed && stepsCount < 25) {
    const { nextScenario, nextQuestion } = currentStep;
    console.log(`  Step ${stepsCount + 1} | Serving Scenario: ${nextScenario.id} (${nextScenario.title}) | Question Set order: ${nextQuestion.sequence_order}`);
    
    // Uniqueness assertion: scenario must not have been seen yet
    if (seenScenarioIds.has(nextScenario.id)) {
      throw new Error(`Glitch: Scenario ${nextScenario.id} was served more than once in the same session!`);
    }
    seenScenarioIds.add(nextScenario.id);

    // Simulate answering the question
    answeredQuestionIds.add(nextQuestion.id);

    // Get next item
    currentStep = simulateNextItem('s_test', answeredQuestionIds, 1, false, 0);
    stepsCount++;
  }

  console.log(`  Total scenarios served: ${seenScenarioIds.size}`);
  assert.strictEqual(seenScenarioIds.size, 12); // standard session serves 12 unique baseline scenarios
  console.log('  ✅ Pass: Exactly 12 unique scenarios served without repetition.');

  // Test 7: Extended session uniqueness check (Statistical contradiction fallback)
  console.log('\n- Test 7: Extended-session scenario uniqueness check (with 6 backup scenarios)');
  const answeredQuestionIdsExt = new Set();
  const seenScenarioIdsExt = new Set();
  let currentStepExt = simulateNextItem('s_test_ext', answeredQuestionIdsExt, 1, false, 0);

  let extStepsCount = 0;
  let simulatedExtendedState = false;
  let simulatedExtendedScenarios = 0;
  
  while (!currentStepExt.is_completed && extStepsCount < 30) {
    const { nextScenario, nextQuestion } = currentStepExt;
    
    // Uniqueness assertion
    if (seenScenarioIdsExt.has(nextScenario.id)) {
      throw new Error(`Glitch: Scenario ${nextScenario.id} was served more than once in this session!`);
    }
    seenScenarioIdsExt.add(nextScenario.id);

    // Simulate answering
    answeredQuestionIdsExt.add(nextQuestion.id);

    // Mock statistical contradiction trigger at step 12, dynamically extending session
    if (seenScenarioIdsExt.size === 12) {
      simulatedExtendedState = true;
      simulatedExtendedScenarios = 6; // Dynamic extension count simulated
    }

    currentStepExt = simulateNextItem('s_test_ext', answeredQuestionIdsExt, 1, simulatedExtendedState, simulatedExtendedState ? simulatedExtendedScenarios : 0);
    extStepsCount++;
  }

  console.log(`  Total scenarios served in extended session: ${seenScenarioIdsExt.size}`);
  assert.strictEqual(seenScenarioIdsExt.size, 18); // 12 baseline + 6 backup
  console.log('  ✅ Pass: Exactly 18 unique scenarios served without repetition in extended session.');

  console.log('\n🏆 ALL TESTING ASSERTIONS PASSED SUCCESSFULLY!');
}

runTests();
