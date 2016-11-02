var gulp = require('gulp');
var zip  = require('gulp-zip');

gulp.task('default', function() {
  var sources = ['places.js', 'index.js',
   'package.json', 'node_modules/**/*.*'];
  return gulp.src(sources, {base: "./"})
    .pipe(zip('output.zip'))
    .pipe(gulp.dest('dist'));
});
