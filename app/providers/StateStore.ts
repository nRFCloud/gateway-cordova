import createStore from 'react-waterfall';

export interface LogEvent {
	timestamp?: number;
	event: string;
}

export interface DeviceLogEvent extends LogEvent {
	device: string;
}

export interface AppState {
	gateway: LogEvent[];
	devices: { [key: string]: DeviceLogEvent[] };
	deviceList: any[];
	beaconList: any[];
	isOnline: boolean;
	isNoSeleepEnabled: boolean;
	gatewayDevice: any;
	gateways: any[];
	appversion: string;
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
		deviceList: connections.deviceList,
		beaconList: connections.beaconList,
	};
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
	},
};

export const { Provider, connect, actions, subscribe, unsubscribe } = createStore(config);
