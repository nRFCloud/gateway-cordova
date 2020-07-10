import * as AWS from 'aws-sdk';
import { getOrganizationId } from '@nrfcloud/gateway-registration';
import { Gateway, GatewayConfiguration, GatewayEvent } from '@nrfcloud/gateway-common';

import FS from '../fs';

import { Logger } from '../logger/Logger';

import BluetoothPlugin from '../BluetoothPlugin';
import { actions } from '../providers/StateStore';
import API from './API';
import { CordovaAdapter } from '../CordovaAdapter';

const GATEWAY_FILENAME = 'gateway-config.json';
const fileSystem = new FS();
const GATEWAY_VERSION = require('../../package.json').version;

namespace Client {
	import createGateway = API.createGateway;
	let gateway: Gateway;

	export async function handleGatewayConnect() {
		const tenantId = await getTenantId();
		const gatewayId = await findGatewayId();
		return createGatewayDevice(gatewayId, tenantId);
	}

	async function findGatewayId(): Promise<string> {
		if (!(await fileSystem.exists(GATEWAY_FILENAME))) {
			const orgId = await getOrganizationId(AWS.config.credentials, window['graphQLUrl']);
			const { accessKeyId, secretAccessKey, sessionToken } = AWS.config.credentials;
			const gatewayCreds = await createGateway({
				credentials: {
					accessKeyId,
					secretAccessKey,
					sessionToken,
				},
				organizationId: orgId,
				invokeUrl: window['invokeUrl'],
				region: window['AWS_REGION'],
			});
			await fileSystem.writeFile(GATEWAY_FILENAME, JSON.stringify(gatewayCreds));
		}
		const configfile = JSON.parse(await fileSystem.readFile(GATEWAY_FILENAME));
		return configfile.gatewayId;
	}

	async function createGatewayDevice(gatewayId: string, tenantId: string) {

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

	function addListeners(gateway: Gateway) {
		gateway.on(GatewayEvent.ConnectionsChanged, (connections) => {
			actions.setConnections({
				deviceList: connections,
				beaconList: gateway.beacons,
			});
		});
		gateway.on('beaconUpdated', () => {
			actions.setConnections({
				// deviceList: gateway.getConnections(),
				beaconList: gateway.beacons,
			});
		});
	}

	export function deleteGatewayFile(gwFilename = GATEWAY_FILENAME, fs = fileSystem) {
		return fs.unlink(gwFilename);
	}

	export function getDeviceConnections(): string[] {
		if (gateway && gateway.connections) {
			return Object.keys(gateway.connections);
		}
		return [];
	}

	export function getBeacons() {
		if (gateway && gateway.beacons) {
			return gateway.beacons;
		}

		return [];
	}

	export async function getTenantId(): Promise<string> {
		const tenant = await getCurrentTenant();
		return tenant.id;
	}

	export function getGatewayId(refGateway = gateway): string {
		return refGateway && refGateway.gatewayId;
	}

	export function getGatewayName(refGateway = gateway): string {
		return refGateway && refGateway.name;
	}

	export function setGatewayId(gatewayId) {
		//TODO: Make this switch gateway ID
	}

	export function closeAllConnections() {
		const deviceConnections = getDeviceConnections();
		if (deviceConnections && deviceConnections.length) {
			deviceConnections.forEach(async (connection) => {
				const params = {address: connection};
				try {
					await BluetoothPlugin.disconnect(params);
				} catch (ex) {
				}

				try {
					await BluetoothPlugin.close(params);
				} catch (ex) {
				}
			});
		}
	}

	async function getTenants() {
		return API.getTenants();
	}

	export async function checkIfGatewayStillExists(refGateway = gateway) {
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

	async function getGateways(): Promise<any[]> {
		// if (!clientApi) {
		// 	return;
		// }
		//
		// const currentTenant = await getCurrentTenant();
		// const gateways = (await clientApi.tenantsTenantIdGatewaysGet({
		// 	tenantId: currentTenant.id,
		// })).data;
		// actions.setGateways(gateways);
		// return gateways;
		return [];
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
