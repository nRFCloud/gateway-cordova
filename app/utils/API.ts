import { Credentials } from 'aws-sdk';
import * as AWS from 'aws-sdk';

import { getOrganization, createGateway as apiCreateGateway, CreateGatewayOptions } from '@nrfcloud/gateway-registration';

import { Logger } from '../logger/Logger';

interface GQLTenant {
	id?: string;
	tenantId?: string;
	blocked: boolean;
	limits: Limit[];
	name: string;
	profile: {
		name: string;
	};
	__typename: 'Tenant';
}

interface Limit {
	metric: 'inbound_count';
	current: number;
	limit: number;
	__typename: 'Limit';
}

export interface SystemTenant {
	id: string;
	inbound_count: number;
	name: string;
	max_inbound_count: number;
}

function convertTenant(inTenant: GQLTenant): SystemTenant {
	const limit: Limit = inTenant.limits && inTenant.limits.length ? inTenant.limits[0] : {} as Limit;
	return {
		id: inTenant.id ?? inTenant.tenantId,
		name: inTenant?.profile?.name || inTenant.name,
		inbound_count: limit.current,
		max_inbound_count: limit.limit,
	};
}

export interface GetOrgOptions {
	credentials: Credentials;
	graphQLUrl: string;
}

const getOrganizationsQuery = gql(`
query account {
  account {
    email
    tenants {
      tenantId
      blocked
      name
      apiKey
      role
      deviceGroups
      limits {
        metric
        current
        limit
      }
      profile {
        name
        vatId
        url
        email
        avatar
        phoneNumbers {
          type
          value
        }
      }
    }
  }
}
`);

namespace API {

	export const getTenants = async (options?: GetOrgOptions): Promise<SystemTenant[]> => {
		options = options ? options : {
			credentials: AWS.config.credentials as Credentials,
			graphQLUrl: window['graphQLUrl'],
		};
		try {
			const orgs = await getOrganizations();
			if (orgs) {
				return orgs;
			}
		} catch (err) {
			Logger.error(err);
		}
		try {
			const oldTenant = await getOldTenant();
			if (oldTenant) {
				return [oldTenant];
			}
		} catch (err) {
			Logger.error(err);
		}
		return [];
	};

	async function getOldTenant(): Promise<SystemTenant> {
		try {
			const {data: {account: {tenant}}}: any = await getGQLClient().query({query: getTenant});
			console.info('tenant from graphql', tenant);
			return convertTenant(tenant);

		} catch (err) {
			Logger.error(err);
		}
		return null;
	}

	async function getOrganizations(): Promise<SystemTenant[]> {
		try {
			const {data: {account: {tenants}}}: any = await getGQLClient().query({query: getOrganizationsQuery});
			return tenants.map(convertTenant);
		} catch (err) {
			//squelch
		}
		return null;
	}

	export const createGateway = async (options: CreateGatewayOptions): Promise<any> => {
		return apiCreateGateway(options);
	};
}

export default API;
