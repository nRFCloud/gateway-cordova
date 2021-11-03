const config: WebdriverIO.Config = {
	path: '/wd/hub',
	port: 4723,
	capabilities: [{
		platformName: 'Android',
		deviceName: 'Android Emulator',
		app: './platforms/android/app/build/outputs/apk/debug/app-debug.apk',
		appPackage: 'no.nordicsemi.android.nrfcloudgateway',
		appActivity: '.MainActivity',
		automationName: 'UiAutomator2',
		autoWebview: true,
	}],
	specs: [
		'./test/specs/**/*.ts'
	],
	exclude: [
	],
	maxInstances: 10,
	logLevel: 'info',
	bail: 0,
	baseUrl: 'http://localhost',
	waitforTimeout: 10000,
	connectionRetryTimeout: 120000,
	connectionRetryCount: 3,
	services: [['appium', {
		args: {
			allowInsecure: 'chromedriver_autodownload',
		}
	}]],
	framework: 'mocha',
	reporters: ['spec'],
	mochaOpts: {
		ui: 'bdd',
		timeout: 60000,
	},
	autoCompileOpts: {
		autoCompile: true,
		tsNodeOpts: {
			transpileOnly: true,
			project: './test/tsconfig.testing.json'
		},
	}

}

exports.config = config;
