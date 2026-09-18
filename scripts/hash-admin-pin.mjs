import { randomBytes, scryptSync } from 'node:crypto';

const pin = process.env.GOATPATH_ADMIN_PIN;
if (!pin || pin.length < 6 || pin.length > 128) {
  console.error('Set GOATPATH_ADMIN_PIN to a 6-128 character value before running this script.');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(pin, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
process.stdout.write(`${salt.toString('base64url')}.${hash.toString('base64url')}\n`);
