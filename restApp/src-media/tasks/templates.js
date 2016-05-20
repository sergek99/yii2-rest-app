var gulp = require('gulp'),
	$ = require('gulp-load-plugins')();

gulp.task('templates', function () {
	return gulp.src('index.html')
		.pipe($.connect.reload());
});