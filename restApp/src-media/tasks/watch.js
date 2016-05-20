var gulp = require('gulp'),
	$ = require('gulp-load-plugins')();

gulp.task('watch', ['styles', 'scripts', 'vendor'], function() {
	//gulp.watch('src/images/sprite/*', ['sprite']);
	gulp.watch('src/js/*.js', ['scripts']);
	gulp.watch('src/less/*.less', ['styles']);
	//gulp.watch('src/images/*', ['images']);
	gulp.watch('src/vendor-script/*.js', ['vendor']);
	// gulp.watch('index.html', ['templates']);
});
