var gulp = require('gulp'),
	$ = require('gulp-load-plugins')(); // автоматическая загрузка плагинов gulp

gulp.task('scripts', function () {
	return gulp.src(['src/js/*.js'])
		.pipe($.concat('script.js')) // Объединяем в один файл
		.pipe($.uglify()) // Минификация
		.pipe(gulp.dest('../web/js/')); // Путь до компилированных скриптов
//		.pipe($.connect.reload()); // Перезагружаем сервер
});

gulp.task('vendor', function () {
	return gulp.src(['src/vendor-script/*.js'])
		.pipe($.concat('vendor-bild.js'))
		.pipe($.uglify())
		.pipe(gulp.dest('../web/js/'));
});
