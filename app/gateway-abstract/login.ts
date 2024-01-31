import API from '../utils/API';
import { Cognito } from '../utils/Cognito';

export function loginEmailPassword(email: string, password: string): Promise<any> {
	return API.login(email.toLowerCase(), password);
}

export async function resumeSession(): Promise<string> {
	await Cognito.resumeSession();

	return Cognito.getUserName();
}
