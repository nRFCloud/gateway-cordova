// @ts-ignore
import * as AWS from 'AWS';
// @ts-ignore
import { AWSAppSyncClient } from 'aws-wrapper';
import { AWSAppSyncClient as AWSAppSyncClientType } from 'aws-appsync';
import gql from 'graphql-tag';
import { Logger } from '../logger/Logger';
import Environment, { EnvironmentType } from './Environment';

type GQLClient = AWSAppSyncClientType<{}>;

let client: GQLClient;

interface GQLTenant {
	id: string;
	tenantId?: string;
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
		id: inTenant.id || inTenant.tenantId,
		inbound_count: limit.current,
		name: '',
		max_inbound_count: limit.limit,
	};
}

const getTenant = Environment.getCurrentEnvironment() !== EnvironmentType.Test ? gql`
	query account {
    account {
      email
      tenant {
        id
        blocked
        limits {
          metric
          current
          limit
        }
      }
    }
  }
` : gql`
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
					email
				}
      }
    }
  }
`; //test environment uses MU stack

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
			let {data: {account: {tenant, tenants}}}: any = await getGQLClient().query({query: getTenant});
			tenant = tenant || tenants[0];
			console.info('tenant from graphql', tenant);
			return [convertTenant(tenant)];

		} catch (err) {
			Logger.error(err);
		}
		return null;
	};
}

export default API;
