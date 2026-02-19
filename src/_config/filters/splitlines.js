/**
 * Splits a string into lines of a maximum character length.
 * Used by the OG image SVG template.
 */
function splitlines(input, maxCharLength) {
  var words = input.split(' ');
  var lines = [];
  var currentLine = '';

  words.forEach(function (word) {
    if ((currentLine + ' ' + word).trim().length > maxCharLength) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + ' ' + word).trim();
    }
  });

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  return lines;
}

module.exports = { splitlines };
