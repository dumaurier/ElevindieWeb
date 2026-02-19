(function () {
  'use strict';

  var container = document.querySelector('.webmentions[data-webmention-url]');
  if (!container) return;

  var targetUrl = container.getAttribute('data-webmention-url');
  var apiUrl = 'https://webmention.io/api/mentions.jf2?target=' + encodeURIComponent(targetUrl) + '&per-page=200';

  fetch(apiUrl)
    .then(function (response) { return response.json(); })
    .then(function (feed) {
      var mentions = feed.children || [];
      if (mentions.length === 0) return;

      var likes = filterByType(mentions, 'like-of');
      var reposts = filterByType(mentions, 'repost-of');
      var replies = filterByType(mentions, 'in-reply-to');
      var bookmarks = filterByType(mentions, 'bookmark-of');

      var html = '';
      html += renderFacepile('Likes', likes);
      html += renderFacepile('Reposts', reposts);
      html += renderFacepile('Bookmarks', bookmarks);
      html += renderReplies(replies);

      if (html) {
        container.innerHTML = html;
      }
    })
    .catch(function () {
      // Silently fail — build-time mentions still visible
    });

  function filterByType(mentions, type) {
    return mentions.filter(function (m) { return m['wm-property'] === type; });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function renderFacepile(label, items) {
    if (items.length === 0) return '';
    var html = '<section aria-label="' + label + '">';
    html += '<h3>' + label + ' (' + items.length + ')</h3>';
    html += '<ul role="list">';
    items.forEach(function (item) {
      if (!item.author) return;
      html += '<li>';
      html += '<a href="' + escapeHtml(item.author.url) + '">';
      if (item.author.photo) {
        html += '<img src="' + escapeHtml(item.author.photo) + '" alt="' + escapeHtml(item.author.name) + '" width="32" height="32" loading="lazy">';
      }
      html += escapeHtml(item.author.name);
      html += '</a></li>';
    });
    html += '</ul></section>';
    return html;
  }

  function renderReplies(items) {
    if (items.length === 0) return '';
    var html = '<section aria-label="Replies">';
    html += '<h3>Replies (' + items.length + ')</h3>';
    html += '<ol role="list">';
    items.forEach(function (item) {
      html += '<li class="h-cite">';
      if (item.author) {
        html += '<p>';
        html += '<a class="p-author h-card" href="' + escapeHtml(item.author.url) + '">';
        if (item.author.photo) {
          html += '<img src="' + escapeHtml(item.author.photo) + '" alt="' + escapeHtml(item.author.name) + '" width="32" height="32" loading="lazy">';
        }
        html += escapeHtml(item.author.name) + '</a>';
        if (item.published) {
          html += ' <time class="dt-published" datetime="' + escapeHtml(item.published) + '">' + new Date(item.published).toLocaleDateString() + '</time>';
        }
        html += '</p>';
      }
      if (item.content && item.content.text) {
        html += '<p class="p-content">' + escapeHtml(item.content.text) + '</p>';
      }
      if (item.url) {
        html += '<a class="u-url" href="' + escapeHtml(item.url) + '">View original</a>';
      }
      html += '</li>';
    });
    html += '</ol></section>';
    return html;
  }
})();
