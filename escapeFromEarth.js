const fetch = require('node-fetch');
const fs = require('fs');

const playerEmail = 'emmasod@uia.no';

async function solvePuzzle1() {
  try {
    const startUrl = `https://spacescavanger.onrender.com/start?player=${encodeURIComponent(playerEmail)}`;
    const startRes = await fetch(startUrl);
    if (!startRes.ok) {
      throw new Error(`Start endpoint error: ${startRes.statusText}`);
    }
    const startData = await startRes.json();
    console.log('Response from /start:', startData);

    if (
      startData.challenge &&
      startData.challenge.includes('difference between the equatorial radius and the mean radius of the Sun')
    ) {
      const sunUrl = 'https://api.le-systeme-solaire.net/rest/bodies/soleil';
      const sunRes = await fetch(sunUrl);
      if (!sunRes.ok) {
        throw new Error(`Solar System API (Sun) error: ${sunRes.statusText}`);
      }
      const sunData = await sunRes.json();

      const difference = Math.abs(sunData.equaRadius - sunData.meanRadius);

      const answerUrl = 'https://spacescavanger.onrender.com/answer';
      const answerRes = await fetch(answerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: difference,
          player: playerEmail
        })
      });
      if (!answerRes.ok) {
        throw new Error(`Answer endpoint error: ${answerRes.statusText}`);
      }
      const answerData = await answerRes.json();
      console.log('Response from /answer:', answerData);

      fs.writeFileSync('skeletonkey.txt', difference.toString());
      console.log('Puzzle #1 key saved to skeletonkey.txt');
    } else {
      console.log("Puzzle #1 wasn't requested by /start, or the message is different.");
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

solvePuzzle1();
