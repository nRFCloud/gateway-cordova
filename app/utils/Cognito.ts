import * as AWS from 'aws-sdk/global';
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const { CognitoIdentityCredentials } = AWS;
const { CognitoUser } = AmazonCognitoIdentity;

const globalThis = window as any;

const COGNITO_CLIENT_ID = globalThis.COGNITO_USER_POOL_CLIENT_ID || '2p40shpt1ru5gerbip9limhm15';
const COGNITO_USER_POOL_ID = globalThis.COGNITO_USER_POOL_ID || 'us-east-1_fdiBa7JSO';
const COGNITO_IDENTITY_POOL_ID = globalThis.COGNITO_IDENTITY_POOL_ID || 'us-east-1:c00e1327-dfc2-4aa7-a484-8ca366d11a68';
const AWS_REGION = globalThis.AWS_REGION || 'us-east-1';
const USERPOOL_IDP = `cognito-idp.${AWS_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`;

AWS.config.region = AWS_REGION;

const STORAGE_KEY = 'nrfcloudCognitoData';
const STORAGE_KEY_DEVZONE_REFRESH = 'devzoneRefreshToken';

const poolData = {
	UserPoolId: COGNITO_USER_POOL_ID,
	ClientId: COGNITO_CLIENT_ID,
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

let cachedCredentials;

export namespace Cognito {

	export async function login(email: string, password: string): Promise<typeof CognitoIdentityCredentials> {

		const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
			Username: email,
			Password: password,
		});

		const userData = {
			Username: email,
			Pool: userPool,
		};
		const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
		const authTokens = await new Promise<any>((resolve, reject) => {
			cognitoUser.authenticateUser(authenticationDetails, {
				onSuccess: function (authTokens) {
					resolve(authTokens);
				},
				onFailure: function (err) {
					reject(err);
				},
			});
		});
		const idToken = authTokens.getIdToken();
		const token = idToken.getJwtToken();
		const credentials = new CognitoIdentityCredentials({
			IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
			Logins: {
				[USERPOOL_IDP]: token,
			},
		});
		await new Promise((resolve, reject) => {
			if (credentials) {
				credentials.refresh(error => {
					if (error) {
						return reject(error);
					}
					resolve();
				});
			} else {
				reject('Credentials undefined');
			}
		});
		storeRefreshCredentials(email, authTokens.getRefreshToken());
		return credentials;
	}

	export async function resumeSession(): Promise<void> {
		const credentials = retrieveRefreshCredentials();

		if (
			credentials &&
			credentials.username &&
			credentials.refreshToken
		) {
			const userData = {
				Username: credentials.username,
				Pool: userPool,
			};

			const cognitoUser = new CognitoUser(userData);
			const result: any = await new Promise((resolve, reject) => {
				cognitoUser.refreshSession((credentials as any).refreshToken, (err, result) => {
					if (err) {
						return reject(err);
					}
					return resolve(result);
				});
			});
			const token = result.getIdToken().getJwtToken();
			await authenticate(token);
			storeRefreshCredentials(credentials.username, result.getRefreshToken());
			return;
		} else {

			const session = await getUserSession();

			if (session) {
				const token = session.getIdToken().getJwtToken();
				return await authenticate(token);
			}

		}
		throw new Error('No token in storage.');
	}

	export async function logout() {
		clearRefreshCredentials();
		const currentCognitoUser = await getCurrentUser();
		if (currentCognitoUser) {
			currentCognitoUser.signOut();
		}
	}

	export function startDevzoneSession(devzoneRefreshToken): Promise<void> {

		AWS.config.credentials = getCredentials(devzoneRefreshToken);
		const STORAGE_KEY = 'devzoneRefreshToken';
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ devzoneRefreshToken }));

		return new Promise((resolve, reject) => {
			if (AWS.config.credentials) {
				(AWS.config.credentials as any).refresh(error => {
					if (error) {
						return reject(error);
					}
					resolve();
				});
			} else {
				reject('Credentials undefined');
			}
		});
	}

	export function getCredentials(token): typeof CognitoIdentityCredentials {
		let cognitoCredentials;
		if (token) {
			const { aud: IdentityPoolId, sub: IdentityId } = JSON.parse(atob(token.split('.')[1]));
			cognitoCredentials = new AWS.CognitoIdentityCredentials({
				IdentityPoolId,
				IdentityId,
				Logins: {
					'cognito-identity.amazonaws.com': token,
				},
			});
		}

		return cognitoCredentials;
	}

	function getQueryStringValue(key: string) {
		const params = new URLSearchParams(location.search);
		return params.get(key);
	}

	async function getCurrentUser(): Promise<typeof CognitoUser | null> {
		const currentUser = userPool.getCurrentUser();
		if (currentUser) {
			currentUser.setSignInUserSession(await getUserSession());
		}
		return currentUser;
	}

	function clearRefreshCredentials(): void {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(STORAGE_KEY_DEVZONE_REFRESH);
	}

	function getStoredData() {
		const data = localStorage.getItem(STORAGE_KEY_DEVZONE_REFRESH) || localStorage.getItem(STORAGE_KEY);
		if (!data) {
			return null;
		}
		const { username, refreshToken, devzoneRefreshToken } = JSON.parse(data);
		return {
			username,
			refreshToken,
			devzoneRefreshToken,
		};
	}

	function retrieveRefreshCredentials(): { username: string, refreshToken, devzoneRefreshToken } | null {
		const data = getStoredData();
		if (!data) {
			return null;
		}
		const { username, refreshToken, devzoneRefreshToken } = data;
		return {
			username,
			refreshToken: new AmazonCognitoIdentity.CognitoRefreshToken({ RefreshToken: refreshToken }),
			devzoneRefreshToken,
		};
	}

	export function getUserName(): string {
		const data = getStoredData();
		if (!data) {
			return '';
		}
		return data.username;
	}

	function authenticate(token, resetCredentials = true): Promise<null> {
		if (resetCredentials) {
			cachedCredentials = AWS.config.credentials = new CognitoIdentityCredentials({
				IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
				Logins: {
					[USERPOOL_IDP]: token,
				},
			});
		}

		return new Promise<null>((resolve, reject) => {
			if (AWS.config.credentials) {
				(AWS.config.credentials as any).refresh(error => {
					if (error) {
						return reject(error);
					}
					cachedCredentials = AWS.config.credentials;
					resolve();
				});
			} else {
				reject('Credentials undefined');
			}
		});
	}

	function storeRefreshCredentials(username: string, refreshToken): void {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			username,
			refreshToken: refreshToken.getToken(),
		}));
	}

	function getUserSession(): Promise<any> {
		const currentCognitoUser = userPool.getCurrentUser();
		return new Promise<any>((resolve, reject) => {
			if (
				currentCognitoUser &&
				currentCognitoUser.getSession
			) {
				return currentCognitoUser.getSession((error, session) => {

					if (error) {
						return reject(error);
					}
					resolve(session);
				});
			}
			reject('session not available');
		});
	}
}
