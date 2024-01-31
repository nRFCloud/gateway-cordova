import { Credentials } from 'aws-sdk';
import * as AWS from 'aws-sdk';

import { getOrganization, getOrganizations, createGateway as apiCreateGateway, CreateGatewayOptions, GatewayType } from '@nrfcloud/gateway-registration';

import { Logger } from '../logger/Logger';
import { Platform } from './Platform';
import ApiWrapper, { HttpMethod } from './ApiWrapper';
import { Cognito } from './Cognito';

interface GQLTenant {
	id?: string;
	tenantId?: string;
	name: string;
	apiKey: string;
}

export interface Team {
	id: string;
	name: string;
	apiKey: string;
}

function convertTenant(inTenant: GQLTenant): Team {
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

//Change all of these.
namespace API {
	export const login = async (username: string, password: string): Promise<any> => {
		try {
			const { data } = await ApiWrapper.request(process.env.LOGIN_API_ENDPOINT, HttpMethod.post, JSON.stringify({ username, password }), null);
			Cognito.storeRefreshCredentials(username, data.refreshToken, data.AccessToken);
			ApiWrapper.setApiKey(data.idToken);
		} catch (err) {
			throw err;
		}
	}

	export const getTeams = async () => {
		try {
			const { data } = await ApiWrapper.request('user-accounts/initialize');
			return data;
		} catch (err) {
			Logger.error(err);
		};
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
