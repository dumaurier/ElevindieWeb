function toISOString(date) {
  return new Date(date).toISOString();
}

function formatDate(date, format) {
  var d = new Date(date);
  var options = {};

  if (format === 'DD / MM / YYYY') {
    var day = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year = d.getFullYear();
    return day + ' / ' + month + ' / ' + year;
  }

  // Default: readable date
  options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

module.exports = { toISOString, formatDate };
