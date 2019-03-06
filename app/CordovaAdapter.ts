import { IAdapter, IAdapterDriver } from 'nrfcloud-gateway-common/src/index';
import { CordovaAdapterDriver } from './CordovaAdapterDriver';

export class CordovaAdapter implements IAdapter {
	port: string;
	id: string;
	adapterDriver: CordovaAdapterDriver;

	constructor(id: string) {
		this.id = id;
	}

	getAdapterDriver(): IAdapterDriver {
		if (!this.adapterDriver) {
			this.adapterDriver = new CordovaAdapterDriver();
		}

		return this.adapterDriver;
	}
}
