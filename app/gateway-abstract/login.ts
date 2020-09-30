import { Cognito } from '../utils/Cognito';
import { DevzoneHelper } from '../utils/DevzoneHelper';

export function loginEmailPassword(email: string, password: string): Promise<any> {
	return Cognito.login(email.toLowerCase(), password);
}

export function loginDevZone(): Promise<void> {
	return DevzoneHelper.showDevzoneWindow();
}

export async function resumeSession(): Promise<string> {
	const result = await DevzoneHelper.resumeSession();
	if (!result) {
		await Cognito.resumeSession();
	}

	return Cognito.getUserName();
}
