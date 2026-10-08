// Escape user input before using it inside a RegExp (prevents ReDoS / regex injection)
module.exports = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
