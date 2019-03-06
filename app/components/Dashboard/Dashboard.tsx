import * as React from 'react';
import { Typography, withStyles } from '@material-ui/core/es';
import { boundMethod } from 'autobind-decorator';

import Environment, { EnvironmentType } from '../../utils/Environment';
import DeviceCard from '../DeviceCard/DeviceCard';
import { Logger } from '../../logger/Logger';

interface MyProps {
	classes?: any;
	devices: any[];
	beacons: any[];
	showLogFor: (deviceId: string) => void;
	style?: object;
}

interface MyState {
}

class Dashboard extends React.Component<MyProps, MyState> {

	@boundMethod
	private getDeviceCard(device): JSX.Element {
		return <DeviceCard showLogFor={this.showLogFor} device={device} key={device.id}/>;
	}


	private getDeviceCards(): JSX.Element[] {
		return this.props.devices && this.props.devices.map(this.getDeviceCard);
	}

	private getBeaconCards(): JSX.Element[] {
		return this.props.beacons && this.props.beacons.map(this.getDeviceCard);
	}

	@boundMethod
	private closeLog() {
		this.setState({showLogFor: null});
	}

	@boundMethod
	private showLogFor(device: any) {
		this.props.showLogFor(device.id);
	}

	render() {
		if (
			(this.props.devices && this.props.devices.length > 0) || (this.props.beacons && this.props.beacons.length > 0)
		) {
			return (
				<div style={this.props.style}>
					{this.getDeviceCards()}
					{this.getBeaconCards()}
				</div>
			);
		}

		let subDomain = '';

		if (Environment.getCurrentEnvironment() === EnvironmentType.Dev) {
			subDomain = 'dev.';
		} else if (Environment.getCurrentEnvironment() === EnvironmentType.Beta) {
			subDomain = 'beta.';
		}

		return (
			<div className={this.props.classes.noDevices} style={this.props.style}>
				<Typography variant="subtitle1" className={this.props.classes.noDevicesText}>
					You don't have any devices yet!<br />Go to <a href={`http://${subDomain}nrfcloud.com`} target="system">nRF
					Cloud</a> to add them!
				</Typography>
			</div>
		);
	}
}

export default withStyles({
	noDevices: {
		justifyContent: 'center',
		alignItems: 'center',
		display: 'flex',
		height: '100%',
	},
	noDevicesText: {
		textAlign: 'center',
	},
})(Dashboard);
