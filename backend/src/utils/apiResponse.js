/**
 * Every success response has the shape:
 *   { success: true, message, data, [pagination], [warnings] }
 */
function sendSuccess(res, { status = 200, message = 'Success', data = null, pagination, warnings } = {}) {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  if (warnings && warnings.length) body.warnings = warnings;
  return res.status(status).json(body);
}

const created = (res, message, data, extra = {}) => sendSuccess(res, { status: 201, message, data, ...extra });
const ok = (res, message, data, extra = {}) => sendSuccess(res, { status: 200, message, data, ...extra });

module.exports = { sendSuccess, ok, created };
