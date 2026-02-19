/**
 * Returns aria-current attribute for active navigation links.
 */
function getLinkActiveState(itemUrl, pageUrl) {
  let response = '';
  if (typeof pageUrl === 'string') {
    if (itemUrl === pageUrl) {
      response = ' aria-current="page"';
    }
    if (itemUrl.length > 1 && pageUrl.startsWith(itemUrl)) {
      response = ' aria-current="page" data-state="active"';
    }
  }
  return response;
}

/**
 * Filters a collection by front matter keys.
 */
function filterCollectionByKeys(collection, keys) {
  return collection.filter(function (item) {
    return keys.includes(item.data.key);
  });
}

/**
 * Generates a random hash for cache busting.
 */
function random() {
  var segment = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return segment() + '-' + segment() + '-' + segment();
}

module.exports = {
  getLinkActiveState,
  filterCollectionByKeys,
  random
};
