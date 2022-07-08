import * as React from 'react';
import { Logger } from '../../logger/Logger';
import Client from '../../utils/Client';
import { Platform } from '../../utils/Platform';
import Loader from '../Loader/Loader';
import Router from '../Router/Router';
import Network from '../../utils/Network';
import { Authorization } from '../../utils/Authorization';
import AppVersion from '../../utils/AppVersion';
import { actions } from '../../providers/StateStore';

interface MyState {
	isDeviceReady: boolean;
}

interface MyProps {
}

export default class App extends React.Component<MyProps, MyState> {

	constructor(props) {
		super(props);
		this.state = {
			isDeviceReady: false,
		};

		document.addEventListener('deviceready', () => this.handleDeviceReady(), false);
		document.addEventListener('resume', () => this.handleDeviceResume(), false);
		window.onbeforeunload = () => {
			Logger.info('unloading app!');
			Client.closeAllConnections();
			Network.stopListening();
		};
	}

	// private handleExit(e) {
	// 	e.stopPropagation();
	// 	e.preventDefault();
	// 	Client.closeAllConnections();
	// 	(navigator as any).app.exitApp();
	// }

	private checkPlugins() {
		this.checkBluetoothle();
		this.checkBackgroundMode();
		this.checkGlobals();
		Network.checkNetworkInformation();
		// noinspection JSIgnoredPromiseFromCall
		this.getAppVersion();
	}

	private checkGlobals() {
		[
			'AWS',
			'cordova',
			// 'AmazonCognitoIdentity',
		].forEach((key) => {
			if (typeof window[key] === 'undefined') {
				Logger.info(`Global "${key}" does not exist on "window"`);
				// window.location.reload();
			}
		});
	}

	private checkBluetoothle() {
		const wind = (window as any);
		if (
			!wind ||
			!wind.bluetoothle
		) {
			Logger.info('bluetoothle plugin not found');
			window.location.reload();
			return;
		}
	}

	private checkBackgroundMode() {
		const wind = (window as any);
		if (
			!wind ||
			!wind.cordova ||
			!wind.cordova.plugins ||
			!wind.cordova.plugins.backgroundMode
		) {
			Logger.info('background mode not found');
			window.location.reload();
			return;
		}
	}

	private setBackgroundMode() {
		Platform.enableBackgroundModeIfSelected();
	}

	private async getAppVersion() {
		// noinspection TypeScriptValidateJSTypes
		actions.setAppVersion(await AppVersion.getAppVersion());
	}

	private async handleDeviceResume() {
		this.checkPlugins();

		try {
			await Client.checkIfGatewayStillExists();
		} catch (err) {
			Logger.info('after resume, gateway doesnt exist error', err);
			if (err.message.indexOf('no longer') > -1) {
				// noinspection JSIgnoredPromiseFromCall
				Authorization.logout();
			} else {
				throw err;
			}
		}
	}

	private setStatusBar() {
		if (Platform.isIos()) {
			window['StatusBar'].hide();
		}
	}

	private setKeyboard() {
		if (Platform.isIos() && window['Keyboard'] && window['Keyboard'].hideFormAccessoryBar) {
			window['Keyboard'].hideFormAccessoryBar(true);
		}
	}

	private handleDeviceReady() {
		this.checkPlugins();
		this.setBackgroundMode();
		this.setStatusBar();
		this.setKeyboard();
		Network.startListening();
		this.setState({
			isDeviceReady: true,
		});
	}

	// private sendFeedback() {
	// 	let mailtoLink = 'mailto:admin@nrfcloud.com?subject=Gateway+Feedback+Android';
	//
	// 	if (!Platform.isAndroid()) {
	// 		mailtoLink = `mailto:admin@nrfcloud.com?subject=Gateway Feedback ${window['device'].platform}`;
	// 	}
	// 	window.open(mailtoLink, '_blank');
	// }

	render() {
		if (!this.state.isDeviceReady) {
			return (
				<Loader />
			);
		}

		return (
			<Router />
		);
	}

}
