const fs = require('fs');
const path = require('path');

// Helper to delay execution using Promise
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runSimulation(useFixedLogic = false, testType = 'OPTION_SELECT') {
  console.log(`\n==========================================`);
  console.log(`Running Simulation: ${testType} with ${useFixedLogic ? 'FIXED' : 'BUGGY'} Logic`);
  console.log(`==========================================`);

  // 1. Mock the states
  let showOverlay = false;
  let currentQuestion = {
    id: 'q1',
    question_text: 'What is your preferred working style?',
    show_at_seconds: 5,
    options: [
      { id: 'opt1', option_letter: 'A', option_text: 'Collaborative' },
      { id: 'opt2', option_letter: 'B', option_text: 'Independent' }
    ]
  };
  let timePassed = 0;
  let animatingExit = false;
  let clickedOptionId = null;
  let isExpired = false;
  let timeLeft = 12;

  const logs = [];
  function logState(action) {
    const time = new Date().toISOString().substring(11, 23);
    const stateStr = `showOverlay=${showOverlay}, currentQuestion=${currentQuestion ? currentQuestion.id : 'null'}, animatingExit=${animatingExit}, clickedOptionId=${clickedOptionId}, isExpired=${isExpired}, timeLeft=${timeLeft}`;
    logs.push({ action, time, showOverlay, currentQuestionId: currentQuestion ? currentQuestion.id : 'null', animatingExit, clickedOptionId });
    console.log(`[${time}] Action: ${action.padEnd(30)} | State: ${stateStr}`);
  }

  // Simulation step function to check for the glitch
  let exitAnimationStarted = false;
  let glitchDetected = false;
  function checkGlitch() {
    if (animatingExit) {
      exitAnimationStarted = true;
    }
    // A glitch occurs if the exit animation has started, and now animatingExit is false,
    // but the currentQuestion is still the old question (q1) and overlay is still open.
    if (exitAnimationStarted && !animatingExit && showOverlay && currentQuestion && currentQuestion.id === 'q1') {
      glitchDetected = true;
      console.log(`>>> GLITCH DETECTED! Old question is visible again: showOverlay=true, animatingExit=false, currentQuestion=q1`);
    }
  }

  logState('INITIAL STATE');

  // 2. Simulate playing a video
  console.log('\n--- Starting Video Playback ---');
  const videoDuration = 10;
  const timeStep = 1; // advance 1 second at a time
  for (timePassed = 0; timePassed <= videoDuration; timePassed += timeStep) {
    logState(`video.currentTime = ${timePassed}`);
    
    // Check if overlay triggers exactly at show_at_seconds
    if (currentQuestion && timePassed >= currentQuestion.show_at_seconds && !showOverlay) {
      showOverlay = true;
      logState('OVERLAY TRIGGERED & VIDEO PAUSED');
      break;
    }
    await delay(30); // small delay to simulate time passing in real-time
  }

  if (showOverlay && timePassed === currentQuestion.show_at_seconds) {
    console.log(`✓ Overlay triggered exactly at show_at_seconds (${currentQuestion.show_at_seconds}s)`);
  } else {
    console.log(`✗ Overlay did not trigger at exact time. Triggered at ${timePassed}s instead of ${currentQuestion.show_at_seconds}s`);
  }

  // Start checking for glitches periodically
  const intervalId = setInterval(checkGlitch, 20);

  if (testType === 'OPTION_SELECT') {
    // 3. Simulate selecting an option
    console.log('\n--- Simulating Option Selection ---');
    const optionId = 'opt1';
    
    const handleOptionSelect = async () => {
      if (clickedOptionId || animatingExit || isExpired) return;

      clickedOptionId = optionId;
      logState('OPTION CLICKED');

      if (!useFixedLogic) {
        // Original Buggy Logic:
        // Wait for the button pulse animation (450ms)
        await delay(450);
        animatingExit = true;
        logState('EXIT ANIMATION START');

        // Complete card Z-axis rotate transition (500ms)
        await delay(500);
        animatingExit = false;
        logState('EXIT ANIMATION END (animatingExit = false)');

        // Simulate network request to loadNextItem (300ms)
        logState('START loadNextItem (Network Request)');
        await delay(300);

        // loadNextItem completion
        currentQuestion = { id: 'q2', question_text: 'How do you handle conflict?', show_at_seconds: 4, options: [] };
        clickedOptionId = null;
        showOverlay = false;
        logState('loadNextItem RESOLVED (New question loaded, Overlay closed)');
      } else {
        // Fixed Logic:
        // Wait for the button pulse animation (450ms)
        await delay(450);
        animatingExit = true;
        logState('EXIT ANIMATION START');

        // Complete card Z-axis rotate transition (500ms)
        await delay(500);
        logState('EXIT ANIMATION END (animatingExit remains true during loadNextItem)');

        // Simulate network request to loadNextItem (300ms)
        logState('START loadNextItem (Network Request)');
        await delay(300);

        // loadNextItem completion
        currentQuestion = { id: 'q2', question_text: 'How do you handle conflict?', show_at_seconds: 4, options: [] };
        clickedOptionId = null;
        showOverlay = false;
        animatingExit = false; // set animatingExit to false ONLY after loading the next item
        logState('loadNextItem RESOLVED (New question loaded, Overlay closed, animatingExit = false)');
      }
    };

    await handleOptionSelect();
  } else if (testType === 'TIMER_EXPIRE') {
    // 3. Simulate timer countdown and expiration
    console.log('\n--- Simulating Timer Countdown ---');
    // Countdown simulation
    while (timeLeft > 0) {
      await delay(20); // mock fast countdown ticks
      timeLeft -= 1;
      logState(`Timer Tick: timeLeft = ${timeLeft}`);
    }

    // Expiration Handler
    const handleTimeExpired = async () => {
      isExpired = true;
      logState('TIMER EXPIRED (Card shakes red)');

      if (!useFixedLogic) {
        // Original Buggy Logic:
        // Wait 1000ms (shake / red error feedback duration)
        await delay(1000);
        animatingExit = true;
        logState('EXIT ANIMATION START');

        // Complete card Z-axis rotate transition (500ms)
        await delay(500);
        animatingExit = false;
        isExpired = false;
        logState('EXIT ANIMATION END (animatingExit = false, isExpired = false)');

        // Simulate network request to loadNextItem (300ms)
        logState('START loadNextItem (Network Request)');
        await delay(300);

        // loadNextItem completion
        currentQuestion = { id: 'q2', question_text: 'How do you handle conflict?', show_at_seconds: 4, options: [] };
        showOverlay = false;
        logState('loadNextItem RESOLVED (New question loaded, Overlay closed)');
      } else {
        // Fixed Logic:
        // Wait 1000ms
        await delay(1000);
        animatingExit = true;
        logState('EXIT ANIMATION START');

        // Complete card Z-axis rotate transition (500ms)
        await delay(500);
        logState('EXIT ANIMATION END (animatingExit remains true during loadNextItem)');

        // Simulate network request to loadNextItem (300ms)
        logState('START loadNextItem (Network Request)');
        await delay(300);

        // loadNextItem completion
        currentQuestion = { id: 'q2', question_text: 'How do you handle conflict?', show_at_seconds: 4, options: [] };
        showOverlay = false;
        animatingExit = false;
        isExpired = false;
        logState('loadNextItem RESOLVED (New question loaded, Overlay closed, animatingExit = false, isExpired = false)');
      }
    };

    await handleTimeExpired();
  }

  clearInterval(intervalId);

  console.log('\n--- Simulation Summary ---');
  if (useFixedLogic) {
    if (glitchDetected) {
      console.log(`✗ FIXED logic failed: Glitch was still detected for ${testType}.`);
    } else {
      console.log(`✓ FIXED logic succeeded: No glitch detected for ${testType}. Old card never reappeared.`);
    }
  } else {
    if (glitchDetected) {
      console.log(`✓ BUGGY logic successfully reproduced the glitch for ${testType}. Old card reappeared.`);
    } else {
      console.log(`✗ BUGGY logic did not reproduce the glitch for ${testType}.`);
    }
  }

  return { glitchDetected };
}

async function main() {
  console.log("STARTING ASSESSMENT FLOW STATE TRANSITION SIMULATIONS");
  
  // Test Option Selection Flow
  const buggyOptionResult = await runSimulation(false, 'OPTION_SELECT');
  const fixedOptionResult = await runSimulation(true, 'OPTION_SELECT');

  // Test Timer Expiration Flow
  const buggyTimerResult = await runSimulation(false, 'TIMER_EXPIRE');
  const fixedTimerResult = await runSimulation(true, 'TIMER_EXPIRE');

  console.log('\n==========================================');
  console.log('FINAL VERIFICATION RESULTS SUMMARY:');
  console.log('==========================================');
  console.log(`- Option Select (Buggy Logic) Glitch: ${buggyOptionResult.glitchDetected ? 'REPRODUCED (True)' : 'NOT REPRODUCED (False)'}`);
  console.log(`- Option Select (Fixed Logic) Glitch: ${fixedOptionResult.glitchDetected ? 'REPRODUCED (True)' : 'NOT REPRODUCED (False) [OK]'}`);
  console.log(`- Timer Expired (Buggy Logic) Glitch: ${buggyTimerResult.glitchDetected ? 'REPRODUCED (True)' : 'NOT REPRODUCED (False)'}`);
  console.log(`- Timer Expired (Fixed Logic) Glitch: ${fixedTimerResult.glitchDetected ? 'REPRODUCED (True)' : 'NOT REPRODUCED (False) [OK]'}`);
  console.log('==========================================');
}

main().catch(err => console.error(err));
