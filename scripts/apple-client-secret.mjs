#!/usr/bin/env node
// Generates the "Secret Key (for OAuth)" Supabase needs for Sign in with Apple.
// Apple client secrets are ES256 JWTs valid for at most 6 months — regenerate
// before they expire (put a reminder in your calendar).
//
//   node scripts/apple-client-secret.mjs \
//     --team ABCDE12345 --key-id XYZ987ABCD --services-id hk.leanbox.web --p8 ./AuthKey_XYZ987ABCD.p8
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => (cur.startsWith("--") ? [...acc, [cur.slice(2), all[i + 1]]] : acc), []),
);
const { team, "key-id": keyId, "services-id": servicesId, p8 } = args;
if (!team || !keyId || !servicesId || !p8) {
  console.error("Usage: --team <TeamID> --key-id <KeyID> --services-id <Services ID> --p8 <path to .p8>");
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const header = { alg: "ES256", kid: keyId, typ: "JWT" };
const payload = { iss: team, iat: now, exp: now + 60 * 60 * 24 * 180, aud: "https://appleid.apple.com", sub: servicesId };
const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
const key = createPrivateKey(readFileSync(p8, "utf8"));
const signature = sign("sha256", Buffer.from(input), { key, dsaEncoding: "ieee-p1363" });

console.log(`${input}.${b64url(signature)}`);
console.error(`\nExpires ${new Date(payload.exp * 1000).toISOString()} — paste the line above into Supabase → Auth → Providers → Apple → Secret Key.`);
