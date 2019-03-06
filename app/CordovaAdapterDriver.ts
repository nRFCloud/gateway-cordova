///<reference path="../node_modules/cordova-plugin-bluetoothle/types/index.d.ts"/>
import { EventEmitter } from 'events';
import {
	AdapterState,
	Address,
	Characteristic,
	ConnectionSecurityParams,
	Descriptor,
	IAdapterDriver,
	Service,
	ConnectionOptions,
	ConnectionDownEvent,
	DeviceDiscovered,
	AdapterError,
	ConnectionUpEvent,
	ConnectTimedOutEvent,
	ConnectionCharacteristicValueChangedEvent,
	ConnectionDescriptorValueChangedEvent, CharacteristicProperties,
	ScanType,
} from 'nrfcloud-gateway-common';

import {
	isEqual,
	isEmpty,
} from 'underscore';
import { Logger } from './logger/Logger';

import BluetoothPlugin from './BluetoothPlugin';
import { formatUUIDIfNecessary, shortenUUID } from './util';
import * as Util from 'beacon-utilities';
import { Platform } from './utils/Platform';
import { actions } from './providers/StateStore';

const ADAPTER_ERROR = 'adapterError';
const ADAPTER_WARNING = 'adapterWarning';
const ADAPTER_STATE_CHANGE = 'adapterStateChange';
const CONNECTION_ERROR = 'connectionError';
const CONNECTION_UP = 'connectionUp';
const CONNECTION_DOWN = 'connectionDown';
const CONNECTION_SECURITY_REQUEST = 'connectionSecurityRequest';
const CONNECTION_SECURITY_PARAMETERS_REQUEST = 'connectionSecurityParametersRequest';
const CONNECTION_AUTHENTICATION_STATUS = 'connectionAuthenticationStatus';
const CONNECTION_CHARACTERISTIC_VALUE_CHANGED = 'characteristicValueChanged';
const CONNECTION_DESCRIPTOR_VALUE_CHANGED = 'descriptorValueChanged';
const CONNECT_TIMEOUT = 'connectTimeout';
const CONNECT_CANCELED = 'connectCanceled';
const DEVICE_DISCOVERED = 'deviceDiscovered';
const DEVICES_DISCOVERED = 'deviceDiscovered';
const DEVICE_UPDATE = 'deviceUpdate';

const BEACON_SCAN_INTERVAL = 60; //Time between beacon scans, in seconds
const BEACON_SCAN_DURATION = 2; //How long to scan for beacons, in seconds
const SCAN_RESULT_INTERVAL = 1; //How long to wait inbetween sending scan results, in MICROSECONDS!

export class CordovaAdapterDriver extends EventEmitter implements IAdapterDriver {
	state: AdapterState;
	devices: any;
	services: object;
	characteristics: object;
	descriptors: object;
	watching: string[];
	watcherHolder: any;
	beacons: object;
	scanResultInterval: any;
	scanResults: any[];
	scanMessages = {};

	constructor() {
		super();
		this.state = <AdapterState>{
			available: false,
			bleEnabled: false,
			scanning: false,
			advertising: false,
			connecting: false,
		};

		this.watching = [];

		this.watcherHolder = setInterval(async () => {
			await this.performWatches();
			this.performRSSIs();
		}, BEACON_SCAN_INTERVAL * 1000); //watch every x seconds

		this.init();

		this.scanResultInterval = null;

		this.scanResults = [];
	}

	async open(): Promise<void> {
		actions.logGatewayEvent('opening adapter');
		await BluetoothPlugin.initialize(async (enabled: boolean) => {
			if (enabled) {
				this.updateStatus('CONNECTION_ACTIVE');
			} else {
				this.updateStatus('BLUETOOTH_DISABLED');
			}
		});
	}

	private async checkPermissions() {
		const hasPerm = await BluetoothPlugin.hasPermission();

		if (!hasPerm) {
			const requestResult = await BluetoothPlugin.requestPermission();
			if (!requestResult) {
				this.updateStatus('NO_PERMISSIONS');
				return;
			}
		}
		this.updateStatus('HAS_PERMISSIONS');
	}

	private init() {
		actions.logGatewayEvent('initializing gateway');
		this.devices = [];
		this.services = {};
		this.characteristics = {};
		this.descriptors = {};
		this.beacons = {};
	}

	private _changeState(newState) {
		let changed = false;
		for (const state in newState) {
			if (!newState.hasOwnProperty(state)) {
				continue;
			}

			const newValue = newState[state];
			const previousValue = this.state[state];

			if (!isEqual(previousValue, newValue)) {
				this.state[state] = newValue;
				changed = true;
			}
		}

		if (changed) {
			this.handleStateChanged(this.state);
		}
	}

	private updateStatus(status: string) {
		switch (status) {
			case 'RESET_PERFORMED':
				this.init();
				this._changeState(
					{
						available: false,
						bleEnabled: false,
						connecting: false,
						scanning: false,
						advertising: false,
					},
				);
				break;
			case 'CONNECTION_ACTIVE':
				this._changeState(
					{
						bleEnabled: true,
						available: true,
					},
				);
				break;
			case 'BLUETOOTH_DISABLED':
				this._changeState({
					available: false,
					bleEnabled: false,
				});
				break;
			case 'NO_PERMISSIONS':
				this._changeState({
					available: false,
				});
				break;
			case 'HAS_PERMISSIONS':
				this._changeState({
					available: true,
				});
				break;
		}
	}

	close(): Promise<void> {
		actions.logGatewayEvent('closing gateway');
		this._changeState({
			available: false,
			bleEnabled: false,
			connecting: false,
			advertising: false,
			scanning: false,
		});
		return Promise.resolve();
	}

	reset(): Promise<void> {
		return Promise.resolve();
	}

	private convertAddress(device: BluetoothlePlugin.DeviceInfo | { address: string }): Address {
		return <Address>{
			address: device.address,
			type: 'randomStatic',
		};
	}

	async watchDevices(connections: string[]): Promise<string[]> {
		Logger.info('going to start watching', connections);
		this.watching = connections;
		this.watching.forEach((baddress) => {
			this.updateBeacon({address: {address: baddress}} as any, {});
		});
		this.performWatches();
		return connections;
	}

	async unwatchDevices(connections: string[]): Promise<string[]> {
		this.watching = this.watching.filter(watchedDevice => connections.indexOf(watchedDevice) === -1);
		return connections;
	}

	private isWatching(address: string): boolean {
		return this.watching.indexOf(address) > -1;
	}

	getBeacons() {
		return Object.values(this.beacons);
	}

	private updateBeacon(scanResult: DeviceDiscovered, rawData) {
		const address = scanResult.address.address;
		this.beacons[address] = Object.assign({}, this.beacons[address], scanResult, {id: address, statistics: {rssi: rawData.rssi}}, {isBeacon: true});
		this.emit('beaconUpdated', this.beacons, false);
	}

	async performWatches(): Promise<any> {
		const watchString = `performing watches: ${this.watching && this.watching.length} device${this.watching && this.watching.length === 1 ? '' : 's'}`;
		Logger.info(watchString);
		actions.logGatewayEvent(watchString);
		if (!this.watching || this.watching.length < 1) {
			return; //nothing to watch
		}

		if (this.state.scanning) {
			return;
		}

		this._changeState({scanning: true});
		const stopScan = async () => {
			if (this.state.scanning) {
				await BluetoothPlugin.stopScan();
			}

			this._changeState({scanning: false});
		};

		setTimeout(stopScan, BEACON_SCAN_DURATION * 1000);

		BluetoothPlugin.startScan((scanStatus) => {
			switch (scanStatus.status) {
				case 'scanStarted':
					break;
				case 'scanResult':
					if (
						scanStatus &&
						scanStatus.address &&
						this.isWatching(scanStatus.address)
					) {
						actions.logGatewayEvent(`found watched device: ${scanStatus.address}`);
						actions.logDeviceEvent({event: `found watched`, device: scanStatus.address});
						const discoveredDevice = this.convertScanResult(scanStatus);
						this.updateBeacon(discoveredDevice, scanStatus);
						this.handleDeviceInfoUpdate(discoveredDevice);
					}
					break;
			}
		});

	}

	private async getDeviceRSSI(deviceAddress) {
		try {
			const rssi = await BluetoothPlugin.getRSSI(deviceAddress);
			if (!rssi) {
				return;
			}

			Logger.info('got rssi value', rssi);
			actions.logDeviceEvent({event: `got rssi value ${rssi.rssi}`, device: deviceAddress.address});
			const discoveredDevice = this.convertScanResult(rssi as BluetoothlePlugin.ScanStatus);
			this.handleDeviceUpdate(discoveredDevice);
			this.handleDeviceInfoUpdate(discoveredDevice);
		} catch (error) {
			Logger.error('Error getting rssi', error);
		}
	}

	private async performRSSIs() {
		const devices = this.getConnections();
		Logger.info('performing RSSIs, device count:', devices.length);
		actions.logGatewayEvent(`performing RSSIs: ${devices && devices.length} device${devices && devices.length === 1 ? '' : 's'}`);
		try {
			for (const deviceAddress of devices) {
				await this.getDeviceRSSI(deviceAddress);
			}
		} catch (err) {
			//squelch
		}
	}

	async connect(connection: Address, connectOptions: ConnectionOptions): Promise<Address> {
		await this.doConnect(connection);
		return connection;
	}

	private async doConnect(connection: Address): Promise<void> {
		const isConnected = await this.isConnected(connection);

		if (isConnected) {
			return;
		}

		actions.logGatewayEvent(`connecting to ${connection.address}`);
		actions.logDeviceEvent({event: 'connecting', device: connection.address});
		try {
			await this.tryConnection(connection);

		} catch (error) {
			Logger.info('error while connecting', error);
			if (error.error && error.message) {
				if (error.message.indexOf('isn\'t disconnected') > -1 && await this.isConnected(connection)) {
					return;
				}

				if (error.message.indexOf('previously connected') > -1) {
					try {
						Logger.info('was previously connected, closing');
						await this.totalKillConnection(connection);
						this.handleDeviceDisconnected(connection);
						Logger.info('finished closing');
						await this.tryConnection(connection);
						return;
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
			this.getDeviceRSSI({
				address: connection.address,
			});
		} catch (err) {
			//Squelch
		}
	}

	private async totalKillConnection(connection: Address): Promise<void> {
		Logger.info('called tkc with', connection);
		const addressParams = {
			address: connection.address,
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

	currentSecondWait = 20;

	private tryConnection(connection: Address): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			const addressParams = {
				address: connection.address,
			};

			await this.totalKillConnection(connection);

			//I'm doing it this way because I don't know how to reject an async function from inside a setTimeout
			let timeoutHolder = setTimeout(async () => {
				await this.totalKillConnection(connection);
				this.handleDeviceDisconnected(connection);
				this.currentSecondWait += 2;
				if (this.currentSecondWait > 60) {
					this.currentSecondWait = 60;
				}
				Logger.info(`Timed out trying to connect. Waiting for ${this.currentSecondWait} seconds`);
				reject('Timed out connecting');
			}, this.currentSecondWait * 1000);
			try {
				Logger.info('trying to connect to', connection);
				await BluetoothPlugin.connect(addressParams, (connected) => {
					if (connected) {
						this.currentSecondWait = 20;
						this.handleDeviceConnected(connection);
					} else {
						Logger.info('plugin reports disconnected');
						this.handleDeviceDisconnected(connection);
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

	private async isConnected(connection: Address): Promise<boolean> {
		return await BluetoothPlugin.isConnected({
			address: connection.address,
		});
	}

	async disconnect(connection: Address): Promise<void> {
		await this.totalKillConnection(connection);
		actions.logGatewayEvent(`disconnected from ${connection.address}`);
		actions.logDeviceEvent({event: 'disconnected', device: connection.address});
		Logger.info('in disconnect(), finished disconnecting');
		this.handleDeviceDisconnected(connection);
	}

	cancelConnect(): Promise<void> {
		return Promise.resolve();
	}

	authenticate(connection: Address, securityParameters: ConnectionSecurityParams): Promise<void> {
		return Promise.resolve();
	}

	securityParametersReply(connection: Address, status: string, securityParameters: ConnectionSecurityParams): Promise<void> {
		return Promise.resolve();
	}

	setDefaultSecurityParameters(securityParameters: ConnectionSecurityParams): void {
	}

	sendPasskey(connection: Address, keyType: string, key: string): Promise<void> {
		return Promise.resolve();
	}

	private shouldAllowScanResult(scanResult: BluetoothlePlugin.ScanStatus, filter: {type: ScanType}) {
		if (filter && filter.type === ScanType.Beacon) {
			return Util.isBeacon((scanResult as any).advertisement);
		}
		return true;
	}

	private resetScanMessageTracking() {
		this.scanMessages = {};
	}

	async startScan(active: boolean, interval: number, window: number, timeout?: number, batch?: boolean, rssi?: number, name?: string, scanType?: ScanType): Promise<void> {
		timeout = timeout || 3;
		this._changeState({scanning: true});
		this.resetScanMessageTracking();
		actions.logGatewayEvent('starting scan');

		await BluetoothPlugin.startScan((scanStatus) => {
			switch (scanStatus.status) {
				case 'scanStarted':
					break;
				case 'scanResult':
					if (scanStatus && scanStatus.address && this.shouldAllowScanResult(scanStatus, {
						type: scanType !== null ? +scanType : ScanType.Regular,
					})) {
						const discoveredDevice = this.convertScanResult(scanStatus);
						this.handleDeviceScanResult(discoveredDevice);
					}
					break;
			}
		});

		return new Promise<void>((resolve) => setTimeout(async () => {
			await this.stopScan();
			resolve();
		}, timeout * 1000));
	}

	private convertScanResult(deviceFound: BluetoothlePlugin.ScanStatus): DeviceDiscovered {
		if (deviceFound == null) {
			return null;
		}

		const device: DeviceDiscovered = new DeviceDiscovered();
		device.address = this.convertAddress(deviceFound);
		device.rssi = deviceFound.rssi;
		device.name = deviceFound.name;
		device.advertisementData = deviceFound.advertisement as any;

		return device;
	}

	async stopScan(): Promise<void> {
		await BluetoothPlugin.stopScan();
		this._changeState({scanning: false});

		this.handleScanTimedOut();
		actions.logGatewayEvent('stopping scan');
	}

	getState(): AdapterState {
		return this.state;
	}

	getImpl(): any {
		return undefined;
	}

	getConnections(): Array<Address> {
		return Object.keys(this.devices).map((k) => this.devices[k]);
	}

	getAttributes(connection: Address): Promise<Array<Service>> {
		return this.getServices(connection);
	}

	async getServices(connection: Address): Promise<Array<Service>> {
		actions.logGatewayEvent(`discovering device ${connection.address}`);
		actions.logDeviceEvent({event: 'discovering', device: connection.address});
		try {
			const data = await BluetoothPlugin.discover(connection);
			const result = await Promise.all(data.map((s) => this.convertService(connection, s)));
			actions.logGatewayEvent(`finished discovering device ${connection.address}`);
			actions.logDeviceEvent({event: 'finished discovering', device: connection.address});
			return result;
		} catch (error) {
			Logger.error('error from discover', error);
			throw error;
		}

	}

	async getCharacteristics(connection: Address, service: Service): Promise<Array<Characteristic>> {
		const data = await BluetoothPlugin.getCharacteristics({
			address: connection.address,
			service: formatUUIDIfNecessary(service.uuid),
		});

		return Promise.all(data.map((c) => this.convertCharacteristic(connection, service, c)));
	}

	async getDescriptors(connection: Address, characteristic: Characteristic): Promise<Array<Descriptor>> {
		const service = characteristic.path.split('/')[0];
		const data = (await BluetoothPlugin.getDescriptors({
			address: connection.address,
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
			service: formatUUIDIfNecessary(service),
		})).map((uuid) => ({uuid} as BluetoothlePlugin.Descriptor));

		return Promise.all(data.map((d) => this.convertDescriptor(connection, characteristic, d)));
	}

	async writeCharacteristicValue(connection: Address, characteristic: Characteristic, characteristicValue: Array<number>, ack: boolean): Promise<void> {
		actions.logDeviceEvent({event: `writing characteristic value ${JSON.stringify(characteristicValue)} to characteristic ${characteristic.uuid}`, device: connection.address});
		const service = characteristic.path.split('/')[0];
		characteristic.value = await BluetoothPlugin.writeCharacteristicValue({
			address: connection.address,
			service: formatUUIDIfNecessary(service),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
			value: BluetoothPlugin.convertValue(characteristicValue),
			type: ack ? '' : 'noResponse',
		});

		this.handleCharacteristicValueChanged(connection, characteristic);

	}

	async writeDescriptorValue(connection: Address, descriptor: Descriptor, descriptorValue: Array<number>, ack: boolean): Promise<void> {
		const split = descriptor.path.split('/');

		if (split.length < 3) {
			throw new Error(`Descriptor has invalid path ${descriptor.path}`);
		}
		const characteristic = this.characteristics[split[1]];
		const service = this.services[split[0]];

		if (!service) {
			throw new Error(`Service not found for descriptor path ${descriptor.path}`);
		}

		if (!characteristic) {
			throw new Error(`Characteristic not found for descriptor path ${descriptor.path}`);
		}

		if (descriptor.uuid === '2902') {

			let result;
			if (descriptorValue.length > 0 && descriptorValue[0]) {
				result = await this.subscribe(connection, characteristic);
			} else {
				result = await this.unsubscribe(connection, characteristic);
			}

			descriptor.value = descriptorValue;
			this.handleDescriptorValueChanged(connection, descriptor);
			return result;
		}

		const params = {
			address: connection.address,
			service: formatUUIDIfNecessary(service.uuid),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
			descriptor: formatUUIDIfNecessary(descriptor.uuid),
			value: BluetoothPlugin.convertValue(descriptorValue),
		};

		actions.logDeviceEvent({event: `writing descriptor value ${JSON.stringify(descriptorValue)} to characteristic ${characteristic.uuid} and descriptor ${descriptor.uuid}`, device: connection.address});

		descriptor.value = await BluetoothPlugin.writeDescriptorValue(params);
		this.handleDescriptorValueChanged(connection, descriptor);

	}

	private async subscribe(connection: Address, characteristic: Characteristic): Promise<void> {
		const service = this.services[characteristic.path.split('/')[0]];
		if (!service) {
			throw new Error(`Characteristic has invalid path ${characteristic.path}`);
		}
		const params = {
			address: connection.address,
			service: formatUUIDIfNecessary(service.uuid),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
		};

		actions.logDeviceEvent({event: `subscribing to characteristic ${characteristic.uuid}`, device: connection.address});
		return BluetoothPlugin.subscribe(params, (newValue) => {
			characteristic.value = newValue;
			this.handleCharacteristicValueChanged(connection, characteristic);
		});
	}

	private async unsubscribe(connection: Address, characteristic: Characteristic): Promise<void> {

		const service = this.services[characteristic.path.split('/')[0]];
		if (!service) {
			throw new Error(`Characteristic has invalid path ${characteristic.path}`);
		}

		const params = {
			address: connection.address,
			service: formatUUIDIfNecessary(service.uuid),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
		};
		actions.logDeviceEvent({event: `unsubscribing to characteristic ${characteristic.uuid}`, device: connection.address});
		return BluetoothPlugin.unsubscribe(params);
	}

	async readCharacteristicValue(connection: Address, characteristic: Characteristic): Promise<number[]> {
		const params = {
			address: connection.address,
			service: formatUUIDIfNecessary(characteristic.path.split('/')[0]),
			characteristic: formatUUIDIfNecessary(characteristic.uuid),
		};

		const value = await BluetoothPlugin.readCharacteristicValue(params);
		actions.logDeviceEvent({event: `read characteristic ${characteristic.uuid}, value is ${JSON.stringify(value)}`, device: connection.address});
		return value;
	}

	async readDescriptorValue(connection: Address, descriptor: Descriptor): Promise<number[]> {
		const split = descriptor.path.split('/');
		if (split.length < 3) {
			Logger.error('Invalid path on descriptor', descriptor);
			throw new Error('Invalid path on descriptor');
		}

		const params = {
			address: connection.address,
			service: formatUUIDIfNecessary(split[0]),
			characteristic: formatUUIDIfNecessary(split[1]),
			descriptor: formatUUIDIfNecessary(descriptor.uuid),
		};
		const value = await BluetoothPlugin.readDescriptorValue(params);
		actions.logDeviceEvent({event: `read descriptor ${descriptor.uuid} for characteristic ${split[1]}, value is ${JSON.stringify(value)}`, device: connection.address});
		return value;
	}

	debug(): string {
		return undefined;
	}

	private async convertService(connection: Address, service: BluetoothlePlugin.Service): Promise<Service> {
		const uuid = shortenUUID(service.uuid);
		const convertedService = new Service(uuid);
		convertedService.path = uuid;
		convertedService.characteristics = await Promise.all(service.characteristics.map(async (char) => await this.convertCharacteristic(connection, convertedService, char)));
		this.services[uuid] = convertedService;
		return convertedService;
	}

	private async convertCharacteristic(connection: Address, service: Service, characteristic: BluetoothlePlugin.Characteristic): Promise<Characteristic> {
		const uuid = shortenUUID(characteristic.uuid);
		const convertedCharacteristic = new Characteristic(uuid);
		convertedCharacteristic.path = `${service.path}/${uuid}`;
		convertedCharacteristic.properties = this.convertCharacteristicProperties(characteristic);
		convertedCharacteristic.value = [];
		if (convertedCharacteristic.properties.read) {
			try {
				convertedCharacteristic.value = await this.readCharacteristicValue(connection, convertedCharacteristic);
			} catch (error) {
			}
		}
		convertedCharacteristic.descriptors = await Promise.all(characteristic.descriptors.map(async (desc) => await this.convertDescriptor(connection, convertedCharacteristic, desc)));
		this.characteristics[uuid] = convertedCharacteristic;
		return convertedCharacteristic;
	}

	private convertCharacteristicProperties(characteristic: BluetoothlePlugin.Characteristic): CharacteristicProperties {
		const propsObj = characteristic.properties;
		return {
			broadcast: propsObj.broadcast,
			read: propsObj.read,
			write_wo_resp: propsObj.writeWithoutResponse,
			write: propsObj.write,
			notify: propsObj.notify,
			indicate: propsObj.indicate,
			auth_signed_wr: propsObj.authenticatedSignedWrites,
		};
	}

	private async convertDescriptor(connection: Address, characteristic: Characteristic, descriptor: BluetoothlePlugin.Descriptor): Promise<Descriptor> {
		const uuid = shortenUUID(descriptor.uuid);
		const convertedDesc = new Descriptor(uuid);
		convertedDesc.path = `${characteristic.path}/${uuid}`;
		convertedDesc.value = [];
		try {
			convertedDesc.value = await this.readDescriptorValue(connection, convertedDesc);
		} catch (error) {
		}

		this.descriptors[uuid] = convertedDesc;
		return convertedDesc;
	}

	private handleError(error: string): void {
		this.emit(ADAPTER_ERROR, new AdapterError(error));
	}

	private handleDeviceConnected(address: Address) {
		actions.logGatewayEvent(`successfully connected to ${address.address}`);
		actions.logDeviceEvent({event: 'connected', device: address.address});
		this.devices[address.address] = address;
		this.emit(CONNECTION_UP, new ConnectionUpEvent(address));
	}

	private handleDeviceDisconnected(address: Address) {
		delete this.devices[address.address];
		this.emit(CONNECTION_DOWN, new ConnectionDownEvent(address));
	}

	private handleConnectTimedOut(address: Address) {
		this.emit(CONNECT_TIMEOUT, new ConnectTimedOutEvent(address));
	}

	private handleStateChanged(stateChanged: AdapterState) {
		this.state = stateChanged;
		this.emit(ADAPTER_STATE_CHANGE, this.state);
	}

	private handleCharacteristicValueChanged(address: Address, characteristic: Characteristic) {
		this.characteristics[characteristic.uuid] = characteristic;
		actions.logDeviceEvent({event: `characteristic value changed for ${characteristic.uuid}, new value is ${JSON.stringify(characteristic.value)}`, device: address.address});
		this.emit(CONNECTION_CHARACTERISTIC_VALUE_CHANGED, new ConnectionCharacteristicValueChangedEvent(address, characteristic));
	}

	private handleDescriptorValueChanged(address: Address, descriptor: Descriptor): void {
		this.descriptors[descriptor.uuid] = descriptor;
		actions.logDeviceEvent({event: `descriptor value changed for ${descriptor.path}, new value is ${JSON.stringify(descriptor.value)}`, device: address.address});
		this.emit(CONNECTION_DESCRIPTOR_VALUE_CHANGED, new ConnectionDescriptorValueChangedEvent(address, descriptor));
	}

	private handleDeviceInfoUpdate(device: DeviceDiscovered): void {
		if (!device || !device.address || !device.address.address) {
			return;
		}

		this.emit(DEVICE_DISCOVERED, device, false);
	}

	private handleDeviceScanResult(device: DeviceDiscovered): void {
		if (!device || !device.address || !device.address.address) {
			return;
		}
		const hash = `${device.address.address}${device.name}`;
		if (typeof this.scanMessages[hash] === 'undefined') {
			this.scanMessages[hash] = device;
			this.emit(DEVICE_DISCOVERED, device, false);
		}
	}

	private handleScanTimedOut(): void {
		this.resetScanMessageTracking();
		this.emit(DEVICE_DISCOVERED, null, true);
	}

	private handleDeviceUpdate(device): void {
		this.emit(DEVICE_UPDATE, device, false);
	}

	private sendScanResult() {
		const device = this.scanResults.pop();
		if (device) {
			this.emit(DEVICE_DISCOVERED, device, false);
			window.clearTimeout(this.scanResultInterval);
			this.scanResultInterval = setTimeout(() => this.sendScanResult());
		}
	}

	private clearScanResults() {
		if (this.scanResults.length > 0) {
			setTimeout(() => this.clearScanResults(), 200);
			return;
		}
		// if (this.scanResults.length > 0) {
			Logger.info(`Done scanning, there were ${this.scanResults.length} entries left`);
		// }
		window.clearTimeout(this.scanResultInterval);
		this.scanResults = [];
		this.emit(DEVICE_DISCOVERED, null, true);
	}

	private startWatchingScanResults() {
		this.sendScanResult();
	}
}
