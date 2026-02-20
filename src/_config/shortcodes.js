const { image } = require('./shortcodes/image');

function year() {
  return String(new Date().getFullYear());
}

module.exports = { year, image };
