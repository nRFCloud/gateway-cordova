const ENV_KEY = 'env';

export enum EnvironmentType {
	Production,
	Beta,
	Dev,
	Test,
}

namespace Environment {
	let currentEnv: EnvironmentType = null;

	export function getCurrentEnvironment(): EnvironmentType {
		if (!currentEnv) {
			currentEnv = EnvironmentType[localStorage.getItem(ENV_KEY)];
		}

		if (!currentEnv) {
			return EnvironmentType.Production;
		}

		return currentEnv;
	}

	export function setNewEnvironment(env: EnvironmentType): void {
		if (currentEnv !== env) {
			currentEnv = env;
			localStorage.setItem(ENV_KEY, EnvironmentType[currentEnv]);
		}
	}

	export function clear(): void {
		currentEnv = null;
		localStorage.removeItem(ENV_KEY);
	}
}

export default Environment;
