const { toISOString, formatDate } = require('./filters/dates');
const { splitlines } = require('./filters/splitlines');
const { slugify } = require('./filters/slugify');
const { getWebmentionsForUrl, getWebmentionsByType } = require('./filters/webmentions');

module.exports = {
  toISOString,
  formatDate,
  splitlines,
  slugify,
  getWebmentionsForUrl,
  getWebmentionsByType
};
