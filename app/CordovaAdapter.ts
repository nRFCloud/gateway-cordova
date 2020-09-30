import { AdapterEvent, Address, CharacteristicProperties, BluetoothAdapter, Characteristic, Descriptor, ScanResult, Service, Services } from '@nrfcloud/gateway-common';
import { actions } from './providers/StateStore';
import { isConnected, totalKillConnection, tryConnection } from './utils/DeviceMethods';
import { Logger } from './logger/Logger';
import BluetoothPlugin from './BluetoothPlugin';
import { formatUUIDIfNecessary, shortenUUID } from './util';

export class CordovaAdapter extends BluetoothAdapter {

	constructor() {
		super();
		actions.logGatewayEvent('opening adapter');
		BluetoothPlugin.initialize(async (enabled: boolean) => {
			if (enabled) {
				//handle connected
			} else {
				//handle disconnected
			}
		});
	}

	private handleDeviceDisconnected(id: string) {
		this.emit(AdapterEvent.DeviceDisconnected, id);
	}

	private handleDeviceConnected(id: string) {
		this.emit(AdapterEvent.DeviceConnected, id);
	}

	async connect(id: string): Promise<any> {
		const alreadyConnected = await isConnected(id);
		if (alreadyConnected) {
			return;
		}

		actions.logGatewayEvent(`connecting to ${id}`);
		actions.logDeviceEvent({ event: 'connecting', device: id });

		try {
			await tryConnection(id, (connected => {
				if (connected) {
					this.handleDeviceConnected(id);
				} else {
					Logger.info('plugin reports disconnected');
					this.handleDeviceDisconnected(id);
				}
			}));
		} catch (error) {
			if (error.error && error.message) {
				if (error.message.indexOf('isn\'t disconnected') > -1 && await isConnected(id)) {
					return;
				}

				if (error.message.indexOf('previously connected') > -1) {
					try {
						Logger.info('was previously connected, closing');
						await totalKillConnection(id);
						this.handleDeviceDisconnected(id);
						return this.connect(id);
					} catch (error) {
						Logger.info('error while trying to connect after previously connected', error);
						if (error.error && error.message) {
							if (error.message.indexOf('isn\'t disconnected') > -1) {
								return;
							}
						}
					}
				}
			}
			throw error;
		}

		try {
			this.getRSSI(id);
		} catch (err) {
			//Squelch
		}
	}

	async disconnect(id: string): Promise<any> {
		await totalKillConnection(id);
		actions.logGatewayEvent(`disconnected from ${id}`);
		actions.logDeviceEvent({ event: 'disconnected', device: id });
		Logger.info('in disconnect(), finished disconnecting');
		this.handleDeviceDisconnected(id);
	}

	async discover(id: string): Promise<Services> {
		actions.logGatewayEvent(`discovering device ${id}`);
		actions.logDeviceEvent({ event: 'discovering', device: id });
		try {
			const data = await BluetoothPlugin.discover(id);
			const results = await Promise.all(data.map((s) => this.convertService(id, s)));
			actions.logGatewayEvent(`finished discovering device ${id}`);
			actions.logDeviceEvent({ event: 'finished discovering', device: id });
			const services: Services = {};
			for (const result of results) {
				services[result.uuid] = result;
			}
			return services;
		} catch (error) {
			Logger.error('error from discover', error);
			throw error;
		}
	}

	async getRSSI(deviceId: string): Promise<number> {
		try {
			const rssi = await BluetoothPlugin.getRSSI(deviceId);
			if (!rssi) {
				return;
			}

			actions.logDeviceEvent({ event: `got rssi value ${rssi.rssi}`, device: deviceId });
			return rssi.rssi;
		} catch (error) {
			Logger.error('Error getting rssi', error);
		}
	}

	async readCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<number[]> {
		const params = {
			address: deviceId,
			service: formatUUIDIfNecessary(characteristic.path.split('/')[0]),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
		};

		const value = await BluetoothPlugin.readCharacteristicValue(params);
		actions.logDeviceEvent({ event: `read characteristic ${characteristic.uuid}, value is ${JSON.stringify(value)}`, device: deviceId });
		return value;
	}

	async readDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<number[]> {
		const split = descriptor.path.split('/');
		if (split.length < 3) {
			Logger.error('Invalid path on descriptor', descriptor);
			throw new Error('Invalid path on descriptor');
		}

		const params = {
			address: deviceId,
			service: formatUUIDIfNecessary(split[0]),
			characteristic: formatUUIDIfNecessary(split[1]),
			descriptor: formatUUIDIfNecessary(descriptor.uuid),
		};
		const value = await BluetoothPlugin.readDescriptorValue(params);
		actions.logDeviceEvent({ event: `read descriptor ${descriptor.uuid} for characteristic ${split[1]}, value is ${JSON.stringify(value)}`, device: deviceId });
		return value;
	}

	async startScan(resultCallback: (deviceScanResult: ScanResult) => void): Promise<any> {
		actions.logGatewayEvent('starting scan');
		await BluetoothPlugin.startScan((scanStatus) => {
			switch (scanStatus.status) {
				case 'scanStarted':
					break;
				case 'scanResult':
					const discoveredDevice = this.convertScanResult(scanStatus);
					resultCallback(discoveredDevice);
					break;
			}
		});
	}

	stopScan(): any {
		actions.logGatewayEvent('stopping scan');
		return BluetoothPlugin.stopScan();
	}

	subscribe(deviceId: string, characteristic: Characteristic, callback: (characteristic: Characteristic) => void): Promise<void> {
		const serviceUUID = characteristic.path.split('/')[0];
		if (!serviceUUID) {
			throw new Error(`Characteristic has invalid path ${characteristic.path}`);
		}
		const params = {
			address: deviceId,
			service: formatUUIDIfNecessary(serviceUUID),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
		};
		actions.logDeviceEvent({ event: `subscribing to characteristic ${characteristic.uuid}`, device: deviceId });
		return BluetoothPlugin.subscribe(params, (newValue) => {
			characteristic.value = newValue;
			callback(characteristic);
		});
	}

	unsubscribe(deviceId: string, characteristic: Characteristic): Promise<void> {
		const serviceUUID = characteristic.path.split('/')[0];
		if (!serviceUUID) {
			throw new Error(`Characteristic has invalid path ${characteristic.path}`);
		}
		const params = {
			address: deviceId,
			service: formatUUIDIfNecessary(serviceUUID),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
		};
		actions.logDeviceEvent({ event: `unsubscribing to characteristic ${characteristic.uuid}`, device: deviceId });
		return BluetoothPlugin.unsubscribe(params);
	}

	writeCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<void> {
		actions.logDeviceEvent({ event: `writing characteristic value ${JSON.stringify(characteristic.value)} to characteristic ${characteristic.uuid}`, device: deviceId });
		const service = characteristic.path.split('/')[0];
		return BluetoothPlugin.writeCharacteristicValue({
			address: deviceId,
			service: formatUUIDIfNecessary(service),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
			value: BluetoothPlugin.convertValue(characteristic.value),
			type: '', //this was hardcoded in the old gateway-common as `ack = true`
		}).then(() => undefined);
	}

	writeDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<void> {
		const split = descriptor.path.split('/');

		if (split.length < 3) {
			throw new Error(`Descriptor has invalid path ${descriptor.path}`);
		}
		const characteristicUUID = split[1];
		const serviceUUID = split[0];
		if (!serviceUUID) {
			throw new Error(`Service not found for descriptor path ${descriptor.path}`);
		}

		if (!characteristicUUID) {
			throw new Error(`Characteristic not found for descriptor path ${descriptor.path}`);
		}
		const params = {
			address: deviceId,
			service: formatUUIDIfNecessary(serviceUUID),
			characteristic: formatUUIDIfNecessary(characteristicUUID),
			descriptor: formatUUIDIfNecessary(descriptor.uuid),
			value: BluetoothPlugin.convertValue(descriptor.value),
		};

		actions.logDeviceEvent({ event: `writing descriptor value ${JSON.stringify(descriptor.value)} to characteristic ${characteristicUUID} and descriptor ${descriptor.uuid}`, device: deviceId });

		return BluetoothPlugin.writeDescriptorValue(params) as undefined;
	}

	private async convertService(connection: string, service: BluetoothlePlugin.Service): Promise<Service> {
		const uuid = shortenUUID(service.uuid);
		const convertedService = new Service(uuid);
		convertedService.uuid = uuid;
		const characteristics = await Promise.all(service.characteristics.map(async (char) => await this.convertCharacteristic(connection, convertedService, char)));

		convertedService.characteristics = {};
		for (const characteristic of characteristics) {
			convertedService.characteristics[characteristic.uuid] = characteristic;
		}
		return convertedService;
	}

	private async convertCharacteristic(connection: string, service: Service, characteristic: BluetoothlePlugin.Characteristic): Promise<Characteristic> {
		const uuid = shortenUUID(characteristic.uuid);
		const convertedCharacteristic = new Characteristic(uuid);
		convertedCharacteristic.path = `${service.uuid}/${uuid}`;
		convertedCharacteristic.properties = this.convertCharacteristicProperties(characteristic);
		convertedCharacteristic.value = [];
		if (convertedCharacteristic.properties.read) {
			try {
				convertedCharacteristic.value = await this.readCharacteristicValue(connection, convertedCharacteristic);
			} catch (error) {
			}
		}
		const descriptors = await Promise.all(characteristic.descriptors.map(async (desc) => await this.convertDescriptor(connection, convertedCharacteristic, desc)));
		convertedCharacteristic.descriptors = {};
		for (const descriptor of descriptors) {
			convertedCharacteristic.descriptors[descriptor.uuid] = descriptor;
		}
		return convertedCharacteristic;
	}

	private convertCharacteristicProperties(characteristic: BluetoothlePlugin.Characteristic): CharacteristicProperties {
		const propsObj = characteristic.properties;
		return {
			broadcast: propsObj.broadcast,
			read: propsObj.read,
			writeWithoutResponse: propsObj.writeWithoutResponse,
			write: propsObj.write,
			notify: propsObj.notify,
			indicate: propsObj.indicate,
			authorizedSignedWrite: propsObj.authenticatedSignedWrites,
		};
	}

	private async convertDescriptor(connection: string, characteristic: Characteristic, descriptor: BluetoothlePlugin.Descriptor): Promise<Descriptor> {
		const uuid = shortenUUID(descriptor.uuid);
		const convertedDesc = new Descriptor(uuid);
		convertedDesc.path = `${characteristic.path}/${uuid}`;
		convertedDesc.value = [];
		try {
			convertedDesc.value = await this.readDescriptorValue(connection, convertedDesc);
		} catch (error) {
		}

		return convertedDesc;
	}

	private convertScanResult(deviceFound: BluetoothlePlugin.ScanStatus): ScanResult {
		if (deviceFound == null) {
			return null;
		}

		return <ScanResult>{
			address: this.convertAddress(deviceFound),
			rssi: deviceFound.rssi,
			name: deviceFound.name,
			advertisementData: deviceFound.advertisement as any,
		};
	}

	private convertAddress(device: BluetoothlePlugin.DeviceInfo | { address: string }): Address {
		return <Address>{
			address: device.address.toUpperCase(),
			type: 'randomStatic',
		};
	}
}
