const ENV_KEY = 'env';

export enum EnvironmentType {
	Prod,
	Beta,
	Dev,
	Feature,
}

namespace Environment {
	let currentEnv: EnvironmentType = null;

	export function getCurrentEnvironment(): EnvironmentType {
		if (!currentEnv) {
			const storedEnv = localStorage.getItem(ENV_KEY);
			if (typeof EnvironmentType[storedEnv] !== 'undefined') {
				currentEnv = EnvironmentType[storedEnv];
			}
		}

		if (!currentEnv) {
			return EnvironmentType.Prod;
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
