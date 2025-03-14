const fetch = require('node-fetch');
const fs = require('fs');

const playerEmail = 'emmasod@uia.no';

async function startChallenge() {
  try {

    const startUrl = `https://spacescavanger.onrender.com/start?player=${encodeURIComponent(playerEmail)}`;
    console.log(`Calling /start endpoint: ${startUrl}`);
    const startRes = await fetch(startUrl);
    if (!startRes.ok) {
      throw new Error(`Start endpoint error: ${startRes.statusText}`);
    }
    const startData = await startRes.json();
    console.log('Response from /start:', startData);

    const puzzleText = startData.challenge || '';

    if (puzzleText.includes('difference between the equatorial radius and the mean radius of the Sun')) {
      console.log('\n--- Puzzle #1 detected: Sun radius difference ---\n');
      const puzzle1AnswerData = await solvePuzzle1();
      if (puzzle1AnswerData.nextChallenge) {
        const puzzle2Text = puzzle1AnswerData.nextChallenge.toLowerCase();
        if (puzzle2Text.includes('earths axial tilt')) {
          console.log('\n--- Puzzle #2 detected: Earth’s axial tilt ---\n');
          const puzzle2AnswerData = await solvePuzzle2();
          if (puzzle2AnswerData.nextChallenge) {
            const puzzle3Text = puzzle2AnswerData.nextChallenge.toLowerCase();
            if (puzzle3Text.includes('shortest day')) {
              console.log('\n--- Puzzle #3 detected: Shortest day ---\n');
              await solvePuzzle3();
            } else {
              console.log('\nA different puzzle was returned after Puzzle #2. Implement further logic as needed.\n');
            }
          }
        } else {
          console.log('\nA different puzzle was returned after Puzzle #1. Implement further logic as needed.\n');
        }
      }
    } else if (puzzleText.toLowerCase().includes('earths axial tilt')) {
      console.log('\n--- Puzzle #2 detected from /start ---\n');
      const puzzle2AnswerData = await solvePuzzle2();
      if (puzzle2AnswerData.nextChallenge) {
        const puzzle3Text = puzzle2AnswerData.nextChallenge.toLowerCase();
        if (puzzle3Text.includes('shortest day')) {
          console.log('\n--- Puzzle #3 detected: Shortest day ---\n');
          await solvePuzzle3();
        } else {
          console.log('\nA different puzzle was returned after Puzzle #2. Implement further logic as needed.\n');
        }
      }
    } else if (puzzleText.toLowerCase().includes('shortest day')) {
      console.log('\n--- Puzzle #3 detected from /start ---\n');
      await solvePuzzle3();
    } else {
      console.log('\nNo recognized puzzle in /start. Possibly you already solved them or have a different puzzle.\n');
    }
  } catch (error) {
    console.error('An error occurred in startChallenge():', error);
  }
}

/**
 * Puzzle #1: "difference between the equatorial radius and the mean radius of the Sun"
 */
async function solvePuzzle1() {
  const sunUrl = 'https://api.le-systeme-solaire.net/rest/bodies/soleil';
  console.log(`Fetching Sun data: ${sunUrl}`);
  const sunRes = await fetch(sunUrl);
  if (!sunRes.ok) {
    throw new Error(`Solar System API (Sun) error: ${sunRes.statusText}`);
  }
  const sunData = await sunRes.json();

  const difference = Math.abs(sunData.equaRadius - sunData.meanRadius);
  console.log(`Sun equaRadius = ${sunData.equaRadius}, meanRadius = ${sunData.meanRadius}`);
  console.log(`Puzzle #1 answer (difference) = ${difference}`);

  const answerData = await submitAnswer(difference);
  console.log('Response from /answer (Puzzle #1):', answerData);

  fs.writeFileSync('skeletonkey.txt', difference.toString());
  console.log(`Puzzle #1 key saved to skeletonkey.txt: ${difference}`);
  return answerData;
}

/**
 * Puzzle #2: "closest in scale to Earths axial tilt"
 */
async function solvePuzzle2() {
  const earthUrl = 'https://api.le-systeme-solaire.net/rest/bodies/terre';
  console.log(`Fetching Earth data: ${earthUrl}`);
  const earthRes = await fetch(earthUrl);
  if (!earthRes.ok) {
    throw new Error(`Error fetching Earth data: ${earthRes.statusText}`);
  }
  const earthData = await earthRes.json();
  const earthTilt = earthData.axialTilt;
  console.log(`Earth's axial tilt: ${earthTilt}`);

  const planetsUrl = 'https://api.le-systeme-solaire.net/rest/bodies?filter[]=isPlanet,eq,true';
  console.log(`Fetching all planets: ${planetsUrl}`);
  const planetsRes = await fetch(planetsUrl);
  if (!planetsRes.ok) {
    throw new Error(`Error fetching planets: ${planetsRes.statusText}`);
  }
  const planetsData = await planetsRes.json();

  let minDiff = Number.MAX_VALUE;
  let closestPlanet = null;
  for (const planet of planetsData.bodies) {
    if (planet.id === 'terre') continue;
    if (typeof planet.axialTilt !== 'number') continue;
    const diff = Math.abs(planet.axialTilt - earthTilt);
    if (diff < minDiff) {
      minDiff = diff;

      closestPlanet = planet.englishName;
    }
  }
  console.log(`Planet closest to Earth's tilt: ${closestPlanet}, difference: ${minDiff}`);

  const answerData = await submitAnswer(closestPlanet);
  console.log('Response from /answer (Puzzle #2):', answerData);

  fs.writeFileSync('skeletonkey.txt', closestPlanet);
  console.log(`Puzzle #2 key saved to skeletonkey.txt: ${closestPlanet}`);
  return answerData;
}

/**
 * Puzzle #3: "find the planet with the shortest day"
 */
async function solvePuzzle3() {
  const planetsUrl = 'https://api.le-systeme-solaire.net/rest/bodies?filter[]=isPlanet,eq,true';
  console.log(`Fetching all planets for puzzle #3: ${planetsUrl}`);
  const planetsRes = await fetch(planetsUrl);
  if (!planetsRes.ok) {
    throw new Error(`Error fetching planets for puzzle #3: ${planetsRes.statusText}`);
  }
  const planetsData = await planetsRes.json();

  let minRotation = Number.MAX_VALUE;
  let quickestPlanet = null;
  for (const planet of planetsData.bodies) {
    if (typeof planet.sideralRotation !== 'number') continue;
    const rotation = Math.abs(planet.sideralRotation);
    if (rotation < minRotation) {
      minRotation = rotation;
      quickestPlanet = planet.englishName;
    }
  }
  console.log(`Puzzle #3: Planet with the shortest day: ${quickestPlanet}, sideralRotation = ${minRotation}`);

  const answerData = await submitAnswer(quickestPlanet);
  console.log('Response from /answer (Puzzle #3):', answerData);

  fs.writeFileSync('skeletonkey.txt', quickestPlanet);
  console.log(`Puzzle #3 key saved to skeletonkey.txt: ${quickestPlanet}`);

  if (answerData.nextChallenge) {
    console.log('\nNext Challenge:', answerData.nextChallenge);
  
    const puzzle4Text = answerData.nextChallenge.toLowerCase();
    if (puzzle4Text.includes('moons')) {
      await solvePuzzle4();
    } else {
      console.log('\nA different puzzle was returned after Puzzle #3. Implement more logic if needed.\n');
    }
  }
  
  return answerData;
  
}

async function submitAnswer(answerValue) {
  const answerUrl = 'https://spacescavanger.onrender.com/answer';
  console.log(`\nSubmitting answer "${answerValue}" to: ${answerUrl}`);
  const res = await fetch(answerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer: answerValue, player: playerEmail })
  });
  if (!res.ok) {
    throw new Error(`Answer endpoint error: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Puzzle #4: "Find how many moons Jupiter has."
 */
async function solvePuzzle4() {
    console.log('\n--- Puzzle #4: Jupiter’s Moons ---\n');
  
    const jupiterUrl = 'https://api.le-systeme-solaire.net/rest/bodies/jupiter';
    console.log(`Fetching Jupiter data: ${jupiterUrl}`);
    const jupiterRes = await fetch(jupiterUrl);
    if (!jupiterRes.ok) {
      throw new Error(`Solar System API (Jupiter) error: ${jupiterRes.statusText}`);
    }
    const jupiterData = await jupiterRes.json();
  
    const moonsArray = jupiterData.moons || [];
    const numberOfMoons = moonsArray.length;
    console.log(`Puzzle #4: Jupiter has ${numberOfMoons} known moons.`);
  
    const puzzle4AnswerData = await submitAnswer(numberOfMoons);
    console.log('Response from /answer (Puzzle #4):', puzzle4AnswerData);
  
    fs.writeFileSync('skeletonkey.txt', numberOfMoons.toString());
    console.log(`Puzzle #4 key saved to skeletonkey.txt: ${numberOfMoons}`);
  
    if (puzzle4AnswerData.nextChallenge) {
      console.log('\nNext Challenge:', puzzle4AnswerData.nextChallenge);
  
      const puzzle5Text = puzzle4AnswerData.nextChallenge.toLowerCase();
      if (puzzle5Text.includes('largest moon')) {
        await solvePuzzle5();
      } else {
        console.log('\nA different puzzle was returned after Puzzle #4. Implement if needed.\n');
      }
    }
  
    return puzzle4AnswerData;
  }
  
  
/**
 * Puzzle #5: "Find the largest moon of Jupiter."
 */
async function solvePuzzle5() {
    try {
      console.log('\n--- Puzzle #5: Largest Moon of Jupiter ---\n');
  
      const jupiterUrl = 'https://api.le-systeme-solaire.net/rest/bodies/jupiter';
      console.log(`Fetching Jupiter data: ${jupiterUrl}`);
      const jupiterRes = await fetch(jupiterUrl);
      if (!jupiterRes.ok) {
        throw new Error(`Solar System API (Jupiter) error: ${jupiterRes.statusText}`);
      }
      const jupiterData = await jupiterRes.json();
  
      const moonsArray = jupiterData.moons || [];
      if (moonsArray.length === 0) {
        throw new Error('Jupiter has no moons array according to the API (unexpected).');
      }
  
      let largestMoonName = null;
      let largestMoonRadius = -Infinity;
  
      for (const moonObj of moonsArray) {
        const moonName = moonObj.moon;
        const moonUrl = moonObj.rel;
  
        const moonRes = await fetch(moonUrl);
        if (!moonRes.ok) {
          throw new Error(`Error fetching moon data for ${moonName}: ${moonRes.statusText}`);
        }
        const moonData = await moonRes.json();
  
        const radius = moonData.meanRadius || 0;
        if (radius > largestMoonRadius) {
          largestMoonRadius = radius;
          largestMoonName = moonData.englishName || moonName;
        }
      }
  
      console.log(`Largest moon: ${largestMoonName}, radius = ${largestMoonRadius}`);
  
      const puzzle5AnswerData = await submitAnswer(largestMoonName);
      console.log('Response from /answer (Puzzle #5):', puzzle5AnswerData);
  
      fs.writeFileSync('skeletonkey.txt', largestMoonName);
      console.log(`Puzzle #5 key saved to skeletonkey.txt: ${largestMoonName}`);
  
      if (puzzle5AnswerData.nextChallenge) {
        console.log('\nNext Challenge:', puzzle5AnswerData.nextChallenge);
  
        const puzzle6Text = puzzle5AnswerData.nextChallenge.toLowerCase();
        if (puzzle6Text.includes('classification')) {
          await solvePuzzle6();
        } else {
          console.log('\nA different puzzle was returned after Puzzle #5. Implement if needed.\n');
        }
      }
  
      return puzzle5AnswerData;
    } catch (error) {
      console.error('An error occurred in solvePuzzle5():', error);
    }
  }
  
  /**
   * Puzzle #6: "Find Pluto’s classification."
   */
  async function solvePuzzle6() {
    try {
      console.log('\n--- Puzzle #6: Pluto’s Classification ---\n');
  
      const plutoUrl = 'https://api.le-systeme-solaire.net/rest/bodies/pluton';
      console.log(`Fetching Pluto data: ${plutoUrl}`);
      const plutoRes = await fetch(plutoUrl);
      if (!plutoRes.ok) {
        throw new Error(`Solar System API (Pluto) error: ${plutoRes.statusText}`);
      }
      const plutoData = await plutoRes.json();
  
      const classification = plutoData.bodyType;
      console.log(`Puzzle #6: Pluto's classification is "${classification}".`);
  
      const puzzle6AnswerData = await submitAnswer(classification);
      console.log('Response from /answer (Puzzle #6):', puzzle6AnswerData);
  
      fs.writeFileSync('skeletonkey.txt', classification);
      console.log(`Puzzle #6 key saved to skeletonkey.txt: ${classification}`);
  
      if (puzzle6AnswerData.nextChallenge) {
        console.log('\nNext Challenge:', puzzle6AnswerData.nextChallenge);
      }
  
      return puzzle6AnswerData;
    } catch (error) {
      console.error('An error occurred in solvePuzzle6():', error);
    }
  }
  
  startChallenge();
  