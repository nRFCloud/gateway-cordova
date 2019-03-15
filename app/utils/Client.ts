import { IAdapterDriverFactory } from 'nrfcloud-gateway-common/src/AdapterDriverFactory';
import { GatewayAWS } from 'nrfcloud-gateway-common/src/GatewayAWS';

import FS from '../fs';

import { Logger } from '../logger/Logger';

import { CordovaAdapterDriverFactory } from '../CordovaAdapterDriverFactory';
import { rootCA } from '../util';
import BluetoothPlugin from '../BluetoothPlugin';
import Network from './Network';
import { actions } from '../providers/StateStore';

const GATEWAY_FILENAME = 'gateway-config.json';
const fileSystem = new FS();
const GATEWAY_VERSION = require('../../package.json').version;

namespace Client {
	let client;
	let gateway;
	let adapterDriverFactory: IAdapterDriverFactory;

	export function setClient(c) {
		client = c;
		setupClient();
	}

	export function setupClient() {
		if (!client) {
			return;
		}

		let cloudCloseCount = 0;
		client.mqtt.on('close', () => {
			cloudCloseCount++;
			if (cloudCloseCount > 5) {
				cloudCloseCount = 0;
				if (Network.isOnline()) {
					window.location.reload();
				}
			}
		});
	}

	export async function handleGatewayConnect(gwFilename = GATEWAY_FILENAME, fs = fileSystem, gatewayVersion = GATEWAY_VERSION) {
		const AWS = window['AWS'];
		Logger.info('client is', client);
		gateway = new GatewayAWS(gwFilename, null, fs, gatewayVersion, Logger);

		if (!adapterDriverFactory) {
			adapterDriverFactory = new CordovaAdapterDriverFactory();
		}

		const options = {
			protocol: 'wss',
			accessKey: AWS.config.credentials.accessKeyId,
			accessKeyId: AWS.config.credentials.accessKeyId,
			secretKey: AWS.config.credentials.secretAccessKey,
			sessionToken: AWS.config.credentials.sessionToken,
			host: 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com',
			debug: process.env.NODE_ENV !== 'production',
		};

		gateway.setGenericInfo({
			platform: {
				name: 'cordova',
				version: process.version,
			},
		});
		gateway.setConnectOptions(options);
		gateway.setAdapterDriverFactory(adapterDriverFactory);
		await gateway.init();
		await gateway.setAdapter('cordova');

		if (!gateway.isRegistered()) {
			await registerGateway(client, gateway);
			await getGateways(client);
		} else {
			await checkIfGatewayStillExists(client, gateway);
		}

		await gateway.start();

		addListeners(gateway);

		return gateway;
	}

	function addListeners(gateway) {
		gateway.on('connectionDatabaseChange', (connections) => {
			actions.setConnections({
				deviceList: connections,
				beaconList: gateway.adapterDriver.getBeacons(),
			});
		}, false);
		gateway.adapterDriver.on('beaconUpdated', () => {
			actions.setConnections({
				// deviceList: gateway.getConnections(),
				beaconList: gateway.adapterDriver.getBeacons(),
			});
		}, false);
	}

	export function deleteGatewayFile(gwFilename = GATEWAY_FILENAME, fs = fileSystem) {
		return fs.unlink(gwFilename);
	}

	export function getDeviceConnections() {
		if (gateway && gateway.deviceConnectionDatabase && gateway.deviceConnectionDatabase.getDeviceConnections) {
			return gateway.deviceConnectionDatabase.getDeviceConnections();
		}
		return [];
	}

	export function getBeacons() {
		if (gateway && gateway.adapterDriver && gateway.adapterDriver.getBeacons) {
			return gateway.adapterDriver.getBeacons();
		}

		return [];
	}

	export function getTenantId(refGateway = gateway): string {
		return refGateway && refGateway.config && refGateway.config.tenantId;
	}

	export function getGatewayId(refGateway = gateway): string {
		return refGateway && refGateway.config && refGateway.config.gatewayId;
	}

	export function getGatewayName(refGateway = gateway): string {
		return refGateway && refGateway.state && refGateway.state.gateway && refGateway.state.gateway.name;
	}

	export function setGatewayId(gatewayId) {
		return gateway.setCredentials(
			gateway.config.tenantId,
			gatewayId,
			'aa',
			'aa',
			'aa',
		);
	}

	export function closeAllConnections() {
		const deviceConnections = getDeviceConnections();
		if (deviceConnections && deviceConnections.length) {
			deviceConnections.forEach(async (connection) => {
				try {
					await BluetoothPlugin.disconnect(connection.address);
				} catch (ex) {
				}

				try {
					await BluetoothPlugin.close(connection.address);
				} catch (ex) {
				}
			});
		}
	}

	async function getTenants(clientApi = client) {
		return (await clientApi.http.tenantsGet({create: false})).data;
	}

	export async function checkIfGatewayStillExists(clientApi = client, refGateway = gateway) {
		if (!clientApi || !refGateway) {
			return;
		}

		const gateways = await getGateways(clientApi);

		let wasFound = false;
		const gatewayid = refGateway.config.gatewayId;
		for (let g of gateways) {
			if (g.id === gatewayid) {
				wasFound = true;
				break;
			}
		}

		if (!wasFound) {
			throw new Error('Gateway no longer exists');
		}
	}

	async function getGateways(clientApi = client): Promise<any[]> {
		if (!clientApi) {
			return;
		}

		const currentTenant = await getCurrentTenant(clientApi);
		const gateways = (await clientApi.http.tenantsTenantIdGatewaysGet({
			tenantId: currentTenant.id,
		})).data;
		actions.setGateways(gateways);
		return gateways;
	}

	async function registerGateway(clientApi, gateway) {

		const tenant = await(getCurrentTenant(clientApi));
		const tenantId = tenant.id;

		Logger.info(`Registering gateway with tenant ${tenant.name}.`);

		const gatewaysPostResult = (await clientApi.http.tenantsTenantIdGatewaysPost({
			tenantId,
		})).data;

		await gateway.setCredentials(
			tenantId,
			gatewaysPostResult.gatewayId,
			gatewaysPostResult.clientCert,
			gatewaysPostResult.privateKey,
			rootCA,
		);

	}

	export async function getCurrentTenant(clientApi) {
		const tenantsGetResult = await getTenants(clientApi);
		if (tenantsGetResult.length < 1 || !tenantsGetResult[0] || !tenantsGetResult[0].id) {
			throw new Error('No tenant for user');
		}
		return tenantsGetResult[0];
	}

	export function getFilesystem() {
		return fileSystem;
	}
}

export default Client;
