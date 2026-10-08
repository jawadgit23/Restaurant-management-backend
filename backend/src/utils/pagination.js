const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function getPagination(query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function buildPagination({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

module.exports = { getPagination, buildPagination };
