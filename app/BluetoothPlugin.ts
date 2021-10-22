/// <reference types="cordova-plugin-bluetoothle" />

import { Logger } from './logger/Logger';
import * as Util from 'beacon-utilities';

import ScanStatus = BluetoothlePlugin.ScanStatus;
import { Platform } from './utils/Platform';

function convertAdvertisementData(result: ScanStatus): ScanStatus {
	if (result && result.advertisement) {
		if (typeof result.advertisement === 'string') {
			result.advertisement = Util.parseAdvertisementBytes(BluetoothPlugin.encodedStringToBytes(result.advertisement)) as any;
		} else {
			if (typeof result.advertisement.manufacturerData !== 'undefined') {
				const bytes = Array.from(BluetoothPlugin.encodedStringToBytes(result.advertisement.manufacturerData));
				result.advertisement.manufacturerData = Util.parseManufacturerData(bytes, 0, bytes.length) as any;
			}

			if (typeof result.advertisement.serviceData !== 'undefined') {
				Object.keys(result.advertisement.serviceData).forEach((key) => {
					(result.advertisement as any).serviceData[key] = BluetoothPlugin.encodedStringToBytes((result.advertisement as any).serviceData[key]);
				});
			}
		}
	}

	return result;
}

function getBluetoothPluginObj(): BluetoothlePlugin.Bluetoothle {
	return window['bluetoothle'];
}

export default class BluetoothPlugin {
	static initialize(callback?: (enabled: boolean) => void): Promise<void> {
		const bluetoothle = getBluetoothPluginObj();
		let hasResolved = false;
		return new Promise((resolve) => {
			bluetoothle.initialize((result) => {
				if (!hasResolved) {
					resolve();
					hasResolved = true;
				}

				if (
					result &&
					result.status &&
					callback &&
					typeof callback === 'function'
				) {
					switch (result.status) {
						case 'enabled':
							callback(true);
							break;
						case 'disabled':
							callback(false);
							break;
					}
				}

			}, {
				request: true,
				statusReceiver: true,
			});
		});
	}

	static hasPermission(): Promise<boolean> {
		if (!Platform.isAndroid()) {
			return Promise.resolve(true);
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<boolean>((resolve) => {
			bluetoothle.hasPermission((result) => {
				resolve(result.hasPermission);
			});
		});
	}

	static requestPermission(): Promise<boolean> {
		if (!Platform.isAndroid()) {
			return Promise.resolve(true);
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<boolean>((resolve, reject) => {
			(bluetoothle as any).requestPermission((result) => {
				resolve(result.requestPermission);
			}, reject);
		});
	}

	static close(params: { address: string }): Promise<any> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<any>((resolve, reject) => {
			bluetoothle.close(resolve, reject, params);
		});
	}

	static disconnect(params): Promise<any> {
		if (Platform.isWindows()) {
			return Promise.resolve();
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<any>((resolve, reject) => {
			bluetoothle.disconnect(resolve, reject, params);
		});
	}

	static connect(params, cb?: (connected: boolean) => void): Promise<boolean> {
		const bluetoothle = getBluetoothPluginObj();
		let hasResolved = false;
		return new Promise<boolean>((resolve, reject) => {
			bluetoothle.connect((result) => {
				const status = result.status === 'connected';
				if (!hasResolved) {
					if (status) {
						resolve(status);
					} else {
						reject(`Failed to connect: ${JSON.stringify(result)}`);
					}
					hasResolved = true;
				}
				if (typeof cb === 'function') {
					cb(status);
				}
			}, reject, params);
		});
	}

	static isConnected(params: { address: string; }): Promise<boolean> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<boolean>((resolve) => {
			bluetoothle.isConnected((success) => {
				resolve(success.isConnected);
			}, () => resolve(false), params);
		});
	}

	static unbond(params: { address: string; }): Promise<void> {
		if (!Platform.isAndroid()) {
			return Promise.resolve();
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<void>((resolve, reject) => {
			bluetoothle.unbond(() => resolve(), (error) => {
				if (error && error.message && error.message.indexOf('already') > -1) {
					return resolve();
				}
				reject(`Failed to unbond: ${JSON.stringify(error)}`);
			}, params);
		});
	}

	static async startScan(resultCallback?: (result: BluetoothlePlugin.ScanStatus) => void): Promise<void> {
		const bluetoothle = getBluetoothPluginObj();
		let hasResolved = false;
		try {
			await this.stopScan();
		} catch (error) {
			//squelch
		}

		const params = Platform.isWindows() ? {
			// @ts-ignore
			isConnectable: true,
		} : null;

		return new Promise<void>((resolve, reject) => {
			// @ts-ignore
			bluetoothle.startScan((success: ScanStatus) => {
				if (!hasResolved) {
					resolve();
					hasResolved = true;
				}
				if (
					success &&
					success.status === 'scanResult' &&
					typeof resultCallback === 'function'
				) {
					resultCallback(convertAdvertisementData(success));
				}
			}, (error) => {
				reject(`Failed to start scan: ${JSON.stringify(error)}`);
			},
				// @ts-ignore
				params,
			);
		});
	}

	static stopScan(): Promise<void> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<void>((resolve) => {
			bluetoothle.stopScan(() => {
				resolve();
			}, () => resolve());
		});
	}

	static discover(deviceId: string): Promise<BluetoothlePlugin.Service[]> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<BluetoothlePlugin.Service[]>((resolve, reject) => {
			bluetoothle.discover(
				(success) => resolve(success.services),
				reject,
				{ address: deviceId },
			);
		});
	}

	static getCharacteristics(params: BluetoothlePlugin.CharacteristicParams): Promise<BluetoothlePlugin.Characteristic[]> {
		const bluetoothle = getBluetoothPluginObj();
		Logger.warn('getCharacteristics only work on iOS');
		return new Promise<BluetoothlePlugin.Characteristic[]>((resolve, reject) => {
			bluetoothle.characteristics((success) => resolve(success.characteristics), reject, params);
		});
	}

	static getDescriptors(params: BluetoothlePlugin.DescriptorParams): Promise<string[]> {
		const bluetoothle = getBluetoothPluginObj();
		Logger.warn('getDescriptors only works on iOS');
		return new Promise<string[]>((resolve, reject) => {
			bluetoothle.descriptors((success) => resolve(success.descriptors), reject, params);
		});
	}

	static writeCharacteristicValue(params: BluetoothlePlugin.WriteCharacteristicParams): Promise<number[]> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<number[]>((resolve, reject) => {
			bluetoothle.write((success) => {
				//I don't know why, but the success.value result on iOS doesn't necessarily match sent value
				resolve(Array.from(bluetoothle.encodedStringToBytes(params.value)));
			}, reject, params);
		});
	}

	static writeDescriptorValue(params: BluetoothlePlugin.WriteDescriptorParams): Promise<number[]> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<number[]>((resolve, reject) => {
			bluetoothle.writeDescriptor((success) => {
				resolve(typeof success.value === 'string' ? Array.from(bluetoothle.encodedStringToBytes(success.value)) : success.value);
			}, reject, params);
		});
	}

	static subscribe(params: BluetoothlePlugin.DescriptorParams, resultCallback?: (value: number[]) => void): Promise<void> {
		const bluetoothle = getBluetoothPluginObj();
		let hasResolved = false;
		return new Promise<void>((resolve, reject) => {
			bluetoothle.subscribe((success) => {
				switch (success.status) {
					case 'subscribed':
						if (!hasResolved) {
							hasResolved = true;
							resolve();
						}
						break;
					case 'subscribedResult':
						if (typeof resultCallback === 'function') {
							resultCallback(typeof success.value === 'string' ? Array.from(bluetoothle.encodedStringToBytes(success.value)) : success.value);
						}
						break;
				}
			}, (error) => {
				if (error && error.message && error.message.toLowerCase().indexOf('already') > -1) {
					if (!hasResolved) {
						hasResolved = true;
						resolve();
					}
					return;
				}
				reject(error);
			}, params);
		});
	}

	static unsubscribe(params: BluetoothlePlugin.DescriptorParams): Promise<void> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<void>((resolve, reject) => {
			bluetoothle.unsubscribe(() => {
				resolve();
			}, (error) => {
				if (error && error.message && error.message.toLowerCase().indexOf('already') > -1) {
					return resolve();
				}
				reject(error);
			}, params);
		});
	}

	static readCharacteristicValue(params: BluetoothlePlugin.DescriptorParams): Promise<number[]> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<number[]>((resolve, reject) => {
			bluetoothle.read((success) => {
				resolve(this.handleEncodedValue(success.value));
			}, reject, params);
		});
	}

	static readDescriptorValue(params: BluetoothlePlugin.OperationDescriptorParams): Promise<number[]> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<number[]>((resolve, reject) => {
			bluetoothle.readDescriptor((success) => {
				resolve(this.handleEncodedValue(success.value));
			}, reject, params);
		});
	}

	private static handleEncodedValue(value) {
		const bluetoothle = getBluetoothPluginObj();
		let returnedValue = value;
		if (value === null || typeof value === 'undefined') {
			return [];
		}

		if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'undefined') {
			return [];
		}

		if (typeof value === 'string') {
			returnedValue = Array.from(bluetoothle.encodedStringToBytes(value));
		} else if (!Array.isArray(value)) {
			returnedValue = [returnedValue];
		}
		return returnedValue;
	}

	static convertValue(bytes: number[]): string {
		const bluetoothle = getBluetoothPluginObj();
		return bluetoothle.bytesToEncodedString(new Uint8Array(bytes));
	}

	static encodedStringToBytes(str: string): number[] {
		const bluetoothle = getBluetoothPluginObj();
		return Array.from(bluetoothle.encodedStringToBytes(str));
	}

	static enable(): Promise<void> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise((resolve, reject) => bluetoothle.enable(() => resolve(), (err) => reject(err)));
	}

	static hasLocation(): Promise<boolean> {
		if (!Platform.isAndroid()) {
			return Promise.resolve(true);
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<boolean>((resolve, reject) => {
			bluetoothle.isLocationEnabled((success) => {
				resolve(success.isLocationEnabled);
			}, reject);
		});
	}

	static requestLocation(): Promise<boolean> {
		if (!Platform.isAndroid()) {
			return Promise.resolve(true);
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<boolean>((resolve, reject) => {
			bluetoothle.requestLocation((success) => {
				resolve(success.requestLocation);
			}, reject);
		});
	}

	static isEnabled(): Promise<boolean> {
		if (Platform.isWindows()) {
			return Promise.resolve(true);
		}

		const bluetoothle = getBluetoothPluginObj();
		return new Promise<boolean>((resolve) => {
			bluetoothle.isEnabled((success) => {
				resolve(success.isEnabled);
			});
		});
	}

	static getRSSI(connection: string): Promise<BluetoothlePlugin.RSSI> {
		const bluetoothle = getBluetoothPluginObj();
		return new Promise<BluetoothlePlugin.RSSI>((resolve, reject) => {
			const params = { address: connection };
			bluetoothle.rssi(resolve, reject, params);
		});
	}
}
