import { AuthFlowType, ChangePasswordCommand, ChangePasswordCommandOutput, CognitoIdentityProviderClient, ConfirmForgotPasswordCommand, ConfirmSignUpCommand, ForgotPasswordCommand, GlobalSignOutCommand, InitiateAuthCommand, ResendConfirmationCodeCommand, SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

import ApiWrapper from './ApiWrapper';

const COGNITO_CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || '2p40shpt1ru5gerbip9limhm15';
export const STORAGE_KEY = 'nrfcloudCognitoData';

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

namespace Cognito {

	export async function logout() {
		const { AccessToken } = retrieveRefreshCredentials();
		clearRefreshCredentials();
		const request = new GlobalSignOutCommand({ AccessToken });
		return client.send(request);
	};

	export async function changePassword(oldPassword: string, newPassword: string): Promise<ChangePasswordCommandOutput> {
		const { AccessToken } = retrieveRefreshCredentials();
		const request = new ChangePasswordCommand({ PreviousPassword: oldPassword, ProposedPassword: newPassword, AccessToken });
		return client.send(request);
	}

	export function forgotPassword(Username: string): Promise<any> {
		const input = { Username, ClientId: COGNITO_CLIENT_ID };
		const command = new ForgotPasswordCommand(input);
		return client.send(command);
	}

	export function confirmPassword(Username: string, ConfirmationCode: string, Password: string): Promise<any> {
		const input = { Username, ConfirmationCode, Password, ClientId: COGNITO_CLIENT_ID };
		const command = new ConfirmForgotPasswordCommand(input);
		return client.send(command);
	}

	export function createAccount(Username: string, Password: string, firstName: string, lastName: string, country: any): Promise<any> {
		const UserAttributes = [
			{ Name: 'email', Value: Username },
			{ Name: 'given_name', Value: firstName },
			{ Name: 'family_name', Value: lastName },
			{ Name: 'locale', Value: country },
			{ Name: 'name', Value: `${firstName} ${lastName}` },
		];
		const input = { UserAttributes, ClientId: COGNITO_CLIENT_ID, Username, Password };
		const command = new SignUpCommand(input);
		return client.send(command);
	}

	export function confirmRegistration(Username: string, ConfirmationCode: string): Promise<any> {
		const input = { ClientId: COGNITO_CLIENT_ID, Username, ConfirmationCode };
		const command = new ConfirmSignUpCommand(input);
		return client.send(command);
	}

	export function resendConfirmationCode(Username: string): Promise<any> {
		const input = { ClientId: COGNITO_CLIENT_ID, Username };
		const command = new ResendConfirmationCodeCommand(input);
		return client.send(command);
	}

	export async function resumeSession(): Promise<void> {
		const { username, refreshToken } = retrieveRefreshCredentials();

		if (username && refreshToken) {
			const input = {
				ClientId: COGNITO_CLIENT_ID,
				AuthParameters: { REFRESH_TOKEN: refreshToken },
				AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
			};
			const request = new InitiateAuthCommand(input);
			const response = await client.send(request);

			ApiWrapper.setApiKey(response.AuthenticationResult.IdToken);
			storeRefreshCredentials(username, refreshToken, response.AuthenticationResult.AccessToken);
			return;
		}
		throw new Error('No token in storage.');
	}

	function retrieveRefreshCredentials(): { username: string, refreshToken, AccessToken } | null {
		const data = localStorage.getItem(STORAGE_KEY);
		if (!data) {
			return null;
		}
		const { username, refreshToken, AccessToken } = JSON.parse(data);
		return { username, refreshToken, AccessToken };
	}

	function clearRefreshCredentials(): void {
		localStorage.removeItem(STORAGE_KEY);
	}

	function storeRefreshCredentials(username: string, refreshToken, AccessToken): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			username,
			refreshToken: refreshToken || refreshToken.getToken(),
			AccessToken,
		}));
	}
}

export default Cognito;
