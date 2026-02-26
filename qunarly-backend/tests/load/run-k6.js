#!/usr/bin/env node
/**
 * Run k6 load tests via Docker.
 * Usage: npm run load:test [scenario]
 * Scenarios: smoke, seat-overflow, closing-race, double-join (default: smoke)
 *
 * Env: LOAD_VUS=5 (smoke) | 50 (stress-lite)
 *
 * Prerequisites: Docker, backend running on localhost:3000
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const scenarioArg = process.argv[2] || 'smoke';
const scenarioMap = {
  'seat-overflow': 'seat_overflow',
  'closing-race': 'closing_race',
  'double-join': 'double_join_same_passenger',
  'life-scenario': 'life_scenario',
  'life-scenario2': 'life_scenario2',
  smoke: 'smoke',
};
const scriptName = scenarioMap[scenarioArg] || scenarioArg;
const scenariosDir = path.join(__dirname, 'scenarios');
const scriptPath = path.join(scenariosDir, `${scriptName}.js`);

if (!fs.existsSync(scriptPath)) {
  console.error(`Scenario not found: ${scriptName}.js`);
  console.error(`Available: smoke, seat-overflow, closing-race, double-join, life-scenario, life-scenario2`);
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://host.docker.internal:3000';
const LOAD_VUS = process.env.LOAD_VUS || '';

// Get ROUTE_ID from load:seed
const seedResult = spawnSync('npx', ['ts-node', path.join(__dirname, 'seed-load-data.ts')], {
  cwd: path.join(__dirname, '..', '..'),
  encoding: 'utf8',
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
});
const stdout = (seedResult.stdout || '') + (seedResult.stderr || '');
const routeMatch = stdout.match(/ROUTE_ID=([a-f0-9-]+)/);
const ROUTE_ID = routeMatch ? routeMatch[1] : process.env.ROUTE_ID;
if (!ROUTE_ID) {
  console.error('Could not get ROUTE_ID from load:seed. Run: npm run load:seed');
  process.exit(1);
}
console.log(`ROUTE_ID=${ROUTE_ID}${LOAD_VUS ? ` LOAD_VUS=${LOAD_VUS}` : ''}`);

const dockerArgs = [
  'run',
  '--rm',
  '-i',
  '--add-host=host.docker.internal:host-gateway',
  '-e', `BASE_URL=${BASE_URL}`,
  '-e', `ROUTE_ID=${ROUTE_ID}`,
  ...(LOAD_VUS ? ['-e', `LOAD_VUS=${LOAD_VUS}`] : []),
  '-v', `${path.resolve(__dirname)}:/scripts`,
  'grafana/k6:latest',
  'run',
  `/scripts/scenarios/${scriptName}.js`,
];

console.log(`Running k6: ${scenarioArg} (${scriptName}.js)...`);
const result = spawnSync('docker', dockerArgs, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..', '..'),
});
process.exit(result.status || 0);
