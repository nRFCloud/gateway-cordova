const util = require('util');
const exec = util.promisify(require('child_process').exec);
const gulp = require('gulp');
const xmlTransformer = require('gulp-xml-transformer');
const git = require('gulp-git');
const inquirer = require('inquirer');
const rename = require('gulp-rename');
const del = require('delete');

const codePushConfig = require('./config/codepush.json');
const keystore = require('./config/keystore.json');
const packageJson = require('./package.json');

const configFileName = './config.xml';

const xmlNamespace = {n: 'http://www.w3.org/ns/widgets'};

function clean(cb) {
	del(['./built/*.apk'], cb);
}

function setPlatformCodePushKey(platform, key) {
	return gulp.src(configFileName).pipe(xmlTransformer([{
		path: '//n:widget/n:platform[@name="' + platform + '"]/n:preference[@name="CodePushDeploymentKey"]', attr: {value: key},
	}], xmlNamespace))
}

function updateVersionNumber() {
	return gulp.src(configFileName).pipe(xmlTransformer([{
		path: '//n:widget', attr: {version: packageJson.version},
	}], xmlNamespace)).pipe(gulp.dest('./'));
}

// function setShortName(shortName) {
// 	return gulp.src(configFileName).pipe(xmlTransformer([{
// 		path: '//n:widget/n:name', attr: {shortName: shortName}
// 	}], xmlNamespace)).pipe(gulp.dest('./'));
// }

function revertConfig() {
	return gulp.src(configFileName).pipe(git.checkoutFiles());
}

function setAndroidStagingCodePushKey() {
	return setPlatformCodePushKey('android', codePushConfig.android.staging).pipe(gulp.dest('./'))
}

function setAndroidProductionCodePushKey() {
	return setPlatformCodePushKey('android', codePushConfig.android.production).pipe(gulp.dest('./'))
}

function setIosProductionCodePushKey() {
	return setPlatformCodePushKey('ios', codePushConfig.ios.production).pipe(gulp.dest('./'));
}

let passwords;
async function askForPasswords() {
	passwords = await inquirer.prompt([ {
		type: 'password',
		name: 'store',
		message: 'Please enter store password',
	}, {
		type: 'password',
		name: 'keystore',
		message: 'Please enter alias password',
	},]);

	if (!passwords.keystore || !passwords.store) {
		throw new Error('Invalid passwords');
	}
}

async function signAndroidPackage() {
	if (!keystore || !keystore.alias || !keystore.location) {
		throw new Error('Keystore configuration is not correct');
	}

	if (!passwords.keystore || !passwords.store) {
		throw new Error('Invalid passwords');
	}
	const cmdline = `cordova build android --release -- --keystore="${keystore.location}" --alias=${keystore.alias} --storePassword="${passwords.store}" --password="${passwords.keystore}"`;
	// console.log(cmdline);
	const { stderr } = await exec(cmdline);
	if (stderr) {
		throw new Error(stderr);
	}
}

function buildDebugAndroidPackage() {
	return buildPackage('android');
}

function buildIosPackage() {
	return buildPackage('ios');
}

async function buildPackage(type) {
	const {stderr} = await exec(`cordova build ${type}`);
	if (stderr) {
		throw new Error(stderr);
	}
}

function copyDebugAndroidBuild() {
	const debugPackageLocation = './platforms/android/app/build/outputs/apk/debug/app-debug.apk';
	return gulp.src(debugPackageLocation).pipe(rename(`android-staging-v${packageJson.version}.apk`)).pipe(gulp.dest('./built'));
}

function copyProductionAndroidBuild() {
	const productionPackageLocation = './platforms/android/app/build/outputs/apk/release/app-release.apk';
	return gulp.src(productionPackageLocation).pipe(rename(`android-production-v${packageJson.version}.apk`)).pipe(gulp.dest('./built'));
}

async function buildCodeForProduction() {
	const {stderr} = await exec('npm run build:production');
	if (stderr) {
		throw new Error(stderr);
	}
}

const buildStagingAndroid = gulp.series(
	revertConfig,
	setAndroidStagingCodePushKey,
	buildDebugAndroidPackage,
	copyDebugAndroidBuild,
	revertConfig
);

const buildProductionAndroid = gulp.series(
	revertConfig,
	setAndroidProductionCodePushKey,
	signAndroidPackage,
	copyProductionAndroidBuild,
	revertConfig
);

exports.buildAndroid = gulp.series(
	askForPasswords,
	clean,
	buildCodeForProduction,
	buildStagingAndroid,
	buildProductionAndroid,
);

exports.buildIos = gulp.series(
	// () => setShortName('Gateway'), //This doesn't work for iOS apparently. So we're going with an edit-config in config.xml
	setIosProductionCodePushKey,
	buildIosPackage,
	revertConfig,
);

exports.updateVersionNumber = updateVersionNumber;

exports.clean = clean;
