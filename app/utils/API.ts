// @ts-ignore
import * as AWS from 'AWS';
// @ts-ignore
import { AWSAppSyncClient } from 'aws-wrapper';
import { AWSAppSyncClient as AWSAppSyncClientType } from 'aws-appsync';
import gql from 'graphql-tag';
import { Logger } from '../logger/Logger';

type GQLClient = AWSAppSyncClientType<{}>;

let client: GQLClient;

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

const getTenant = gql`
	query account {
    account {
      email
      tenant {
        id
        apiKey
        blocked
        limits {
          metric
          current
          limit
        }
      }
    }
  }
`;

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

	const getGQLClient = (): GQLClient => {
		if (AWS && AWS.config && AWS.config.credentials) {
			if (!client) {
				client = createClient(window['graphQLUrl']);
			}
			return client;
		}

		throw new Error('Invalid AWS credentials while creating GQL client');
	};

	const createClient = (url: string): GQLClient => new AWSAppSyncClient({
		url,
		region: 'us-east-1',
		auth: {
			type: 'AWS_IAM',
			credentials: AWS.config.credentials,
		},
		disableOffline: true,
	});

	export const getTenants = async (): Promise<SystemTenant[]> => {

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
}

export default API;
