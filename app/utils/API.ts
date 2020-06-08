import { Credentials } from 'aws-sdk';
import * as AWS from 'aws-sdk';

import { getOrganization, createGateway as apiCreateGateway, CreateGatewayOptions } from '@nrfcloud/gateway-registration';

import { Logger } from '../logger/Logger';

interface GQLTenant {
	id: string;
	blocked: boolean;
	limits: Limit[];
	__typename: 'Tenant';
}

interface Limit {
	metric: 'inbound_count';
	current: number;
	limit: number;
	__typename: 'Limit';
}

interface SystemTenant {
	id: string;
	inbound_count: number;
	name: string;
	max_inbound_count: number;
}

function convertTenant(inTenant: GQLTenant): SystemTenant {
	const limit: Limit = inTenant.limits && inTenant.limits.length ? inTenant.limits[0] : {} as Limit;
	return {
		id: inTenant.id,
		inbound_count: limit.current,
		name: '',
		max_inbound_count: limit.limit,
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
			graphQLUrl: window['graphQLUrl'],
		};
		try {
			const tenant: any = await getOrganization(options.credentials, options.graphQLUrl);
			console.info('tenant from graphql', tenant);
			return [convertTenant(tenant)];

		} catch (err) {
			Logger.error(err);
		}
		return null;
	};

	export const createGateway = async (options: CreateGatewayOptions): Promise<any> => {
		return apiCreateGateway(options);
	};
}

export default API;
