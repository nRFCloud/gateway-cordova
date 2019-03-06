export class Logger {

	private static getLogger(type) {
		if (
			process.env.NODE_ENV !== 'production' &&
			typeof console !== 'undefined' &&
			typeof console[type] !== 'undefined'
		) {
			return console[type].bind(console);
		}

		//If it's production or an invalid logging type, just return nothing
		return () => {};
	}

	static get assert() {
		return this.getLogger('assert');
	}

	static get error() {
		return this.getLogger('error');
	}

	static get group() {
		return this.getLogger('group');
	}

	static get groupEnd() {
		return this.getLogger('groupEnd');
	}

	static get info() {
		return this.getLogger('info');
	}

	static get log() {
		return this.getLogger('log');
	}

	static get warn() {
		return this.getLogger('warn');
	}

	static get debug() {
		return this.getLogger('debug');
	}
}
