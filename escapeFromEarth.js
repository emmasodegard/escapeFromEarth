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

    // ------------------------------------------------------------
    //Puzzle #1 - Sun radius difference
    // ------------------------------------------------------------
    if (puzzleText.includes('difference between the equatorial radius and the mean radius of the Sun')) {
      console.log('\n--- Puzzle #1 detected: Sun radius difference ---\n');

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

      const puzzle1AnswerData = await submitAnswer(difference);
      console.log('Response from /answer (Puzzle #1):', puzzle1AnswerData);

      fs.writeFileSync('skeletonkey.txt', difference.toString());
      console.log(`Puzzle #1 key saved to skeletonkey.txt: ${difference}`);

      if (puzzle1AnswerData.nextChallenge) {
        const puzzle2Text = puzzle1AnswerData.nextChallenge;
        if (puzzle2Text.toLowerCase().includes('closest in scale to earths axial tilt')) {
          await solvePuzzle2();
        } else {
          console.log("\nA different nextChallenge was given. You may need to implement Puzzle #3 or more.\n");
        }
      }
    } else if (puzzleText.toLowerCase().includes('closest in scale to earths axial tilt')) {
      console.log('\n--- Puzzle #2 detected: Earth’s axial tilt ---\n');
      await solvePuzzle2();
    } else {
      console.log("\nThe puzzle text doesn't match Puzzle #1 or Puzzle #2.\n" +
        "Make sure you're on the correct puzzle or implement the next puzzle logic.\n");
    }

  } catch (error) {
    console.error('An error occurred in startChallenge():', error);
  }
}

async function submitAnswer(answerValue) {
  const answerUrl = 'https://spacescavanger.onrender.com/answer';
  console.log(`\nSubmitting answer "${answerValue}" to: ${answerUrl}`);
  const answerRes = await fetch(answerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answer: answerValue,
      player: playerEmail
    })
  });
  if (!answerRes.ok) {
    throw new Error(`Answer endpoint error: ${answerRes.statusText}`);
  }
  return await answerRes.json();
}

/**
 * Puzzle #2: "Find which planet has an axial tilt closest to Earth."
 */
async function solvePuzzle2() {
  try {
    console.log('\n--- Solving Puzzle #2: Closest Axial Tilt to Earth ---\n');

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
      if (planet.id === 'terre') {
        continue;
      }
      if (typeof planet.axialTilt !== 'number') {
        continue;
      }
      const diff = Math.abs(planet.axialTilt - earthTilt);
      if (diff < minDiff) {
        minDiff = diff;
        closestPlanet = planet.englishName;
      }
    }

    console.log(`Planet closest to Earth's tilt: ${closestPlanet}, difference: ${minDiff}`);

    const puzzle2AnswerData = await submitAnswer(closestPlanet);
    console.log('Response from /answer (Puzzle #2):', puzzle2AnswerData);

    fs.writeFileSync('skeletonkey.txt', closestPlanet);
    console.log(`Puzzle #2 key saved to skeletonkey.txt: ${closestPlanet}`);


    if (puzzle2AnswerData.nextChallenge) {
      console.log('\nNext Challenge:', puzzle2AnswerData.nextChallenge);
    }

  } catch (error) {
    console.error('An error occurred in solvePuzzle2():', error);
  }
}

startChallenge();
