const url = process.env.URL || 'http://localhost:8080';
const domain = new URL(url).hostname;

module.exports = {
  url,
  domain,
  siteName: 'pants pants pants',
  siteDescription: 'pants pants pants',
  lang: 'en',
  author: {
    name: 'pants pants pants',
    email: 'pants@pants.pants',
    website: url,
    photo: '/assets/images/pants.jpg',
    note: 'pants pants pants',
    relMe: [
      { name: 'GitHub', url: 'https://github.com/pants' },
      { name: 'Mastodon', url: 'https://mastodon.social/@pants' }
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
  }
};
