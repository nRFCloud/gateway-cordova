namespace CodePush {

	let codePush;
	let currentPkg;

	export function sync() {
		getAndSetCodePush();
		codePush.sync(null, {ignoreFailedUpdates: false}); //Re-install rollbacks
	}

	export async function getCurrentPackage() {
		if (!codePush) {
			getAndSetCodePush();
		}

		if (!currentPkg) {
			currentPkg = await new Promise((resolve, reject) => codePush.getCurrentPackage(resolve, reject));
		}
		return currentPkg;
	}

	function getAndSetCodePush() {
		if (!codePush) {
			codePush = window['codePush'];
		}
		if (!codePush) {
			throw new Error('CodePush is unavailable');
		}
	}
}

export default CodePush;
