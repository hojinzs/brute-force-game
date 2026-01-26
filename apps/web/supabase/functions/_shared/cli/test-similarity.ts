#!/usr/bin/env tsx

import { calculateSimilarity } from '../utils/similarity';

const args = process.argv.slice(2);

if (args.length !== 2) {
  console.error('Usage: ts-node test-similarity.ts <input> <answer>');
  console.error('Example: ts-node test-similarity.ts "password123" "password124"');
  process.exit(1);
}

const [input, answer] = args;
const similarity = calculateSimilarity(input, answer);

console.log(`Input:      "${input}"`);
console.log(`Answer:     "${answer}"`);
console.log(`Similarity: ${similarity}%`);
