/**
 * Filters webmentions for a specific page URL.
 */
function getWebmentionsForUrl(mentions, url) {
  if (!mentions || !url) return [];
  return mentions.filter(function (mention) {
    return mention['wm-target'] === url;
  });
}

/**
 * Filters webmentions by interaction type.
 * Types: 'like-of', 'repost-of', 'in-reply-to', 'bookmark-of', 'mention-of'
 */
function getWebmentionsByType(mentions, type) {
  if (!mentions) return [];
  return mentions.filter(function (mention) {
    return mention['wm-property'] === type;
  });
}

module.exports = { getWebmentionsForUrl, getWebmentionsByType };
