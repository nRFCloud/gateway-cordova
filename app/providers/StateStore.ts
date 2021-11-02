import { BLEDevice, ScanResult } from '@nrfcloud/gateway-common';
import createStore from 'react-waterfall';

export interface LogEvent {
	timestamp?: number;
	event: string;
}

export interface DeviceLogEvent extends LogEvent {
	device: string;
}

export interface Device extends BLEDevice, Omit<ScanResult, 'address'> {
	image?: string;
}

export interface AppState {
	gateway: LogEvent[];
	devices: { [key: string]: DeviceLogEvent[] };
	deviceList: Device[];
	beaconList: any[];
	isOnline: boolean;
	isNoSeleepEnabled: boolean;
	gatewayDevice: any;
	gateways: any[];
	appversion: string;
	codePushPackage: any;
}

const DEFAULT_STATE: AppState = {
	gateway: [],
	devices: {},
	deviceList: [],
	beaconList: [],
	isOnline: true,
	isNoSeleepEnabled: false,
	gateways: [],
	gatewayDevice: null,
	appversion: null,
	codePushPackage: null,
};

function processEvent(event: LogEvent | string): LogEvent {
	if (typeof event === 'string') {
		event = {
			event,
		};
	}

	if (!event.timestamp) {
		event.timestamp = new Date().getTime();
	}

	return event;
}

const logDeviceEvent = (state: AppState, action, event: DeviceLogEvent): Partial<AppState> => {
	event = processEvent(event) as DeviceLogEvent;
	const messages = typeof state.devices[event.device] !== 'undefined' ? state.devices[event.device] : [];
	return {
		devices: {
			[event.device]: [
				...messages,
				event,
			],
		},
	};
};

const logGatewayEvent = (state: AppState, action, event: LogEvent | string): Partial<AppState> => {
	event = processEvent(event);
	return {
		gateway: [
			...state.gateway,
			event,
		],
	};
};

const clearLog = (state: AppState, action, device: string): Partial<AppState> => {
	if (device) {
		return {
			devices: {
				[device]: [],
			},
		};
	}

	return {
		gateway: [],
	};
};

const networkChange = (state: AppState, action, isOnline: boolean): Partial<AppState> => {
	return {
		isOnline,
	};
};

const setNoSleepEnabled = (state: AppState, action, isNoSeleepEnabled: boolean): Partial<AppState> => {
	return {
		isNoSeleepEnabled,
	};
};

const setConnections = (state: AppState, action, connections): Partial<AppState> => {
	return {
		deviceList: connections.deviceList ?? state.deviceList,
		beaconList: connections.beaconList ?? state.beaconList,
	};
};

const updateDevice = (state: AppState, action, deviceUpdate: ScanResult): Partial<AppState> => {
	const list = Array.from(state.deviceList);
	const index = list.findIndex((d) => d.id === deviceUpdate.address.address || d.address.address === deviceUpdate.address.address);
	if (index !== -1) {
		list[index] = { ...list[index], ...deviceUpdate };
	}
	return {
		deviceList: list,
	}
};

const setGateways = (state: AppState, action, gateways): Partial<AppState> => {
	return {
		gateways,
	};
};

const setGateway = (state: AppState, action, gatewayDevice): Partial<AppState> => {
	return {
		gatewayDevice,
	};
};

const setAppVersion = (state: AppState, action, appVersion): Partial<AppState> => {
	return {
		appversion: appVersion,
	};
};

const setCodePushPackage = (state: AppState, action, codePushPackage): Partial<AppState> => {
	return {
		codePushPackage,
	};
};

const config = {
	initialState: DEFAULT_STATE,
	actionsCreators: {
		logDeviceEvent,
		logGatewayEvent,
		clearLog,
		networkChange,
		setNoSleepEnabled,
		setConnections,
		setGateways,
		setGateway,
		setAppVersion,
		setCodePushPackage,
		updateDevice,
	},
};

export const { Provider, connect, actions, subscribe, unsubscribe } = createStore(config);
