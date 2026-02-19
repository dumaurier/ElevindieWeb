const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const Image = require('@11ty/eleventy-img');

const ogImagesDir = './src/assets/og-images';

async function svgToJpeg() {
  var socialPreviewImagesDir = '_site/assets/og-images/';

  if (!fs.existsSync(socialPreviewImagesDir)) {
    console.log('No OG images dir found');
    return;
  }

  var files = await fsPromises.readdir(socialPreviewImagesDir);
  if (files.length === 0) {
    console.log('No images found in OG images dir');
    return;
  }

  for (var filename of files) {
    if (!filename.endsWith('.svg')) continue;

    var outputFilename = filename.substring(0, filename.length - 4);
    var outputPath = path.join(ogImagesDir, outputFilename + '.jpeg');

    if (!fs.existsSync(outputPath)) {
      var imageUrl = socialPreviewImagesDir + filename;
      await Image(imageUrl, {
        formats: ['jpeg'],
        outputDir: ogImagesDir,
        filenameFormat: function () {
          return outputFilename + '.jpeg';
        }
      });
    }
  }
}

module.exports = { svgToJpeg };
