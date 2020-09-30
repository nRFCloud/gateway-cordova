import { Logger } from '../logger/Logger';
import { actions, AppState, subscribe, unsubscribe } from '../providers/StateStore';

export namespace Platform {
	const BG_MODE_TAG = 'bg_mode_enabled';
	let deviceCount: number = 0;

	function ensureBackgroundMode(): boolean {
		const wind = (window as any);
		if (
			!wind ||
			!wind.cordova ||
			!wind.cordova.plugins ||
			!wind.cordova.plugins.backgroundMode
		) {
			Logger.info('background mode not found');
			return false;
		}
		return true;
	}

	function ensureInsomnia(): boolean {
		const wind = (window as any);

		if (
			!wind ||
			!wind.plugins ||
			!wind.plugins.insomnia
		) {
			Logger.info('Insomnia not found');
			return false;
		}

		return true;
	}

	function ensureSleeper(): boolean {
		if (isAndroid()) {
			return ensureBackgroundMode();
		}

		if (isIos()) {
			return ensureInsomnia();
		}
		return false;
	}

	function disableSleeper() {
		if (isAndroid()) {
			disableBackgroundMode();
		}
		if (isIos()) {
			disableInsomnia();
		}
	}

	function getBGMode() {
		return (window as any).cordova.plugins.backgroundMode;
	}

	function getInsomnia() {
		return (window as any).plugins.insomnia;
	}

	export function getPlatform(): 'android' | 'ios' | 'browser' | 'windows' {
		return window['cordova'] && window['cordova'].platformId;
	}

	export function isAndroid(): boolean {
		return getPlatform() === 'android';
	}

	export function isIos(): boolean {
		return getPlatform() === 'ios';
	}

	export function isBrowser(): boolean {
		return getPlatform() === 'browser';
	}

	export function isWindows(): boolean {
		return getPlatform() === 'windows';
	}

	export function handleBackButton(): void {
		if (!ensureBackgroundMode()) {
			exitApp();
			return;
		}

		const bg = getBGMode();
		if (bg.isEnabled()) {
			bg.moveToBackground();
		} else {
			exitApp();
		}
	}

	function exitApp(): void {
		if (isAndroid() && typeof navigator['app'] !== 'undefined' && typeof navigator['app']['exitApp'] === 'function') {
			navigator['app']['exitApp']();
		}
	}

	function getConnectedString(): string {
		return `${deviceCount} connection${deviceCount !== 1 ? 's' : ''}`;
	}

	function enableBackgroundMode() {
		if (!ensureBackgroundMode()) {
			return;
		}

		const bg = getBGMode();
		bg.setDefaults({
			text: 'Connected to nRF Cloud',
			hidden: false,
			icon: 'nrfcloud',
			color: '0098D9',
			allowClose: true,
			channelDescription: 'Keep the Gateway App connected in the background',
			channelName: 'Keep running in background',
			subText: getConnectedString(),
			showWhen: false,
		});

		bg.enable();
		bg.on('activate', () => {
			bg.disableWebViewOptimizations();
		});
		bg.disableBatteryOptimizations();
	}

	function unEnabler() {
		const bg = getBGMode();
		bg.disable();
		bg.un('enable', unEnabler);
	}

	/*
		BGMode can get into a weird state where it's enabled, but the javascript side doesn't know it
		To combat this, we add a listener, enable the plugin and then when the listener fires, disable it again
	 */
	function disableBackgroundMode() {
		if (!ensureBackgroundMode()) {
			return;
		}

		const bg = getBGMode();
		bg.on('enable', unEnabler);
		bg.enable();
	}

	function enableInsomnia() {
		if (!ensureInsomnia()) {
			return;
		}

		const insomnia = getInsomnia();
		insomnia.keepAwake();
	}

	function disableInsomnia() {
		if (!ensureInsomnia()) {
			return;
		}


		const insomnia = getInsomnia();
		insomnia.allowSleepAgain();
	}

	function enableBGModeSetting() {
		localStorage.setItem(BG_MODE_TAG, '1');
	}

	function disableBGModeSetting() {
		localStorage.setItem(BG_MODE_TAG, '');
	}

	function changeListener(action: string, result: Partial<AppState>, ...rest: any[]) {
		if (action === 'setConnections' && isAndroid()) {
			const deviceList = Object.values(result.deviceList) || [];
			console.info('deviceList is', deviceList);
			const beaconList = result.beaconList || [];
			deviceCount = deviceList.filter((d) => d?.status?.connected).length + beaconList.length;
			updateDeviceCount();
		}
	}

	function updateDeviceCount(): void {
		const bg = getBGMode();
		const configObj = {
			subText: getConnectedString(),
		};
		if (bg.isActive()) {
			bg.configure(configObj);
		} else {
			bg.setDefaults(configObj);
		}
	}

	function subscribeToChanges() {
		subscribe(changeListener);
	}

	function unsubscribeToChanges() {
		unsubscribe(changeListener);
	}

	export function startNoSleepMode() {
		enableBGModeSetting();
		enableBackgroundModeIfSelected();
	}

	export function stopNoSleepMode() {
		disableBGModeSetting();
		enableBackgroundModeIfSelected();
	}

	export function isNoSleepModeEnabled(): boolean {
		return localStorage.getItem(BG_MODE_TAG) === '1';
	}

	export function enableBackgroundModeIfSelected() {
		if (isNoSleepModeEnabled()) {
			actions.setNoSleepEnabled(true);
			subscribeToChanges();
			if (isAndroid()) {
				if (!ensureBackgroundMode()) {
					return;
				}
				const bg = getBGMode();
				if (!bg.isEnabled()) {
					enableBackgroundMode();
				}
			}

			if (isIos()) {
				if (!ensureInsomnia()) {
					return;
				}
				enableInsomnia();
			}
		} else {
			disableSleeper();
			actions.setNoSleepEnabled(false);
			unsubscribeToChanges();
		}
	}

	export function supportsNoSleepMode(): boolean {
		return isBrowser() || isAndroid() || isIos();
	}
}
