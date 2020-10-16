'use strict';

// Dependencies
const gulp = require('gulp');
const raster = require('gulp-raster-update');
const rename = require('gulp-rename');

const svgFiles = [
  './src/logo.svg'
];

// Convert SVG
gulp.task('default', (done) => {
  gulp.src(svgFiles)
    .pipe(raster())
    .pipe(rename('logo.png'))
    .pipe(gulp.dest('./images'));
  done();
});
