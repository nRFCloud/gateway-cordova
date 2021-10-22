import { assumeType, FotaAdapter, UpdateInformation, UpdateStatus } from '@nrfcloud/gateway-common';
import FileUtil from './utils/FileUtil';
import { Platform } from './utils/Platform';

export class CordovaFotaAdapter extends FotaAdapter {
	startUpdate(file: Blob, deviceId: string, callback: (status: UpdateInformation) => void): void {
		this.handleUpdate(file, deviceId, callback);
	}

	private async handleUpdate(file: Blob, deviceId: string, callback: (status: UpdateInformation) => void): Promise<void> {
		const fileName = await FileUtil.saveFirmwareFile(file);
		Platform.enableInsomnia();
		window['NordicUpdate'].updateFirmware((status: UpdateInformation) => {
			callback(status);
			this.disableInsomniaIfDone(status.status);
		}, (status: UpdateInformation | string) => { // The plugin *shouldn't* just give us a string, but protect ourselves if it does
			if (typeof (status as UpdateInformation).status === 'undefined') {
				status = {
					status: UpdateStatus.DfuAborted,
					message: status as string,
					id: deviceId,
				};
			}
			assumeType<UpdateInformation>(status);
			callback(status);
			this.disableInsomniaIfDone(status.status);
		}, fileName, deviceId);
	}

	private disableInsomniaIfDone(status: UpdateStatus) {
		if (Platform.isNoSleepModeEnabled() && Platform.isIos()) {
			return;
		}
		switch (status) {
			case UpdateStatus.DfuCompleted:
			case UpdateStatus.DfuAborted:
				Platform.disableInsomnia();
				break;
		}
	}
}
