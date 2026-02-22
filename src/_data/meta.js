const url = process.env.URL || 'http://localhost:8080';
const domain = new URL(url).hostname;

module.exports = {
  url,
  domain,
  siteName: 'ElevIndieWeb Starter',
  siteDescription: 'An Eleventy Starter for IndieWeb with support for WebMentions, IndieAuth and MicroPub.',
  lang: 'en',
  author: {
    name: 'Josh Vogt',
    email: 'joshcvogt@proton.me',
    website: url,
    photo: '/assets/images/avatar.jpg',
    note: 'Developer from Toronto.',
    relMe: [
      { name: 'GitHub', url: 'https://github.com/dumaurier' },
      { name: 'Mastodon', url: 'https://mastodon.social/@joshvogt' },
      { name: 'BlueSky', url: 'https://bsky.app/profile/joshuavogt.bsky.social'}
    ],
    // Add any other Social Media profiles you have...or don't...up to you
    social: [
      { name: 'TikTok', url: 'https://www.tiktok.com/@inactionman_yyz' },
      { name: 'Mastodon', url: 'https://mastodon.social/@joshvogt' },
      { name: 'BlueSky', url: 'https://bsky.app/profile/joshuavogt.bsky.social'}
    ]
  },
  // IndieAuth endpoints — default to indieauth.com, swap if self-hosting
  indieAuth: {
    authorizationEndpoint: 'https://indieauth.com/auth',
    tokenEndpoint: 'https://tokens.indieauth.com/token'
  },
  // Webmention — set WEBMENTION_IO_TOKEN env var for build-time fetching
  webmention: {
    endpoint: 'https://webmention.io'
  },
  // Micropub endpoint — for publishing from Micropub clients
  micropub: {
    endpoint: '/micropub'
  }
};
