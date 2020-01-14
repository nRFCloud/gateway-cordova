import { BluetoothAdapter, Characteristic, Descriptor, ScanResult, Services } from '@nrfcloud/gateway-common';

export class CordovaAdapter extends BluetoothAdapter {
	connect(id: string): Promise<any> {
		return undefined;
	}

	disconnect(id: string): Promise<any> {
		return undefined;
	}

	discover(id: string): Promise<Services> {
		return undefined;
	}

	getRSSI(deviceId: string): Promise<number> {
		return undefined;
	}

	readCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<number[]> {
		return undefined;
	}

	readDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<number[]> {
		return undefined;
	}

	startScan(resultCallback: (deviceScanResult: ScanResult) => void): any {
	}

	stopScan(): any {
	}

	subscribe(deviceId: string, characteristic: Characteristic, callback: (characteristic: Characteristic) => void): Promise<void> {
		return undefined;
	}

	unsubscribe(deviceId: string, characteristic: Characteristic): Promise<void> {
		return undefined;
	}

	writeCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<void> {
		return undefined;
	}

	writeDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<void> {
		return undefined;
	}
}
