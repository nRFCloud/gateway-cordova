import { device } from 'aws-iot-device-sdk';
import * as AWS from 'aws-sdk';

import FS from '../fs';

import { Logger } from '../logger/Logger';

import { rootCA } from '../util';
import BluetoothPlugin from '../BluetoothPlugin';
import Network from './Network';
import { actions } from '../providers/StateStore';
import API from './API';
import { CordovaAdapter } from '../CordovaAdapter';
import { Gateway, GatewayConfiguration, GatewayEvent } from '@nrfcloud/gateway-common/dist';

const GATEWAY_FILENAME = 'gateway-config.json';
const fileSystem = new FS();
const GATEWAY_VERSION = require('../../package.json').version;

namespace Client {
	let client;
	let gateway: Gateway;
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

	export async function handleGatewayConnect() {
		const tenantId = await getTenantId();
		const gatewayId = await findGatewayId();
		return createGatewayDevice(gatewayId, tenantId);
	}

	async function findGatewayId(): Promise<string> {
		if (!(await fileSystem.exists(GATEWAY_FILENAME))) {
			//TODO: Actually fill this out
			throw new Error('gateway file doesnt exist');
		}
		const configfile = JSON.parse(await fileSystem.readFile(GATEWAY_FILENAME));
		return configfile.gatewayId;
	}

	async function createGatewayDevice(gatewayId: string, tenantId: string) {
		const AWS = window['AWS'];
		Logger.info('client is', client);

		const options: GatewayConfiguration = {
			protocol: 'wss',
			accessKeyId: AWS.config.credentials.accessKeyId,
			secretKey: AWS.config.credentials.secretAccessKey,
			sessionToken: AWS.config.credentials.sessionToken,
			host: window['MQTT_ENDPOINT'] || 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com',
			debug: process.env.NODE_ENV !== 'production',
			gatewayId,
			tenantId,
			bluetoothAdapter: new CordovaAdapter(),
		};

		gateway = new Gateway(options);

		addListeners(gateway);

		return gateway;
	}

	function addListeners(gateway) {
		gateway.on(GatewayEvent.ConnectionsChanged, (connections) => {
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

	export async function getTenantId(): Promise<string> {
		const tenant = await getCurrentTenant();
		return tenant.id;
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

		const currentTenant = await getCurrentTenant();
		const gateways = (await clientApi.tenantsTenantIdGatewaysGet({
			tenantId: currentTenant.id,
		})).data;
		actions.setGateways(gateways);
		return gateways;
	}

	async function registerGateway(clientApi, gateway) {

		const tenant = await(getCurrentTenant());
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
