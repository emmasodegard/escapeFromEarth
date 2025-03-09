/**
 * Escape from Earth Assignment
 *
 * This script performs the following steps:
 * 1. Initiates the mission by calling the RIS's /start endpoint with our student email.
 * 2. Retrieves data from the Solar System API (using Pluto as an example).
 * 3. Processes the retrieved data (extracts Pluto's mean radius) to compute a unique skeleton key.
 * 4. Submits the computed key to the RIS's /answer endpoint.
 * 5. Saves the skeleton key in a file named skeletonkey.txt.
 *
 */

const fetch = require('node-fetch');
const fs = require('fs');

const playerEmail = 'emmasod@uia.no';

async function startChallenge() {
  try {
    const startUrl = `https://spacescavanger.onrender.com/start?player=${encodeURIComponent(playerEmail)}`;
    console.log(`Calling start endpoint: ${startUrl}`);
    
    const startResponse = await fetch(startUrl);
    if (!startResponse.ok) {
      throw new Error(`Start endpoint error: ${startResponse.statusText}`);
    }
    const startData = await startResponse.json();
    console.log('Response from /start:', startData);

    const plutoUrl = 'https://api.le-systeme-solaire.net/rest/bodies/pluton';
    console.log(`Fetching data from Solar System API: ${plutoUrl}`);
    
    const plutoResponse = await fetch(plutoUrl);
    if (!plutoResponse.ok) {
      throw new Error(`Solar System API error: ${plutoResponse.statusText}`);
    }

    const plutoData = await plutoResponse.json();
    console.log('Pluto data:', plutoData);

    const meanRadius = plutoData.meanRadius;
    if (!meanRadius) {
      throw new Error('Mean radius not found in Pluto data.');
    }
    
    const skeletonKey = `${playerEmail}_${meanRadius}`;
    console.log('Computed skeleton key:', skeletonKey);

    const answerUrl = 'https://spacescavanger.onrender.com/answer';
    console.log(`Submitting key to: ${answerUrl}`);
    
    const answerResponse = await fetch(answerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        answer: skeletonKey,
        player: playerEmail
      })
    });
    
    if (!answerResponse.ok) {
      throw new Error(`Answer endpoint error: ${answerResponse.statusText}`);
    }
    const answerData = await answerResponse.json();
    console.log('Response from /answer:', answerData);

    fs.writeFileSync('skeletonkey.txt', skeletonKey);
    console.log('Skeleton key saved to skeletonkey.txt');

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

startChallenge();
