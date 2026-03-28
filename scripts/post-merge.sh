#!/bin/bash
set -e
npm install
npx prisma generate
node scripts/patch-next-hydration.js
