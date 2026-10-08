const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters

// e.g. ORD-260930-K7QX4M  (date + 6 random chars; collisions are retried by the caller)
function generateOrderNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 6; i += 1) suffix += ALPHABET[bytes[i] % ALPHABET.length];
  return `ORD-${yy}${mm}${dd}-${suffix}`;
}

module.exports = generateOrderNumber;
