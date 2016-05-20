var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var minimist = require('minimist');
var ngAnnotate = require('gulp-ng-annotate');

$ = require('gulp-load-plugins')();

var bundles;

var destinations = {
    "restApp": "../restApp/web/assets/"
};

var options = minimist(process.argv.slice(2));

gulp.task('default', ['js', 'css', 'fonts', 'copy', 'less-compile', 'images']);

gulp.task('load-bundles', function (cb) {
    fs.readFile( __dirname + '/bundles.json', function (err, data) {
        bundles = JSON.parse(data);
        cb();
    });
});

gulp.task('js', ['load-bundles'], function (cb) {
    var js;

    each(bundles, function (name, bundle) {
        js = [];
        if(bundle.compiled === true && bundle.apps != undefined) {

            if (!checkApp(bundle) || !checkBundleName(name)) {
                return false;
            }

            if(bundle.require != undefined) {
                js = loadDependency(bundle.require, 'js');
            }

            if(bundle.js) {
                js = js.length ? js.concat(bundle.js) : bundle.js;
            }

            if (js.length) {
                var compile = gulp.src(js)
                        //.pipe($.sourcemaps.init())
                        .pipe(ngAnnotate())
                        .pipe($.sourcemaps.write())
                        .pipe($.concat(name + '.js'))
                ;

                if (options.minify != undefined) {
                    compile.pipe($.uglify())
                }

                each(bundle.apps, function (i, app) {
                    compile.pipe(gulp.dest(destinations[app] + name));
                })
            }
        }
    });
    cb();
});

gulp.task('css', ['load-bundles'], function (cb) {
    var css;
    each(bundles, function (name, bundle) {
        css = [];
        if(bundle.compiled === true && bundle.apps != undefined) {
            if (!checkApp(bundle) || !checkBundleName(name)) {
                return false;
            }

            if(bundle.require != undefined) {
                css = loadDependency(bundle.require, 'css').reverse();
            }
            if(bundle.css) {
                css = css.length ? css.concat(bundle.css) : bundle.css;
            }

            if(css.length) {
                var compile = gulp.src(css)
                    .pipe($.concat(name + '.css'))
                    .pipe($.csso())
                ;

                each(bundle.apps, function (i, app) {
                    compile.pipe(gulp.dest(destinations[app] + name));
                })
            }
        }
    });
    cb();
});

gulp.task('less-compile', ['load-bundles'], function (cb) {
    var less;
    each(bundles, function (name, bundle) {
        less = [];
        if(bundle.compiled === true && bundle.apps != undefined) {
            if (!checkApp(bundle) || !checkBundleName(name)) {
                return false;
            }

            if(bundle.require != undefined) {
                less = loadDependency(bundle.require, 'less');
            }
            if(bundle.less) {
                less = less.length ? less.concat(bundle.less) : bundle.less;
            }
            if(less.length) {
                var compile = gulp.src(less)
                    .pipe($.concat(name + '.compile.css'))
                    .pipe($.less())
                    .pipe($.csso())
                ;

                each(bundle.apps, function (i, app) {
                    compile.pipe(gulp.dest(destinations[app] + name));
                });
            }
        }
    });
    cb();
});

gulp.task('fonts', ['load-bundles'], function (cb) {
    var fonts;
    each(bundles, function (name, bundle) {
        fonts = [];
        if(bundle.compiled === true) {
            if (!checkApp(bundle) || !checkBundleName(name)) {
                return false;
            }

            if(bundle.require != undefined) {
                fonts = loadDependency(bundle.require, 'fonts').reverse();
            }
            if(bundle.fonts) {
                fonts = fonts.length ? fonts.concat(bundle.fonts) : bundle.fonts;
            }
            if (fonts.length) {
                var compile = gulp.src(fonts);

				each(bundle.apps, function (i, app) {
					compile.pipe(gulp.dest(destinations[app] + name + '/fonts'));
				});

            }
        }
    });
    cb();
});

gulp.task('copy', ['load-bundles'], function (cb) {
    var copy;
    each(bundles, function (name, bundle) {
        copy = [];
        if(bundle.compiled === true) {
            if (!checkApp(bundle) || !checkBundleName(name)) {
                return false;
            }
            if(bundle.require != undefined) {
                copy = loadDependency(bundle.require, 'copy').reverse();
            }
            if(bundle.copy) {
                copy = copy.length ? copy.concat(bundle.copy) : bundle.copy;
            }
            if (copy.length) {
                each(bundle.apps, function (i, app) {
                    each(copy, function (i, source) {
                        source = source.split('|');
                        if(source.length > 1) {
                            var compile = gulp.src(source[0]);
                            compile.pipe(gulp.dest(destinations[app] + name + '/' + source[1]));
                        } else {
                            var compile = gulp.src(source);
                            compile.pipe(gulp.dest(destinations[app] + name + '/'));
                        }
                    });
                });
            }
        }
    });
    cb();
});

gulp.task('images', ['load-bundles'], function (cb) {
    var images;
    each(bundles, function (name, bundle) {
        images = [];
        if(bundle.compiled === true) {
            if (!checkApp(bundle) || !checkBundleName(name)) {
                return false;
            }

            if(bundle.require != undefined) {
                images = loadDependency(bundle.require, 'images').reverse();
            }
            if(bundle.images) {
                images = images.length ? images.concat(bundle.images) : bundle.images;
            }
            if (images.length) {
				var compile = gulp.src(images);

				each(bundle.apps, function (i, app) {
					compile.pipe(gulp.dest(destinations[app] + name + '/images'));
				});
            }
        }
    });
    cb();
});

gulp.task('watch', ['js', 'css', 'fonts', 'copy', 'less-compile', 'images'], function () {
    gulp.watch('src/**/*.js', ['js']);
    gulp.watch('src/**/*.css', ['css']);
    gulp.watch('src/**/*.less', ['less-compile']);
    gulp.watch([
        'src/**/*.swg',
        'src/**/*.eot',
        'src/**/*.ttf',
        'src/**/*.woff'
    ], ['fonts']);
    gulp.watch([
        'src/**/*.jpg',
        'src/**/*.jpeg',
        'src/**/*.png',
        'src/**/*.gif',
        'src/**/*.svg'
    ], ['images']);
    gulp.watch('bundles.json', ['js', 'css', 'fonts', 'less-compile', 'images']);
});

function checkApp(bundle) {
    return (options.app == undefined || bundle.apps.indexOf(options.app) !== -1)
}

function checkBundleName(name) {
    return (options.bundle == undefined || name == options.bundle);
}

function each(array, callback) {
    for(var i in array) {
        callback(i, array[i]);
    }
}

function loadDependency(dependency, type)
{
    var dependencies = [];
    each(dependency, function (i, name) {
        if (bundles[name] != undefined) {
            if (bundles[name].require != undefined) {
                dependencies = dependencies.concat(loadDependency(bundles[name].require, type));
            }
            if (bundles[name][type] != undefined) {
                dependencies = dependencies.concat(bundles[name][type]);
            }
        }
    });

    var unique = [];
    each(dependencies, function (i, dependency) {
        if (unique.indexOf(dependency) === -1) {
            unique.push(dependency);
        }
    });

    return unique;
}
