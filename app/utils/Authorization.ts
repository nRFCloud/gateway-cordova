import { Cognito } from './Cognito';

import Environment from './Environment';

export namespace Authorization {
	export async function logout() {
		await Cognito.logout();
		const curenv = Environment.getCurrentEnvironment();
		Environment.clear();
		localStorage.clear();
		Environment.setNewEnvironment(curenv);
		document.location.reload();
	}
}
