// Подключаем gulp
var gulp = require('gulp');

// gulp build (вторым параметром в массив передаются задачи которые запускаются перед выполнением данной задачи)
gulp.task('build', ['scripts', 'styles', 'vendor', 'fonts']);

// Команда по умолчанию, то что будет происходить если написать просто gulp
gulp.task('default', ['build']);