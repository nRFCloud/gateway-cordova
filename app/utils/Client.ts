import { device } from 'aws-iot-device-sdk';
// @ts-ignore
import AWS from 'AWS';

import { IAdapterDriverFactory } from 'nrfcloud-gateway-common/src/AdapterDriverFactory';
import { GatewayAWS } from 'nrfcloud-gateway-common/src/GatewayAWS';

import FS from '../fs';

import { Logger } from '../logger/Logger';

import { CordovaAdapterDriverFactory } from '../CordovaAdapterDriverFactory';
import { rootCA } from '../util';
import BluetoothPlugin from '../BluetoothPlugin';
import Network from './Network';
import { actions } from '../providers/StateStore';
import API from './API';

const GATEWAY_FILENAME = 'gateway-config.json';
const fileSystem = new FS();
const GATEWAY_VERSION = require('../../package.json').version;

namespace Client {
	let client;
	let gateway;
	let adapterDriverFactory: IAdapterDriverFactory;
	let mqttClient;

	export function setClient(c) {
		client = c;
		// noinspection JSIgnoredPromiseFromCall
		setupClient();
	}

	export async function setupClient() {
		if (!client) {
			return;
		}
		mqttClient = await AWS.config.credentials
			.getPromise()
			.then(() => {
				const { accessKeyId, secretAccessKey, sessionToken } = AWS.config.credentials;
				const iotEndpoint = window['MQTT_ENDPOINT'] || 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com';
				return device({
					clientId: `iris-api-client-${Math.floor((Math.random() * 1000000) + 1)}`,
					host: iotEndpoint,
					region: iotEndpoint.split('.')[2],
					protocol: 'wss',
					baseReconnectTimeMs: 250,
					maximumReconnectTimeMs: 500,
					// The empty credentials here and the call to mqttClient.updateWebSocketCredentials
					// will make the client connect using IAM credentials and not pre-signed URLs which
					// time out after ~20 minutes.
					accessKeyId: accessKeyId,
					secretKey: secretAccessKey,
					sessionToken: sessionToken,
				});
			});

		let cloudCloseCount = 0;
		mqttClient.on('close', () => {
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
			host: window['MQTT_ENDPOINT'] || 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com',
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
			// await getGateways(client);
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

	async function getTenants() {
		return API.getTenants();
	}

	export async function checkIfGatewayStillExists(clientApi = client, refGateway = gateway) {
		return;
		// if (!clientApi || !refGateway) {
		// 	return;
		// }
		//
		// const gateways = await getGateways(clientApi);
		//
		// let wasFound = false;
		// const gatewayid = refGateway.config.gatewayId;
		// for (let g of gateways) {
		// 	if (g.id === gatewayid) {
		// 		wasFound = true;
		// 		break;
		// 	}
		// }
		//
		// if (!wasFound) {
		// 	throw new Error('Gateway no longer exists');
		// }
	}

	async function getGateways(clientApi = client): Promise<any[]> {
		if (!clientApi) {
			return;
		}

		const currentTenant = await getCurrentTenant(clientApi);
		const gateways = (await clientApi.tenantsTenantIdGatewaysGet({
			tenantId: currentTenant.id,
		})).data;
		actions.setGateways(gateways);
		return gateways;
	}

	async function registerGateway(clientApi, gateway) {

		const tenant = await(getCurrentTenant(clientApi));
		const tenantId = tenant.id;

		Logger.info(`Registering gateway with tenant ${tenant.id}.`);

		const gatewaysPostResult = (await clientApi.tenantsTenantIdGatewaysPost({
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

	export async function getCurrentTenant() {
		const tenantsGetResult = await getTenants();
		if (tenantsGetResult.length < 1 || !tenantsGetResult[0] || !tenantsGetResult[0].id) {
			throw new Error('No tenant for user');
		}
		return tenantsGetResult[0];
	}
}

export default Client;
