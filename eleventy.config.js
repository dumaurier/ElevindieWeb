const yaml = require('js-yaml');
const rssPlugin = require('@11ty/eleventy-plugin-rss');
const { getAllPosts, getAllNotes, getAllBookmarks, getAllContent, showInSitemap, tagList } = require('./src/_config/collections');
const filters = require('./src/_config/filters');
const { year } = require('./src/_config/shortcodes');
const events = require('./src/_config/events');

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(rssPlugin);
  // Build events
  eleventyConfig.on('eleventy.after', async function () {
    await events.svgToJpeg();
  });

  // Watch targets
  eleventyConfig.addWatchTarget('./src/assets/**/*.css');

  // Layout aliases
  eleventyConfig.addLayoutAlias('base', 'base.njk');
  eleventyConfig.addLayoutAlias('post', 'post.njk');

  // Collections
  eleventyConfig.addCollection('allPosts', getAllPosts);
  eleventyConfig.addCollection('allNotes', getAllNotes);
  eleventyConfig.addCollection('allBookmarks', getAllBookmarks);
  eleventyConfig.addCollection('allContent', getAllContent);
  eleventyConfig.addCollection('showInSitemap', showInSitemap);
  eleventyConfig.addCollection('tagList', tagList);

  // Filters
  eleventyConfig.addFilter('toISOString', filters.toISOString);
  eleventyConfig.addFilter('formatDate', filters.formatDate);
  eleventyConfig.addFilter('splitlines', filters.splitlines);
  eleventyConfig.addFilter('slugify', filters.slugify);
  eleventyConfig.addFilter('head', filters.head);
  eleventyConfig.addFilter('getWebmentionsForUrl', filters.getWebmentionsForUrl);
  eleventyConfig.addFilter('getWebmentionsByType', filters.getWebmentionsByType);

  // Shortcodes
  eleventyConfig.addShortcode('year', year);

  // Per-page CSS bundling
  eleventyConfig.addBundle('css', { hoist: true });

  // YAML data file support
  eleventyConfig.addDataExtension('yaml', function (contents) {
    return yaml.load(contents);
  });

  // Passthrough copy
  eleventyConfig.addPassthroughCopy('src/assets');

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
      output: '_site'
    },
    templateFormats: ['njk', 'liquid', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
};
