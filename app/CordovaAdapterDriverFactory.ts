import { IAdapterDriverFactory, IAdapter } from 'nrfcloud-gateway-common';
import { EventEmitter } from 'events';
import { CordovaAdapter } from './CordovaAdapter';

export class CordovaAdapterDriverFactory extends EventEmitter implements IAdapterDriverFactory {
	adapter;

	getAdapterByAdapterId(adapterId: string): Promise<IAdapter> {
		if (!this.adapter) {
			this.adapter = new CordovaAdapter(adapterId);
		}

		return Promise.resolve(this.adapter);
	}

	getAdapters(): Promise<string[]> {
		return Promise.resolve(['cordova']);
	}
}
