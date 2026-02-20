const path = require('node:path');
const Image = require('@11ty/eleventy-img');

async function image(src, alt, attrs = {}) {
  if (!alt && alt !== '') {
    throw new Error(`Missing alt text for image: ${src}`);
  }

  let widths = attrs.widths || [null];
  let sizes = attrs.sizes || '100vw';

  let metadata = await Image(src, {
    widths,
    formats: ['avif', 'webp', 'jpeg'],
    outputDir: '_site/assets/images/',
    urlPath: '/assets/images/'
  });

  let htmlAttrs = {
    alt,
    sizes,
    loading: attrs.loading || 'lazy',
    decoding: attrs.decoding || 'async'
  };

  if (attrs.class) htmlAttrs.class = attrs.class;

  return Image.generateHTML(metadata, htmlAttrs);
}

module.exports = { image };
