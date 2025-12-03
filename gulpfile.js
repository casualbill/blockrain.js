var gulp = require('gulp'),
fs = require('fs'),
clean = require("gulp-clean"),
uglify = require("gulp-uglify"),
concat = require("gulp-concat"),
header = require("gulp-header"),
zip = require("gulp-zip");
 
var getVersion = function () {
    info = require("./package.json");
    return info.version;
};
var getCopyright = function () {
    return fs.readFileSync('Copyright');
};

gulp.task('js', function () {
    // Concatenate and Minify JS
    return gulp.src(['./src/blockrain.jquery.libs.js', './src/blockrain.jquery.src.js', './src/blockrain.jquery.themes.js'])
    .pipe(concat('blockrain.jquery.js'))
    .pipe(header(getCopyright(), {version: getVersion()}))
    .pipe(gulp.dest('./dist'))
    .pipe(uglify({
        output: {
            comments: false
        }
    }))
    .pipe(concat('blockrain.jquery.min.js'))
    .pipe(header(getCopyright(), {version: getVersion()}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('css', function () {
    // CSS
    return gulp.src(['./src/blockrain.css'])
    .pipe(gulp.dest('./dist'));
});

gulp.task('blocks', function () {
    // CSS
    return gulp.src(['./assets/blocks/custom/*.*'])
    .pipe(gulp.dest('./dist/assets/blocks/custom'));
});

gulp.task('readme', function () {
    // Readme
    return gulp.src(['./README.md'])
    .pipe(gulp.dest('./dist'));
});

gulp.task('clean', function () {
    return gulp.src('./dist', {read: false})
    .pipe(clean());
});

gulp.task('dist', function () {
    // Create a ZIP File
    return gulp.src(['./dist/**/*.*'])
    .pipe(zip('blockrain.zip'))
    .pipe(gulp.dest('./dist'));
});


gulp.task('build', gulp.series('clean', 
  gulp.parallel('js', 'css', 'blocks', 'readme'), 
  'dist'
));

// Development tasks (without minification and zip)
gulp.task('js-dev', function () {
    // Concatenate JS without minification
    return gulp.src(['./src/blockrain.jquery.libs.js', './src/blockrain.jquery.src.js', './src/blockrain.jquery.themes.js'])
    .pipe(concat('blockrain.jquery.js'))
    .pipe(header(getCopyright(), {version: getVersion()}))
    .pipe(gulp.dest('./dist'));
});

gulp.task('css-dev', function () {
    return gulp.src(['./src/blockrain.css'])
    .pipe(gulp.dest('./dist'));
});

gulp.task('blocks-dev', function () {
    return gulp.src(['./assets/blocks/custom/*.*'])
    .pipe(gulp.dest('./dist/assets/blocks/custom'));
});

gulp.task('readme-dev', function () {
    return gulp.src(['./README.md'])
    .pipe(gulp.dest('./dist'));
});

// Build for development (no minification, no zip)
gulp.task('build-dev', gulp.series('clean', 
  gulp.parallel('js-dev', 'css-dev', 'blocks-dev', 'readme-dev')
));

// Watch task
gulp.task('watch', gulp.series('build-dev', function() {
    console.log('\n🚀 开发模式已启动！');
    console.log('📝 正在监听文件变化...\n');
    
    gulp.watch('./src/**/*.js', gulp.series('js-dev'));
    gulp.watch('./src/**/*.css', gulp.series('css-dev'));
    gulp.watch('./assets/blocks/custom/*.*', gulp.series('blocks-dev'));
}));

gulp.task('default', gulp.series('build'));
