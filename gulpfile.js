

let preprocessor = 'sass'; 
let gulp = require('gulp'); 
// визначаемо константи для  Gulp
const { src, dest, parallel, series, watch } = require('gulp');
 //підключаємо небхідні для роботи плагіни
// : Browsersync (приклад інсталяції : npm install browser-sync --save-dev )
const browserSync = require('browser-sync').create();
 
// : gulp-concat
const concat = require('gulp-concat');
 
// : gulp-uglify-es
const uglify = require('gulp-uglify-es').default;
 
// : модулі gulp-sass и gulp-less
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');
 
// : Autoprefixer
const autoprefixer = require('gulp-autoprefixer');
 
// : gulp-clean-css
const cleancss = require('gulp-clean-css');
 
// compress-images для роботи з зображеннями
const imagecomp = require('compress-images');
 
// Підключаємо модуль gulp-clean 
const clean = require('gulp-clean');
 
// визначаємо логіку роботи Browsersync
function browsersync() {
	browserSync.init({ // ініціалізація Browsersync
		server: { baseDir: 'app/' }, //  папка сервера
		notify: false, // відключаємо повідомлення
		online: true // Режим роботи: true или false(якщо без інтернету)
	})
}
 
function scripts() {
	return src([ // Беремо файли із джерел
		
		'app/js/app.js', // 
		])
	.pipe(concat('app.min.js')) // Конкатенуємо в один файл
	.pipe(uglify()) // Стискаємо JavaScript
	.pipe(dest('app/js/')) // Відправляємо готовий файл в папку призначення
	.pipe(browserSync.stream()) // Browsersync для оновлення сторінки
}

function styles() {
	return src(`app/`+ preprocessor + `/main.scss`) // Вибираємо джерело: "app/sass/main.sass" або "app/less/main.less"
	.pipe(eval(preprocessor)()) // Перетворимо значення змінної "preprocessor" на функцію
	.pipe(concat('app.min.css')) // Конкатенуємо в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Створимо префікси за допомогою Autoprefixer(для коректної роботи в браузерах)
    .pipe(cleancss( { level: { 1: { specialComments: 0 } } , format: 'keep-breaks'} )) // Мініфікуємо стилі
  
	.pipe(dest('app/css/')) // Виводимо результат в папку "app/css/"
	.pipe(browserSync.stream()) // 
}

 
 
async function images() {
	imagecomp(
		"app/images/src/**/*", // Берeмо всі зображення з папки джерела
		"app/images/dest/", // Відправляємо оптимізовані зображення в папку призначення
		{ compress_force: false, statistic: true, autoupdate: true }, false, // 
		{ jpg: { engine: "mozjpeg", command: ["-quality", "75"] } }, // Стискаємо і оптимізуємо зображенння
		{ png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
		{ svg: { engine: "svgo", command: "--multipass" } },
		{ gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
		function (err, completed) { // оновлюємо сторінку
			if (completed === true) {
				browserSync.reload()
			}
		}
	)
}
 
function cleanimg() {
	return src('app/images/dest/', {allowEmpty: true}).pipe(clean()) // очищаємо папку "app/images/dest/"
}
 
function buildcopy() {
	return src([ // вибираємо потрібні файли
		'app/css/**/*.min.css',
		'app/js/**/*.min.js',
		'app/images/dest/**/*',
		'app/**/*.html',
		], { base: 'app' }) // Параметр "base" зберігає структуру проекта при копіюванні
	.pipe(dest('dist')) // папка фінальної збірки
}
 
function cleandist() {
	return src('dist', {allowEmpty: true}).pipe(clean()) // чистимо папку "dist/"
}
 
function startwatch() {
 
	// Вибираємо всі файли JS в проекті, а потім виключим з суфіксом .min.js
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	
	// Моніторимо файли препроцесора на зміни
	watch('app/**/' + preprocessor + '/**/*', styles);
 
	// Моніторимо файли HTML на зиіни
	watch('app/**/*.html').on('change', browserSync.reload);
 
	// Моніторимо папку-джерело зображень и виконуємо images(), якщо є зміни
	watch('app/images/src/**/*', images);
 
}

// експортуємо функцію browsersync() як таск browsersync. Значення після знака = це наявна функция.
exports.browsersync = browsersync;
 
// експортуємо функцію scripts() в таск scripts
exports.scripts = scripts;
 
// експортуємо функцію styles() в таск styles
exports.styles = styles;
 
// експорт функції images() в таск images
exports.images = images;
 
// експорт функції cleanimg() як таск cleanimg
exports.cleanimg = cleanimg;
 
// Створюємо новий таск "build", який послідовно виконує потрібні операції
exports.build = series(cleandist, styles, scripts, images, buildcopy);
 
// експортуємо дефолтний таск з необхідним набором функцій
exports.default = parallel(styles, scripts, browsersync, startwatch);

