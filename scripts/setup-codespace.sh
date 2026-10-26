#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
npm --prefix backend ci
npm --prefix frontend ci
node --input-type=module <<'JS'
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
if(!fs.existsSync('backend/.env'))fs.writeFileSync('backend/.env',`PORT=4000\nFRONTEND_URL=http://localhost:5173\nDEMO_DATA=true\nJWT_SECRET=${randomBytes(32).toString('hex')}\n`);
JS
