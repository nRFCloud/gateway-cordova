import { Cognito } from '../utils/Cognito';

export function loginEmailPassword(email: string, password: string): Promise<any> {
	return Cognito.login(email.toLowerCase(), password);
}

export async function resumeSession(): Promise<string> {
	await Cognito.resumeSession();

	return Cognito.getUserName();
}
