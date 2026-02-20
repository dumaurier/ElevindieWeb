function getAllPosts(collectionApi) {
  return collectionApi.getFilteredByGlob('src/posts/**/*.md').reverse();
}

function getAllNotes(collectionApi) {
  return collectionApi.getFilteredByGlob('src/notes/**/*.md').reverse();
}

function getAllBookmarks(collectionApi) {
  return collectionApi.getFilteredByGlob('src/bookmarks/**/*.md').reverse();
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
          return !['posts', 'notes', 'bookmarks', 'all'].includes(tag);
        })
        .forEach(function (tag) {
          tags.add(tag);
        });
    }
  });
  return Array.from(tags).sort();
}

function getAllContent(collectionApi) {
  return [
    ...collectionApi.getFilteredByGlob('src/posts/**/*.md'),
    ...collectionApi.getFilteredByGlob('src/notes/**/*.md'),
    ...collectionApi.getFilteredByGlob('src/bookmarks/**/*.md')
  ].sort(function (a, b) {
    return b.date - a.date;
  });
}

module.exports = { getAllPosts, getAllNotes, getAllBookmarks, getAllContent, showInSitemap, tagList };
