var gulp = require('gulp'),
	$ = require('gulp-load-plugins')();

gulp.task('styles', function () {
	return gulp.src([
			'src/less/mixins.less',
            'src/less/fonts.less',
            'src/less/reset.less',
			'src/less/sprite.less',
			'src/less/*.less'
		])
		.pipe($.concat('style.css')) // Объединяем в один файл
		.pipe($.less()) // Запускаем less
		.on('error', function () {
			this.emit('end');
		})
		.pipe($.csso()) // Минификация
		.pipe(gulp.dest('../web/css/')); // Путь до компилированных стилей
//		.pipe($.connect.reload()); // перезагрузка сервера
});