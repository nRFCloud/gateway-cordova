import { Logger } from '../logger/Logger';

interface CookieManager {
	getCookie: (domain: string, tag: string, success: (result: {cookieValue: string}) => void, failure: (error: string) => void) => void;
	setCookie: (domain: string, tag: string, value: string, success: () => void, failure: (error: string) => void) => void;
}

export namespace CookieHelper {
	const LS_TAG = 'token';
	const dzCookieNames = [
		// '.te.dpr',
		// '.te.w',
		'ARRAffinity',
		// 'tzid',
		// 'tzoffset',
	];

	const nordicCookieNames = [
		// 'AuthorizationCookie',
		// '.CommunityServer',
		// 'EvolutionSync',
	];

	const Nordic_URL = 'nordicsemi.com';
	const Devzone_URL = 'https://devzone.nordicsemi.com';

	export function hasCredentials(): boolean {
		return !!window.localStorage.getItem(LS_TAG);
	}

	export function clearStoredCredentials(): void {
		window.localStorage.removeItem(LS_TAG);
	}

	export function loadCookies(): Promise<void[]> {
		const flattenedObj = window.localStorage.getItem(LS_TAG);
		if (!flattenedObj) {
			return;
		}

		let resultObj;
		try {
			resultObj = JSON.parse(flattenedObj);
		} catch (error) {
			return;
		}

		return Promise.all(Object.keys(resultObj).map((key) => {
			const value = resultObj[key];
			const url = nordicCookieNames.indexOf(key) > -1 ? Nordic_URL : Devzone_URL;
			return setCookie(url, key, value);
		}));
	}

	export function saveCookies(): Promise<void> {
		return Promise.all([getDevZoneCookies(), getNordicCookies()]).then(([dzCookies, nCookies]) => {
			const savedObj = Object.assign({}, dzCookies, nCookies);
			window.localStorage.setItem(LS_TAG, JSON.stringify(savedObj));
		});
	}

	async function getDevZoneCookies(): Promise<{[tag: string]: string}> {
		const returned = {};
		for (let k of dzCookieNames) {
			try {
				returned[k] = await getCookie(Devzone_URL, k);
			} catch (err) {
				//missing cookie, skip
			}
		}

		return returned;
	}

	async function getNordicCookies(): Promise<{[tag: string]: string}> {
		const returned = {};
		for (let k of nordicCookieNames) {
			try {
				returned[k] = await getCookie(Devzone_URL, k);
			} catch (err) {
				//missing cookie, skip
			}
		}

		return returned;
	}

	function getCookie(domain: string, tag: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const manager = cookieManager();
			// Logger.info(`calling getCookie with "${domain}" and "${tag}"`);
			manager.getCookie(domain, tag, (result) => {
				// Logger.info(`Got cookie for "${domain}" and "${tag}"`, result);
				resolve(result.cookieValue);
			}, (error) => {
				Logger.error(`Error getting cookie for "${domain}" and "${tag}"`, error);
				reject(error);
			});
		});
	}

	function setCookie(domain: string, tag: string, value: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const manager = cookieManager();
			// Logger.info(`setting cookie "${domain}" "${tag}" "${value}"`);
			manager.setCookie(domain, tag, value, resolve, reject);
		});
	}

	function cookieManager(): CookieManager {
		if (typeof window['cookieEmperor'] === 'undefined') {
			throw new Error('Cookie plugin not installed!');
		}

		return window['cookieEmperor'];
	}
}
