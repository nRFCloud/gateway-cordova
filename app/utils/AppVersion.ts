namespace AppVersion {

	function getAppVersionObj() {
		if (window['cordova'] && window['cordova'].getAppVersion) {
			return window['cordova'].getAppVersion;
		}
		return null;
	}

	export async function getAppVersion(): Promise<string> {
		const appVersionObj = getAppVersionObj();
		if (!appVersionObj) {
			return null;
		}

		return await appVersionObj.getVersionNumber();
	}
}

export default AppVersion;
