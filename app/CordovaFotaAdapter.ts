import { FotaAdapter, UpdateInformation } from '@nrfcloud/gateway-common';
import FileUtil from './utils/FileUtil';

export class CordovaFotaAdapter extends FotaAdapter {
	startUpdate(file: Blob, deviceId: string, callback: (status: UpdateInformation) => void): void {
		this.handleUpdate(file, deviceId, callback);
	}

	private async handleUpdate(file: Blob, deviceId: string, callback: (status: UpdateInformation) => void): Promise<void> {
		const fileName = await FileUtil.saveFirmwareFile(file);
		window['NordicUpdate'].updateFirmware(function (status) {
			console.info('got nordic update info', arguments);
			callback(status);
		}, function (status) {
			console.error('Nordic update error', arguments);
			callback(status);
		}, fileName, deviceId);
	}
}
