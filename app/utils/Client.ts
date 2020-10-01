import * as AWS from 'aws-sdk';
import { getOrganizationId } from '@nrfcloud/gateway-registration';
import { Gateway, GatewayConfiguration, GatewayEvent } from '@nrfcloud/gateway-common';

import { Logger } from '../logger/Logger';

import BluetoothPlugin from '../BluetoothPlugin';
import { actions } from '../providers/StateStore';
import API, { SystemTenant } from './API';
import { CordovaAdapter } from '../CordovaAdapter';
import Environment, { EnvironmentType } from './Environment';


const GATEWAY_VERSION = require('../../package.json').version;
const CURRENT_ORG_TAG = 'CURRENT_ORG_TAG';
const GATEWAY_TAG = 'GATEWAY_TAG';

namespace Client {
	let gateway: Gateway;
	let currentOrganization: SystemTenant;

	export async function handleGatewayConnect() {
		const tenantId = await getTenantId();
		const gatewayId = await findGatewayId();
		return createGatewayDevice(gatewayId, tenantId);
	}

	async function findGatewayId(): Promise<string> {

		const creds = localStorage.getItem(GATEWAY_TAG);
		if (!creds) {
			const tenant = await getCurrentTenant();
			const gatewayCreds = await API.createGateway({
				credentials: AWS.config.credentials as any,
				organizationId: tenant.id,
				invokeUrl: window['IRIS_API_ENDPOINT'],
				region: window['AWS_REGION'],
				apiKey: tenant.apiKey,
			});
			localStorage.setItem(GATEWAY_TAG, JSON.stringify(gatewayCreds));
		}
		const configfile = JSON.parse(localStorage.getItem(GATEWAY_TAG));
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
			stage: EnvironmentType[Environment.getCurrentEnvironment()].toLowerCase(),
		};

		gateway = new Gateway(options);

		addListeners(gateway);
		return gateway;
	}

	function addListeners(gateway: Gateway) {
		gateway.on(GatewayEvent.ConnectionsChanged, (connections) => {
			console.info('got a connections changed event from gateway', connections);
			actions.setConnections({
				deviceList: Object.values(connections),
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
				const params = { address: connection };
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

	export async function getCurrentTenant(): Promise<SystemTenant> {
		const savedOrg = JSON.parse(localStorage.getItem(CURRENT_ORG_TAG));
		if (savedOrg) {
			return savedOrg as SystemTenant;
		}
		return currentOrganization;
	}

	export function setCurrentOrganization(newOrg: SystemTenant) {
		localStorage.setItem(CURRENT_ORG_TAG, JSON.stringify(newOrg));
		currentOrganization = newOrg;
	}
}

export default Client;
