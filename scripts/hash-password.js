#!/usr/bin/env node
/* Generates a bcrypt hash for ADMIN_PASSWORD_HASH. Run locally, never commit
   the plaintext or the hash to source control:
     node scripts/hash-password.js "your-admin-password"
*/
const bcrypt = require('bcryptjs');
const pw = process.argv[2];
if (!pw) { console.error('Usage: node scripts/hash-password.js "your-password"'); process.exit(1); }
console.log(bcrypt.hashSync(pw, 10));
