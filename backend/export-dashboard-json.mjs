import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(__dirname, 'src/main/resources/data/dashboard-data.json');
const dashboardData = JSON.parse(readFileSync(sourcePath, 'utf8'));

console.log('Read dashboard JSON from:', sourcePath);
console.log('Top-level keys:', Object.keys(dashboardData).join(', '));
