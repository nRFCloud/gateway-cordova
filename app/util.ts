import {
	BLEConnectionOptions,
	BLEAddress,
	BLEDescriptor,
	BLEDescriptors,
	BLECharacteristic,
	BLECharacteristics,
	BLECharacteristicProperties,
	BLEService,
	BLEServices,
	BLEDevice,
} from 'nrfcloud-gateway-common/src/model/g2c';

export interface Address {
	address: string;
	type: string; // TODO : Should replace this with enum
}

export function bleScanResultSDToIris(deviceFound: any): BLEDevice {
	if (deviceFound == null) {
		return null;
	}

	const device: BLEDevice = new BLEDevice();
	device.address = bluetoothAddressSoftDevice2Iris({address: deviceFound.address, type: deviceFound.addressType});
	device.rssi = deviceFound.rssi;
	device.serviceUUIDs = deviceFound.services;
	device.advertisementType = deviceFound.advType;
	device.time = deviceFound.time;
	device.name = deviceFound.name;

	return device;
}

export function bluetoothAddressSoftDevice2Iris(address: Address): BLEAddress {
	return <BLEAddress>{
		address: address.address,
		type: bluetoothAddressTypeSd2Iris(address.type),
	};
}

export function bluetoothAddressTypeSd2Iris(addressType: string): string {
	let irisAddressType: string;

	if (addressType === 'BLE_GAP_ADDR_TYPE_PUBLIC') {
		irisAddressType = 'public';
	} else if (addressType === 'BLE_GAP_ADDR_TYPE_RANDOM_STATIC') {
		irisAddressType = 'randomStatic';
	} else if (addressType === 'BLE_GAP_ADDR_TYPE_RANDOM_PRIVATE_RESOLVABLE') {
		irisAddressType = 'randomPrivateResolvable';
	} else if (addressType === 'BLE_GAP_ADDR_TYPE_RANDOM_PRIVATE_NON_RESOLVABLE') {
		irisAddressType = 'randomPrivateNonResolvable';
	} else {
		throw new Error(`Unknown Bluetooth device address type ${addressType}`);
	}

	return irisAddressType;
}

export function formatUUIDIfNecessary(uuid) {
	if (uuid.length === 32) {
		return uuid.replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/, '$1-$2-$3-$4-$5');
	}
	return uuid;
}

export function shortenUUID(uuid: string) {
	return uuid.replace(/-/g, '');
}

export const rootCA = `-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----`;
