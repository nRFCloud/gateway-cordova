// @ts-ignore
import { Cognito as irisWebApi } from 'aws-wrapper';
import { Logger } from '../logger/Logger';
import { Platform } from './Platform';
import { CookieHelper } from './CookieHelper';

export namespace DevzoneHelper {
	const url = 'https://devzone.nordicsemi.com/api.ashx/v2/oauth/authorize?response_type=code&client_id=43ad187e-5f18-4a3b-a23c-c6c4d7a2eb29&redirect_uri=https%3A%2F%2Faccount.nrfcloud.com%2Fmobile%2F';

	export function startDevzoneSession(token) {
		const AWS = window['AWS'];
		const {aud: IdentityPoolId, sub: IdentityId, exp: expiry} = JSON.parse(atob(token.split('.')[1]));
		const current = (new Date()).getTime();
		if (current > expiry * 1000) {
			Logger.info('token is expired', new Date(expiry * 1000));
		}
		const creds = new AWS.CognitoIdentityCredentials({
			IdentityPoolId,
			IdentityId,
			Logins: {
				'cognito-identity.amazonaws.com': token,
			},
		});
		irisWebApi.startDevzoneSession(creds);
	}

	export function resumeSession(): Promise<boolean> {
		if (!CookieHelper.hasCredentials()) {
			return Promise.resolve(false);
		}

		return showDevzoneWindow().then(() => true);
	}

	export function showDevzoneWindow(): Promise<void> {
		const jwtStart = 'nrfcloud://oauth';

		const iab = window['cordova'] && window['cordova'].InAppBrowser;
		return new Promise((resolve, reject) => {
			//Open the window but hide it. Later we will show it if the user isn't auto-logged in.
			const options = [
				'hidden=yes',
				'hideurlbar=yes',
				'closebuttoncolor=#ffffff',
				'closebuttoncaption=Cancel',
				'toolbarcolor=#009cde',
			];
			if (Platform.isAndroid()) {
				options.push('location=yes');
				options.push('footer=no');
			}
			if (Platform.isIos()) {
				options.push('toolbarposition=top');
				options.push('location=no');
				options.push('presentationstyle=pagesheet');
			}
			const w = iab.open(url, '_blank', options.join(','));
			Logger.info('iab window is', w);
// noinspection JSIgnoredPromiseFromCall
			CookieHelper.loadCookies();
			let wasSuccessful = false;
			w.addEventListener('exit', () => {
				if (!wasSuccessful) {
					reject('Unsuccessful oAuth');
				}
			});

			const handleUrl = function (result) {
				//We have a JWT token
				const split = result.url.lastIndexOf('/');
				if (split > -1) {
					const token = result.url.substr(split + 1);
					Logger.info('Token is', token);
					wasSuccessful = true;
					CookieHelper.saveCookies().then(() => {
						w.close();
						if (token.indexOf('.') < 0) {
							reject('invalid token from oauth');
							return;
						}

						DevzoneHelper.startDevzoneSession(token);
						resolve();
					});
				}
			};

			//IOS can't load the redirect url and so it throws an error. Catch it and check if it's the proper URL
			w.addEventListener('loaderror', (error) => {
				if (error && error.code === 101 && error.url && error.url.indexOf(jwtStart) === 0) {
					handleUrl(error);
				}
			});
			let isFirstRun = true;
			w.addEventListener('loadstop', (result) => {
				Logger.info('loadstop', result);
				if (result.url && result.url.indexOf(jwtStart) === 0) {
					handleUrl(result);
				} else {
					//It's not completed, so show the window.
					w.show();
					// noinspection JSIgnoredPromiseFromCall
					CookieHelper.loadCookies().then(() => {
						const codeToRun = [];
						if (isFirstRun) {
							isFirstRun = false;
							codeToRun.push('location.reload();');
						}
						//There's a stupid "accept cookies?" prompt when first loaded. Auto hit the button.
						codeToRun.push('var elem = document.getElementById("hs-eu-confirmation-button");elem && elem.click()');

						//The email entry is not an actual email field so the keyboard shown isn't helpful. Unfortunately, the css is targeted to only input[type=text] so we have to add the css ourselves
						codeToRun.push(`var inEmail = $('input[id*=username]') && $('input[id*=username]')[0]; if (inEmail){
					   inEmail.type = 'email';
					   inEmail.style.cssText = '-webkit-appearance: none;border: 1px solid #d9dcde;padding: 6px;font-size: 14px;font-family: "GT Eesti", "Helvetica", Arial, sans-serif;box-sizing: border-box;width: 50%;resize: none;border-radius: 3px;-webkit-transition: border-left 0.1s;-moz-transition: border-left 0.1s;transition: border-left 0.1s;width: 100%';
					}`);

						w.executeScript({
							code: codeToRun.join(';'),
						});
					});
				}
			});
		});
	}

	export function clearCredentials() {
		const iab = window['cordova'] && window['cordova'].InAppBrowser;
		return new Promise((resolve, reject) => {
			const w = iab.open(url, '_blank', 'location=no,hidden=yes,clearcache=yes,clearsessioncache=yes');

			w.addEventListener('loadstart', () => {
				w.close();
			});

			w.addEventListener('loaderror', (error) => {
				if (error.code === -999) {
					CookieHelper.clearStoredCredentials();
					resolve();
					return;
				}
				reject(error);
			});

			w.addEventListener('exit', () => {
				CookieHelper.clearStoredCredentials();
				resolve();
			});
		});
	}
}
