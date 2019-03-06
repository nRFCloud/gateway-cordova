import { actions } from '../providers/StateStore';
import { Logger } from '../logger/Logger';

namespace Network {

	const handleOffline = () => handleChange(false);
	const handleOnline = () => handleChange(true);

	function handleChange(isOnline: boolean) {
		actions.networkChange(isOnline);
	}

	function getConnection() {
		if (navigator && navigator['connection']  && navigator['connection']) {
			return navigator['connection'];
		}

		return null;
	}

	export function startListening() {
		document.addEventListener('online', handleOnline, false);
		document.addEventListener('offline', handleOffline, false);
	}

	export function stopListening() {
		document.removeEventListener('online', handleOnline);
		document.removeEventListener('offline', handleOffline);
	}

	export function checkNetworkInformation() {
		const connection = getConnection();
		if (!connection || !connection.type) {
			Logger.error('network information not available!');
			return false;
		}
		return true;
	}

	export function isOnline() {
		const connection = getConnection();
		return !(!connection || !connection.type || !window['Connection'] || connection.type === window['Connection'].NONE);
	}
}

export default Network;
