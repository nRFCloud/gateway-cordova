import { Cognito } from './Cognito';

import Client from './Client';
import Environment from './Environment';
import { DevzoneHelper } from './DevzoneHelper';
import { Logger } from '../logger/Logger';
import { Platform } from './Platform';

export namespace Authorization {
	export async function logout() {
		try {
			if (!Platform.isBrowser()) {
				//On my browser, this is throwing errors, probably because of adblock
				await DevzoneHelper.clearCredentials();
			}
			await Client.deleteGatewayFile();
		} catch (err) {
			Logger.info('There was an error clearing file data', err);
		}

		await Cognito.logout();
		const curenv = Environment.getCurrentEnvironment();
		Environment.clear();
		localStorage.clear();
		Environment.setNewEnvironment(curenv);
		document.location.reload();
	}
}
