function getAllPosts(collectionApi) {
  return collectionApi.getFilteredByGlob('src/posts/**/*.md').reverse();
}

function showInSitemap(collectionApi) {
  return collectionApi.getAll().filter(function (item) {
    return !item.data.eleventyExcludeFromCollections && item.url;
  });
}

function tagList(collectionApi) {
  var tags = new Set();
  collectionApi.getAll().forEach(function (item) {
    if (item.data.tags) {
      item.data.tags
        .filter(function (tag) {
          return !['posts', 'all'].includes(tag);
        })
        .forEach(function (tag) {
          tags.add(tag);
        });
    }
  });
  return Array.from(tags).sort();
}

module.exports = { getAllPosts, showInSitemap, tagList };
