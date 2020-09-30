import BluetoothPlugin from '../BluetoothPlugin';
import { Logger } from '../logger/Logger';
import { Platform } from './Platform';

export function isConnected(address: string): Promise<boolean> {
	return BluetoothPlugin.isConnected({
		address,
	});
}

export async function totalKillConnection(connection: string): Promise<void> {
	Logger.info('called tkc with', connection);
	const addressParams = {
		address: connection,
	};

	if (Platform.isIos()) {
		try {
			await BluetoothPlugin.disconnect(addressParams);
		} catch (err) {
			Logger.info('in tkc, disconnect', err);
			if (!(err.error && (err.error === 'isNotDisconnected' || err.error === 'isDisconnected' || err.error === 'neverConnected'))) {
				throw err;
			}
		}
	} else {
		try {
			await BluetoothPlugin.unbond(addressParams);
		} catch (err) {
			Logger.info('in tkc, unbond', err);
			if (!(err && err.message && err.message.indexOf('already') > -1)) {
				throw err;
			}
		}
	}

	try {
		await BluetoothPlugin.close(addressParams);
	} catch (err) {
		Logger.info('in tkc, close', err);
		if (!(err && err.error && err.error === 'neverConnected')) {
			throw err;
		}
	}
	Logger.info('finished tkc');
}

let currentSecondWait = 20;

export function tryConnection(connection: string, cb?: (connected: boolean) => void): Promise<void> {
	return new Promise<void>(async (resolve, reject) => {
		await totalKillConnection(connection);

		let timeoutHolder = setTimeout(async () => {
			await totalKillConnection(connection);
			currentSecondWait += 2;
			if (currentSecondWait > 60) {
				currentSecondWait = 60;
			}
			Logger.info(`Timed out trying to connect to ${connection}. Waiting for ${currentSecondWait} seconds`);
			reject('Timed out connecting');
		}, currentSecondWait * 1000);

		const addressParams = {
			address: connection,
		};

		try {
			Logger.info('trying to connect to', connection);
			await BluetoothPlugin.connect(addressParams, (connected) => {
				if (connected) {
					currentSecondWait = 20;
				}
				if (typeof cb === 'function') {
					cb(connected);
				}
			});
			if (timeoutHolder) {
				clearTimeout(timeoutHolder);
				timeoutHolder = null;
			}
			resolve();
		} catch (error) {
			reject(error);
		}

	});
}
