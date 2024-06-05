#!/usr/bin/env -S pnpm tsx
import { Stagehand } from '../lib';
import { z } from 'zod';

async function example() {
  const stagehand = new Stagehand({ env: 'BROWSERBASE', verbose: true });
  await stagehand.init();
  await stagehand.page.goto('https://www.nytimes.com/games/wordle/index.html');
  await stagehand.act({ action: 'start the game' });
  await stagehand.act({ action: 'close tutorial popup' });
  let guesses: { guess: string | null; description: string | null }[] = [];
  for (let i = 0; i < 5; i++) {
    const guess = await stagehand.extract({
      instruction: 'extract the last guess',
      schema: z.object({
        guess: z.string().describe('the raw guess').nullable(),
        description: z
          .string()
          .describe('what was wrong and right about the guess')
          .nullable(),
        isCorrect: z
          .boolean()
          .describe('true when all letters in a guess are correct')
          .nullable(),
      }),
    });

    if (guess.isCorrect) {
      break;
    }
    guesses.push({ guess: guess.guess, description: guess.description });
    const prompt = `I'm trying to win wordle. what english word should I guess given the following state? Don't repeat guesses
          guesses: \n ${guesses.map((g, index) => `${index + 1}: ${g.guess} ${g.description}`).join('\n')}
        `;
    const response = await stagehand.ask(prompt);
    if (!response) {
      throw new Error('no response when asking for a guess');
    }

    await stagehand.page.locator('body').pressSequentially(response);
    await stagehand.page.keyboard.press('Enter');
  }
}

async function debug() {
  const stagehand = new Stagehand({ env: 'LOCAL', verbose: true });
  await stagehand.init();
  await stagehand.page.goto('https://chefstoys.com/');
  await stagehand.act({
    action: 'run a search for peelers',
  });
  await new Promise((resolve) => setTimeout(resolve, 30000));
}

(async () => {
  await debug();
})();
