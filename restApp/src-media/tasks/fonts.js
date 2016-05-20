var gulp = require('gulp'),
	$ = require('gulp-load-plugins')(); // автоматическая загрузка плагинов gulp

gulp.task('fonts', function () {
	return gulp.src(['../../src-media/fonts/**/*'])
		.pipe(gulp.dest('../web/fonts/')); // Путь до компилированных скриптов
});