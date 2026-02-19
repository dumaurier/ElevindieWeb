const EleventyFetch = require('@11ty/eleventy-fetch');

module.exports = async function () {
  var domain = (process.env.URL)
    ? new URL(process.env.URL).hostname
    : 'localhost';
  var token = process.env.WEBMENTION_IO_TOKEN;

  if (!token) {
    console.log('No WEBMENTION_IO_TOKEN set — skipping webmention fetch');
    return [];
  }

  var url = 'https://webmention.io/api/mentions.jf2'
    + '?domain=' + domain
    + '&token=' + token
    + '&per-page=1000';

  try {
    var feed = await EleventyFetch(url, {
      duration: '1h',
      type: 'json'
    });
    return feed.children || [];
  } catch (error) {
    console.log('Webmention fetch failed:', error.message);
    return [];
  }
};
