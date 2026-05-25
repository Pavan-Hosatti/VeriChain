const nacl = require('tweetnacl');

function b64(s) { return Buffer.from(s, 'base64'); }

const pubB64 = process.env.ISSUER_PUBLIC_BASE64 || null;
const secB64 = process.env.ISSUER_SECRET_BASE64 || null;

console.log('ISSUER_PUBLIC_BASE64 present:', !!pubB64);
console.log('ISSUER_SECRET_BASE64 present:', !!secB64);

if (!pubB64 || !secB64) {
  console.log('\nNo env-based issuer keys found. To test, set ISSUER_PUBLIC_BASE64 and ISSUER_SECRET_BASE64 in your environment.');
  process.exit(0);
}

try {
  const pub = b64(pubB64);
  const sec = b64(secB64);
  if (sec.length !== 64) {
    console.error('Unexpected secret length:', sec.length, 'bytes (expected 64).');
    process.exit(2);
  }

  const message = Buffer.from('test-signing-' + Date.now());
  const sig = nacl.sign.detached(message, new Uint8Array(sec));
  const ok = nacl.sign.detached.verify(message, sig, new Uint8Array(pub));
  console.log('\nSign/verify roundtrip result:', ok ? 'OK' : 'FAIL');
  console.log('Signature (base64):', Buffer.from(sig).toString('base64'));
} catch (err) {
  console.error('Error while testing keys:', err);
  process.exit(3);
}
