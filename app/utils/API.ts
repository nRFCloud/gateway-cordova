import { Credentials } from 'aws-sdk';
import * as AWS from 'aws-sdk';

import { getOrganization, getOrganizations, createGateway as apiCreateGateway, CreateGatewayOptions, GatewayType } from '@nrfcloud/gateway-registration';

import { Logger } from '../logger/Logger';
import { Platform } from './Platform';

interface GQLTenant {
	id?: string;
	tenantId?: string;
	name: string;
	apiKey: string;
}

export interface SystemTenant {
	id: string;
	name: string;
	apiKey: string;
}

function convertTenant(inTenant: GQLTenant): SystemTenant {
	return {
		id: inTenant.id ?? inTenant.tenantId,
		name: inTenant.name,
		apiKey: inTenant.apiKey,
	};
}

export interface GetOrgOptions {
	credentials: Credentials;
	graphQLUrl: string;
}

namespace API {

	export const getTenants = async (options?: GetOrgOptions): Promise<SystemTenant[]> => {
		options = options ? options : {
			credentials: AWS.config.credentials as Credentials,
			graphQLUrl: window['GRAPHQL_URL'],
		};
		try {
			const orgs = await getAllOrganizations(options);
			if (orgs) {
				return orgs;
			}
		} catch (err) {
			Logger.error(err);
		}
		try {
			const oldTenant = await getOldTenant(options);
			if (oldTenant) {
				return [oldTenant];
			}
		} catch (err) {
			Logger.error(err);
		}
		return [];
	};

	async function getOldTenant(options: { credentials: any; graphQLUrl: any; }): Promise<SystemTenant> {
		try {
			const tenant = await getOrganization(options.credentials, options.graphQLUrl);
			console.info('tenant from graphql', tenant);
			return convertTenant(tenant);

		} catch (err) {
			Logger.error(err);
		}
		return null;
	}

	async function getAllOrganizations(options: GetOrgOptions): Promise<SystemTenant[]> {
		try {
			const tenants = await getOrganizations(options.credentials, options.graphQLUrl);
			return tenants.map(convertTenant);
		} catch (err) {
			//squelch
		}
		return null;
	}

	export const createGateway = async (options: CreateGatewayOptions): Promise<any> => {
		if (!options.type) {
			let platformSelection: GatewayType = GatewayType.Android;
			switch (Platform.getPlatform()) {
				case 'android':
				case 'browser':
				case 'windows':
					platformSelection = GatewayType.Android;
					break;
				case 'ios':
					platformSelection = GatewayType.iPhone;
					break;
			}
			options.type = platformSelection;
		}

		if (!options.apiUrl) {
			options.apiUrl = window['DEVICE_API_ENDPOINT'];
		}
		return apiCreateGateway(options);
	};
}

export default API;
