import { Card, CardActionArea, CardContent, Grid, Typography, withStyles } from '@material-ui/core/es';
import { WifiTethering } from '@material-ui/icons';
import { boundMethod } from 'autobind-decorator';
import * as Util from 'beacon-utilities';
import * as React from 'react';
import { Device } from '../../providers/StateStore';

import { Platform } from '../../utils/Platform';

interface MyProps {
	device: Device;
	classes?: any;
	showLogFor: (device: any) => void;
}

class DeviceCard extends React.PureComponent<MyProps, {}> {

	@boundMethod
	private showLog() {
		this.props.showLogFor(this.props.device);
	}

	private getBarsIcon(device: Device): string {
		if (device?.rssi) {
			const RSSI = device.rssi;
			if (RSSI) {

				if (RSSI > -70) {
					return 'status4.png';
				}

				if (RSSI > -80) {
					return 'status3.png';
				}

				if (RSSI > -90) {
					return 'status2.png';
				}

				if (RSSI <= -90) {
					return 'status1.png';
				}
			}
		}
		return 'status0.png';
	}

	render() {
		const device = this.props.device;
		let imageSrc = 'img/device-image.png';
		if (device.image || (device as any)?.raw?.image) {
			imageSrc = device.image || (device as any).raw.image;
		}

		const isIos = Platform.isIos();

		let connectedBlock = null;
		if (!(device as any).isBeacon) {

			connectedBlock = (

				<Grid container direction="column" justify="space-evenly" alignItems="center">
					<Grid item>
						<img
							className={this.props.classes.connectedImg}
							src={`img/icon-bluetooth-${device.status.connected ? 'connected' : 'nosignal'}.png`}
						/>
					</Grid>
					<Grid item>
						<Typography
							variant="caption"
							className={isIos ? this.props.classes.captionShrinker : ''}
						>
							{device.status.connected ? 'connected' : 'disconnected'}
						</Typography>
					</Grid>
				</Grid>
			);
		} else {
			let type = 'beacon';
			if (device.advertisementData) {
				type = Util.BeaconType[Util.getBeaconType(device.advertisementData)];
			}
			connectedBlock = (
				<Grid container direction="column" justify="space-evenly" alignItems="center">
					<Grid item>
						<WifiTethering />
					</Grid>
					<Grid item>
						<Typography
							variant="caption"
							className={isIos ? this.props.classes.captionShrinker : ''}
						>
							{type || 'beacon'}
						</Typography>
					</Grid>
				</Grid>
			);
		}

		return (
			<Card
				className={this.props.classes.card}
				key={device.id}
				square
			>
				<CardActionArea onClick={this.showLog}>
					<CardContent className={this.props.classes.cardContent}>
						<Grid container className={this.props.classes.bottomShrinker}>
							<Grid item xs={2} className={this.props.classes.imageHolder}>
								<img
									className={this.props.classes.image}
									src={imageSrc}
								/>
							</Grid>
							<Grid item xs className={this.props.classes.detailsHolder}>
								<Grid container className={this.props.classes.deviceName}>
									<Grid item className={this.props.classes.nameItem}>
										<Typography
											className={this.props.classes.name}
											noWrap
										>
											{(device as any).deviceName || device.name || device.id}
										</Typography>
									</Grid>
								</Grid>
								<Grid container direction="row" justify="space-between" alignItems="flex-end" className={this.props.classes.dividerLine}>
									<Grid item xs>
										{connectedBlock}
									</Grid>
									<Grid item xs>
										<Grid container direction="column" justify="space-evenly" alignItems="center">
											<Grid item>
												<img
													className={this.props.classes.connectedImg}
													src={`img/${this.getBarsIcon(device)}`}
												/>
											</Grid>
											<Grid item>
												<Typography
													variant="caption"
													className={isIos ? this.props.classes.captionShrinker : ''}
												>
													{device?.rssi ?? 'N/A'} dBm
												</Typography>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
							</Grid>
						</Grid>
					</CardContent>
				</CardActionArea>
			</Card>
		);
	}
}

export default withStyles({
	connectedImg: {
		width: '20px',
		height: '20px',
	},
	captionShrinker: {
		fontSize: '.65rem',
	},
	card: {
		marginTop: '.5rem',
		height: '5rem',
	},
	cardContent: {
		padding: '0 !important',
	},
	bottomShrinker: {
		marginBottom: '-3px',
	},
	imageHolder: {
		height: '100%',
		maxWidth: '4rem',
		flexBasis: '4rem',
	},
	image: {
		margin: '.5rem',
		width: '4rem',
		height: '4rem',
	},
	detailsHolder: {
		marginLeft: '15px',
		marginRight: '10px',
		overflow: 'hidden',
	},
	deviceName: {
		borderBottom: '1px solid #F5F5F5',
		paddingTop: '6px',
	},
	nameItem: {
		width: '100%',
	},
	name: {
		width: '100%',
	},
	dividerLine: {
		paddingTop: '5px',
	},
})(DeviceCard);
