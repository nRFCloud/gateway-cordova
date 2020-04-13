import * as React from 'react';
import {
	Button,
	Card,
	CardActionArea,
	CardContent,
	Checkbox, FormControl,
	Grid, MenuItem, Select,
	Typography,
	withStyles,
} from '@material-ui/core/es';
import { boundMethod } from 'autobind-decorator';

import Client from '../../utils/Client';
import Environment, { EnvironmentType } from '../../utils/Environment';
import UserInfo from '../../utils/UserInfo';
import { Platform } from '../../utils/Platform';
import BackgroundModeModal from '../BackgroundModeModal/BackgroundModeModal';
import SignOutModal from '../SignOutModal/SignOutModal';
import { Logger } from '../../logger/Logger';
import VersionNumber from '../VersionNumber/VersionNumber';

interface MyProps {
	classes?: any;
	gateway: any;
	highlightCoffeeMode: boolean;
	setSleepModeEnabled: (enabled: boolean) => void;
	isSleepModeEnabled: boolean;
	signOut: () => void;
	showLogFor: (deviceId?: string) => void;
	gateways?: any[];
}

interface MyState {
	environment: EnvironmentType;
	userEmail: string;
	tenantId: string;
	gatewayId: string;
	showLogout: boolean;
	isSigningOut: boolean;
	showEnableBackground: boolean;
	showGatewaySwitch: boolean;
}

class Settings extends React.Component<MyProps, MyState> {
	coffeeModeRef: any;
	timeoutHolder;
	versionClicks: number = 0;

	constructor(props: MyProps) {
		super(props);
		this.state = {
			environment: Environment.getCurrentEnvironment(),
			userEmail: UserInfo.getEmail(),
			tenantId: '',
			gatewayId: Client.getGatewayId(),
			showLogout: false,
			isSigningOut: false,
			showEnableBackground: false,
			showGatewaySwitch: false,
		};
	}

	@boundMethod
	private async handleLogout(result: boolean) {

		await this.setStateReturnPromise({
			showLogout: false,
		});

		if (result) {
			this.props.signOut();
		}
	}

	private setStateReturnPromise(newState): Promise<any> {
		return new Promise(resolve => this.setState(newState, resolve));
	}

	private toggleBackground(enable: boolean) {
		if (enable) {
			Platform.startNoSleepMode();
		} else {
			Platform.stopNoSleepMode();
		}
		this.props.setSleepModeEnabled(enable);
		this.setState({showEnableBackground: false});
	}

	@boundMethod
	private handleBackgroundModeChanged() {
		if (Platform.isNoSleepModeEnabled()) {
			this.toggleBackground(false);
		} else {
			this.setState({showEnableBackground: true});
		}
	}

	@boundMethod
	private handleEnableBackground(result: boolean) {
		if (result) {
			this.toggleBackground(true);
		} else {
			this.setState({showEnableBackground: false});
		}
	}

	@boundMethod
	private setCoffeeModeRef(ref) {
		this.coffeeModeRef = ref;
	}

	@boundMethod
	private showGatewayLog() {
		this.props.showLogFor();
	}

	@boundMethod
	private showLogoutModal() {
		this.setState({showLogout: true});
	}

	@boundMethod
	private async handleGatewayChange(e) {
		const option = e.target.value;
		Logger.info('switching gateway!', option);
		await Client.setGatewayId(option);
		location.reload();
	}

	@boundMethod
	private handleVersionClick(e) {
		e.stopPropagation();
		e.preventDefault();

		if (this.state.showGatewaySwitch) {
			return;
		}

		if (!this.timeoutHolder) {
			this.timeoutHolder = setTimeout(() => {
				this.versionClicks = 0;
			}, 5000);
		}

		++this.versionClicks;

		if (this.versionClicks > 7) {
			clearTimeout(this.timeoutHolder);
			this.timeoutHolder = null;
			this.setState({
				showGatewaySwitch: true,
			});
		}
	}

	render() {
		let envNotice = null;

		if (this.state.environment !== EnvironmentType.Production) {
			envNotice = (
				<CardContent className={`${this.props.classes.cardContent} ${this.props.classes.gridSeparator}`}>
					<Grid container>
						<Grid item xs={2}>
							<Typography>Environment:</Typography>
						</Grid>
						<Grid item xs className={this.props.classes.infoItem}>
							<Typography>{EnvironmentType[this.state.environment]}</Typography>
						</Grid>
					</Grid>
				</CardContent>
			);
		}

		let gatewaySelector = null;

		if (this.state.showGatewaySwitch && this.props.gateways && this.props.gateways.length > 0 && this.props.gateway) {
			gatewaySelector = (
				<React.Fragment>
					<Typography className={this.props.classes.padTop}>Gateway switch</Typography>
					<Card className={this.props.classes.card}>
						<CardContent
							className={`${this.props.classes.cardContent} ${this.props.classes.gridSeparator}`}
						>
							<Grid container>
								<Grid item xs={2}>
									<Typography>Gateway:</Typography>
								</Grid>
								<Grid item xs className={this.props.classes.infoItem}>
									<FormControl className={this.props.classes.gatewaySelector}>
										<Select
											value={Client.getGatewayId(this.props.gateway)}
											onChange={this.handleGatewayChange}
										>
											{this.props.gateways.map((gateway) => {
												return (
													<MenuItem
														key={gateway.id}
														value={gateway.id}
													>
														{gateway.name || gateway.id}
													</MenuItem>
												);
											})}
										</Select>
									</FormControl>
								</Grid>
							</Grid>
						</CardContent>
					</Card>
				</React.Fragment>
			);
		}

		let sleepModeSetting = 'Background mode';

		if (Platform.isIos()) {
			sleepModeSetting = 'Stay awake';
		}

		let bgMode;

		if (Platform.supportsNoSleepMode()) {
			bgMode = (
				<CardContent
					className={`${this.props.classes.cardContent} ${this.props.classes.gridSeparator} ${this.props.highlightCoffeeMode ? 'highlight' : ''}`}
				>
					<Grid container className={this.props.classes.bgModeRow}>
						<Grid item xs>
							<Typography>{sleepModeSetting}:</Typography>
						</Grid>
						<Grid item xs={1} className={this.props.classes.infoItem}>
							<Checkbox
								inputRef={this.setCoffeeModeRef}
								className={this.props.classes.bgCheckbox}
								checked={this.props.isSleepModeEnabled}
								onChange={this.handleBackgroundModeChanged}
								color="primary"
							/>
						</Grid>
					</Grid>
				</CardContent>
			);
		}

		return (
			<div className={this.props.classes.main}>
				<Typography>User details</Typography>
				<Card className={this.props.classes.card}>
					<CardContent className={this.props.classes.cardContent}>
						<Grid container>
							<Grid item xs={2}>
								<Typography>Email:</Typography>
							</Grid>
							<Grid item xs className={this.props.classes.infoItem}>
								<Typography>{this.state.userEmail}</Typography>
							</Grid>
						</Grid>
					</CardContent>
					<CardContent className={`${this.props.classes.cardContent} ${this.props.classes.gridSeparator}`}>
						<Grid container>
							<Grid item xs={2}>
								<Typography>Tenant:</Typography>
							</Grid>
							<Grid item xs className={this.props.classes.infoItem}>
								<Typography className={this.props.classes.idText}>{this.state.tenantId}</Typography>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				<Typography className={this.props.classes.padTop}>Gateway details</Typography>
				<Card className={this.props.classes.card}>
					<CardContent className={this.props.classes.cardContent}>
						<Grid container>
							<Grid item xs={2}>
								<Typography>Name:</Typography>
							</Grid>
							<Grid item xs className={this.props.classes.infoItem}>
								<Typography>{Client.getGatewayName(this.props.gateway)}</Typography>
							</Grid>
						</Grid>
					</CardContent>
					<CardContent className={`${this.props.classes.cardContent} ${this.props.classes.gridSeparator}`}>
						<Grid container>
							<Grid item xs={1}>
								<Typography>Id:</Typography>
							</Grid>
							<Grid item xs className={this.props.classes.infoItem}>
								<Typography className={this.props.classes.idText}>{this.state.gatewayId}</Typography>
							</Grid>
						</Grid>
					</CardContent>
					{bgMode}
					<CardActionArea onClick={this.showGatewayLog}>
						<CardContent
							className={`${this.props.classes.cardContent} ${this.props.classes.gridSeparator}`}
						>
							<Typography className={this.props.classes.center}>View log</Typography>
						</CardContent>
					</CardActionArea>
				</Card>

				<Typography className={this.props.classes.padTop}>About</Typography>
				<Card className={this.props.classes.card}>
					<CardContent
						onClick={this.handleVersionClick}
						className={this.props.classes.cardContent}
					>
						<Grid container>
							<Grid item xs={2}>
								<Typography>Version:</Typography>
							</Grid>
							<Grid item xs className={this.props.classes.infoItem}>
								<VersionNumber />
							</Grid>
						</Grid>
					</CardContent>
					{envNotice}

				</Card>

				{gatewaySelector}

				<Button
					fullWidth
					variant="outlined"
					className={this.props.classes.padTop}
					onClick={this.showLogoutModal}
				>
					<Typography>Sign out</Typography>
				</Button>
				<SignOutModal
					open={this.state.showLogout}
					logout={this.handleLogout}
				/>
				<BackgroundModeModal
					open={this.state.showEnableBackground}
					enableBackground={this.handleEnableBackground}
				/>
			</div>
		);
	}
}

export default withStyles({
	main: {
		marginTop: '.5rem',
		marginBottom: '.5rem',
	},
	card: {
		marginBottom: '-3px',
	},
	cardContent: {
		padding: '1rem !important',
	},
	infoItem: {
		textAlign: 'right',
	},
	gridSeparator: {
		borderTop: '1px solid #e5e5e5',
	},
	padTop: {
		marginTop: '1rem',
	},
	idText: {
		fontSize: '.85rem',
	},
	bgCheckbox: {
		padding: 0,
	},
	bgModeRow: {
		alignItems: 'center',
	},
	center: {
		textAlign: 'center',
	},
	gatewaySelector: {
		marginTop: '-.5rem',
		maxWidth: '15rem',
	},
})(Settings);
