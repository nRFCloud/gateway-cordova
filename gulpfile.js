const util = require('util');
const exec = util.promisify(require('child_process').exec);
const gulp = require('gulp');
const xmlTransformer = require('gulp-xml-transformer');
const git = require('gulp-git');
const inquirer = require('inquirer');
const rename = require('gulp-rename');
const del = require('delete');
const vinylPaths = require('vinyl-paths');

const keystore = require('./config/keystore.json');
const packageJson = require('./package.json');

const configFileName = './config.xml';

const xmlNamespace = { n: 'http://www.w3.org/ns/widgets' };

function clean(cb) {
	return del(['./built/*.apk'], cb);
}

function updateVersionNumber() {
	return gulp.src(configFileName).pipe(xmlTransformer([{
		path: '//n:widget', attr: { version: packageJson.version },
	}], xmlNamespace)).pipe(gulp.dest('./'));
}

function revertConfig() {
	return gulp.src(configFileName).pipe(git.checkoutFiles());
}

async function execCommand(cmdline) {
	const { stderr } = await exec(cmdline);
	if (stderr) {
		if (stderr.indexOf('Mapping new') > -1) {
			console.log('Got mapping new ns message, ignoring');
		} else {
			throw new Error(stderr);
		}
	}
}

let passwords;
async function askForPasswords() {
	passwords = await inquirer.prompt([{
		type: 'text',
		name: 'store',
		message: 'Please enter store password',
	}, {
		type: 'text',
		name: 'keystore',
		message: 'Please enter alias password',
	},]);

	if (!passwords.keystore || !passwords.store) {
		throw new Error('Invalid passwords');
	}
}

async function buildAndSignAndroidPackage() {
	if (!keystore || !keystore.alias || !keystore.location) {
		throw new Error('Keystore configuration is not correct');
	}

	if (!passwords.keystore || !passwords.store) {
		throw new Error('Invalid passwords');
	}
	const cmdline = `cordova build android --release -- --keystore="${keystore.location}" --alias=${keystore.alias} --storePassword="${passwords.store}" --password="${passwords.keystore}" --packageType=apk`;
	// console.log(cmdline);
	await execCommand(cmdline);
}

function buildDebugAndroidPackage() {
	return buildPackage('android');
}

function buildIosPackage() {
	return buildPackage('ios');
}

async function buildPackage(type) {
	return execCommand(`cordova build ${type}`);
}

function runAndroidPackage() {
	return runPackage('android');
}

function runPackage(type) {
	return execCommand(`cordova run ${type}`);
}

function copyDebugAndroidBuild() {
	const debugPackageLocation = './platforms/android/app/build/outputs/apk/debug/app-debug.apk';
	return gulp.src(debugPackageLocation).pipe(rename(`android-staging-v${packageJson.version}.apk`)).pipe(gulp.dest('./built'));
}

function copyProductionAndroidBuild() {
	const productionPackageLocation = './platforms/android/app/build/outputs/apk/release/app-release.apk';
	return gulp.src(productionPackageLocation).pipe(rename(`android-production-v${packageJson.version}.apk`)).pipe(gulp.dest('./built'));
}

function replaceEnvFile() {
	const envLocation = './.env';
	gulp.src(envLocation).pipe(vinylPaths(del)).pipe(rename('env.env')).pipe(gulp.dest('./'));
	return gulp.src('./.env.sample').pipe(rename('.env')).pipe(gulp.dest('./'));
}

function revertEnvFile() {
	const envLocation = './env.env';
	return gulp.src(envLocation).pipe(vinylPaths(del)).pipe(rename('.env')).pipe(gulp.dest('./'));
}

function buildCodeForProduction() {
	return execCommand('npm run build:production');
}

function buildCodeForStaging() {
	return execCommand('npm run build');
}

const buildAndRunAndroid = gulp.series(
	runAndroidPackage,
);

const buildStagingAndroid = gulp.series(
	replaceEnvFile,
	revertConfig,
	buildCodeForStaging,
	buildDebugAndroidPackage,
	copyDebugAndroidBuild,
	revertConfig,
	revertEnvFile,
);

const buildProductionAndroid = gulp.series(
	revertConfig,
	buildCodeForProduction,
	buildAndSignAndroidPackage,
	copyProductionAndroidBuild,
	revertConfig
);

exports.buildAndroid = gulp.series(
	askForPasswords,
	clean,

	buildStagingAndroid,
	buildProductionAndroid,
);

exports.buildStagingAndroid = buildStagingAndroid;

exports.buildIos = gulp.series(
	buildCodeForProduction,
	buildIosPackage,
	revertConfig,
);

exports.buildStagingIos = gulp.series(
	buildCodeForStaging,
	buildIosPackage,
	revertConfig,
);

exports.updateVersionNumber = updateVersionNumber;

exports.clean = clean;

exports.buildAndRunAndroid = buildAndRunAndroid;
