import * as AWS from 'aws-sdk/global';
import AWSAppSyncClient from 'aws-appsync';
import { AWSAppSyncClient as AWSAppSyncClientType } from 'aws-appsync';
import gql from 'graphql-tag';
import { Logger } from '../logger/Logger';

type GQLClient = AWSAppSyncClientType<{}>;

let client: GQLClient;

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

const getTenant = gql`
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
`;

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
			const {data: {account: {tenant}}}: any = await getGQLClient().query({query: getTenant});
			console.info('tenant from graphql', tenant);
			return [convertTenant(tenant)];

		} catch (err) {
			Logger.error(err);
		}
		return null;
	};
}

export default API;
