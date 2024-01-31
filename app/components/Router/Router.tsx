import * as React from 'react';
import { withStyles, AppBar, Typography, withWidth, Grid } from '@material-ui/core/es';
import SwipeableViews from 'react-swipeable-views';
import { boundMethod } from 'autobind-decorator';
import { GatewayEvent, GatewayState } from '@nrfcloud/gateway-common';

import LoginPage from '../LoginPage/LoginPage';
import Client from '../../utils/Client';
import BluetoothPlugin from '../../BluetoothPlugin';
import Loader from '../Loader/Loader';
import ProblemBanner, { Problem } from '../ProblemBanner/ProblemBanner';
import Settings from '../Settings/Settings';
import BottomNav from '../BottomNav/BottomNav';
import Dashboard from '../Dashboard/Dashboard';
import { Logger } from '../../logger/Logger';
import GatewayStatus from '../GatewayStatus/GatewayStatus';
import { Authorization } from '../../utils/Authorization';
import Splashscreen from '../../utils/Splashscreen';
import { connect, actions } from '../../providers/StateStore';
import LogScreen from '../Logging/LogScreen';
import { Platform } from '../../utils/Platform';
import API, { Team } from '../../utils/API';
import OrganizationSelector from '../OrganizationSelector/OrganizationSelector';


export enum CurrentPage {
	// Loading,
	Login,
	Dashboard,
	Settings,
	OrgSelector,
}

interface MyState {
	currentPage: CurrentPage;
	gatewayState: GatewayState;
	problem: Problem;
	isAuthorized: boolean;
	highlightCoffeeMode: boolean;
	isSigningOut: boolean;
	showLog: string;
	organizations: Team[];
}

interface MyProps {
	classes: any;
	isOnline: boolean;
	isNoSeleepEnabled: boolean;
	width: string;
	connections: any[];
	beacons: any[];
	gateway: any;
	gateways: any[];
}

class Router extends React.Component<MyProps, MyState> {
	timeoutHolder;
	listener: (e) => void;

	nextPage: CurrentPage = CurrentPage.Dashboard;

	constructor(props) {
		super(props);
		this.state = {
			currentPage: CurrentPage.Login,
			gatewayState: null,
			problem: Problem.None,
			isAuthorized: false,
			highlightCoffeeMode: false,
			isSigningOut: false,
			showLog: null,
			organizations: [],
		};

		this.listener = () => this.handleBackButton();
		document.addEventListener('backbutton', this.listener, false);
	}

	private handleBackButton() {
		if (this.state.showLog !== null) {
			this.hideLog();
		} else {
			Platform.handleBackButton();
		}
	}

	@boundMethod
	private async handleOrganizationSelection(org: Team) {
		Client.setCurrentOrganization(org);
		clearTimeout(this.timeoutHolder);
		this.timeoutHolder = null;

		let gateway;
		try {
			gateway = await Client.handleGatewayConnect();
		} catch (err) {
			Logger.info('error connecting gateway', err);
			// await this.handleSignOut();
			return;
		}

		Logger.info('gateway is', gateway);
		gateway.on(GatewayEvent.StatusChanged, async (state) => {
			if (state && state.gateway && state.gateway.disconnects && state.gateway.disconnects > 4) {
				try {
					await Client.checkIfGatewayStillExists();
				} catch (err) {
					Logger.info('Gateway keeps disconnecting', err);
					if (err.message.indexOf('no longer') > -1) {
						// noinspection JSIgnoredPromiseFromCall
						return this.handleSignOut();
					}
					throw err;
				}
			}
			const problem = await this.getAdapterProblem();
			this.setState({
				gatewayState: state,
				problem,
			});

		});

		gateway.on(GatewayEvent.Deleted, () => {
			// noinspection JSIgnoredPromiseFromCall
			this.handleSignOut();
		});

		this.setState({
			currentPage: CurrentPage.Dashboard,
			isAuthorized: true,
			gatewayState: gateway.state,
		});
		setTimeout(() => actions.setGateway(gateway));
		Splashscreen.hide();
	}

	@boundMethod
	private async handleSuccessfulLogin(username: string) {
		clearTimeout(this.timeoutHolder);
		this.timeoutHolder = null;

		// Client.setClient(client);
		const currentOrg = await Client.getCurrentTenant();
		if (currentOrg) { //if we've already selected one, we don't need to do it again
			console.info('we already have an org');
			return this.handleOrganizationSelection(currentOrg);
		}
		const orgs = await API.getTenants();
		console.info('result of getting orgs', orgs);
		if (orgs.length === 1) { //auto select the first org if there's only one
			return this.handleOrganizationSelection(orgs[0]);
		}
		this.setState({
			currentPage: CurrentPage.OrgSelector,
			organizations: orgs,
		});
		Splashscreen.hide();
	}

	private async getAdapterProblem(): Promise<Problem> {
		if (!(await BluetoothPlugin.isEnabled())) {
			return Problem.Disabled;
		}

		if (!(await BluetoothPlugin.hasPermission())) {
			return Problem.Permission;
		}

		if (!(await BluetoothPlugin.hasLocation())) {
			return Problem.Location;
		}

		return Problem.None;
	}

	@boundMethod
	private async tryEnable() {
		switch (this.state.problem) {
			case Problem.Disabled:
				await BluetoothPlugin.enable();
				break;
			case Problem.Permission:
				await BluetoothPlugin.requestPermission();
				break;
			case Problem.Location:
				await BluetoothPlugin.requestLocation();
				break;
		}
		return this.getAndSetProblem();
	}

	private async getAndSetProblem() {
		const problem = await this.getAdapterProblem();
		this.setState({
			problem,
		});
	}

	@boundMethod
	private handleCoffeeTouch() {
		this.nextPage = CurrentPage.Settings;
		this.handlePageChange({
			currentPage: CurrentPage.Settings,
			highlightCoffeeMode: true,
		});

		clearTimeout(this.timeoutHolder);
		this.timeoutHolder = setTimeout(() => {
			this.setState({
				highlightCoffeeMode: false,
			});
		}, 3000);
	}

	private handlePageChange(newState) {
		this.setState(newState);
	}

	@boundMethod
	private changeToNextPage() {
		this.handlePageChange({ currentPage: this.nextPage });
	}

	@boundMethod
	private async handleSignOut() {
		await this.setStateReturnPromise({ isSigningOut: true });
		return Authorization.logout();
	}

	private setStateReturnPromise(newState: Partial<MyState>): Promise<void> {
		return new Promise<void>((resolve) => this.setState(newState as MyState, resolve));
	}

	@boundMethod
	private handleSwipeChange(ind: number) {
		this.nextPage = ind === 0 ? CurrentPage.Dashboard : CurrentPage.Settings;
	}

	@boundMethod
	private handleNavbarChange(newPage: CurrentPage) {
		this.nextPage = newPage;
		this.handlePageChange({ currentPage: newPage });
	}

	@boundMethod
	private hideLog() {
		this.setState({ showLog: null });
	}

	@boundMethod
	private showLogFor(deviceId: string = '') {
		this.setState({ showLog: deviceId });
	}

	render() {
		let page = (
			<Loader />
		);

		const hasProblem = !this.props.isOnline || this.state.problem !== Problem.None;

		let bottomPosition = 0;

		if (hasProblem && this.props.width === 'xs') {
			bottomPosition += 49; //Snackbar height
		}

		if (this.state.isAuthorized && this.props.width === 'xs') {
			bottomPosition += 56; //Navbar height
		}

		const mainSliderHeight = `calc(100vh - 5rem - ${bottomPosition}px)`;

		let bottomNav = null;
		if (this.state.isAuthorized && this.props.width === 'xs') {
			bottomNav = (
				<BottomNav
					currentPage={this.state.currentPage}
					changePage={this.handleNavbarChange}
				/>
			);
		}

		switch (this.state.currentPage) {
			case CurrentPage.Login:
				page = (
					<LoginPage
						handleSuccessfulLogin={this.handleSuccessfulLogin}
					/>
				);
				break;
			case CurrentPage.OrgSelector:
				page = (
					<OrganizationSelector
						organizations={this.state.organizations}
						handleOrganizationSelection={this.handleOrganizationSelection}
					/>
				);
				break;
			case CurrentPage.Dashboard:
			case CurrentPage.Settings:
				let dashboardPage = <Loader />;
				if (!this.props.isOnline || (this.state.gatewayState?.connected)) {
					const connections = this.props.connections;
					const beacons = this.props.beacons;
					dashboardPage = (
						<div className={this.props.classes.viewInset}>
							<Dashboard
								style={{ minHeight: mainSliderHeight }}
								devices={connections}
								beacons={beacons}
								showLogFor={this.showLogFor}
							/>
						</div>
					);
				}

				const settingsPage = this.props.gateway ? (
					<div className={this.props.classes.viewInset}>
						<Settings
							gateway={this.props.gateway}
							highlightCoffeeMode={this.state.highlightCoffeeMode}
							setSleepModeEnabled={actions.setNoSleepEnabled}
							isSleepModeEnabled={this.props.isNoSeleepEnabled}
							signOut={this.handleSignOut}
							gateways={this.props.gateways}
							showLogFor={this.showLogFor}
						/>
					</div>
				) : <Loader />;

				if (this.props.width === 'xs') {
					page = (
						<SwipeableViews
							enableMouseEvents
							containerStyle={{
								height: mainSliderHeight,
								WebkitOverflowScrolling: 'touch',
							}}
							index={this.state.currentPage === CurrentPage.Dashboard ? 0 : 1}
							onChangeIndex={this.handleSwipeChange}
							onTransitionEnd={this.changeToNextPage}
							className={this.props.classes.swipeView}
						>
							{dashboardPage}
							{settingsPage}
						</SwipeableViews>
					);
				} else {
					page = (
						<Grid container>
							<Grid item xs>
								{dashboardPage}
							</Grid>
							<Grid item xs>
								{settingsPage}
							</Grid>
						</Grid>
					);
				}
				break;
		}

		let mainTitle = null;

		if (this.state.isAuthorized) {
			mainTitle = (
				<AppBar color="primary" className={this.props.classes.topBar}>
					<Typography variant="body1" color="secondary" className={this.props.classes.title}>nRF Cloud
						Gateway</Typography>
				</AppBar>
			);
		}

		let gatewayStatus = null;

		if (this.state.isAuthorized) {
			gatewayStatus = (
				<GatewayStatus
					gatewayState={this.state.gatewayState}
					coffeeTouch={this.handleCoffeeTouch}
					isNoSleepModeEnabled={this.props.isNoSeleepEnabled}
				/>
			);
		}

		let loader = null;

		if (this.state.isSigningOut) {
			loader = <Loader backdrop />;
		}

		const mainViewClasses = [
			this.props.classes.mainView,
		];

		switch (this.state.currentPage) {
			case CurrentPage.Login:
			case CurrentPage.OrgSelector:
				mainViewClasses.push(this.props.classes.mainViewLoginTop);
				break;
			default:
				mainViewClasses.push(this.props.classes.mainViewTop);
				break;
		}

		return (
			<>
				{mainTitle}
				{gatewayStatus}
				<div className={mainViewClasses.join(' ')} style={{ bottom: `${bottomPosition}px` }}>{page}</div>
				<ProblemBanner
					className={bottomNav ? this.props.classes.problemBannerPusher : ''}
					problem={!this.props.isOnline ? Problem.Network : this.state.problem}
					tryEnable={this.tryEnable}
				/>
				{bottomNav}
				{loader}
				<LogScreen
					isOpen={this.state.showLog != null}
					deviceId={this.state.showLog}
					close={this.hideLog}
				/>
			</>
		);
	}
}


const component = withWidth({
	// @ts-ignore
	noSSR: true,

	withTheme: true,
})(Router);

export default connect(
	({
		isOnline,
		isNoSeleepEnabled,
		beaconList,
		deviceList,
		gatewayDevice,
		gateways,
	}) => ({
		isOnline,
		isNoSeleepEnabled,
		beacons: beaconList,
		connections: deviceList,
		gateway: gatewayDevice,
		gateways,
	}),
)(withStyles({
	topBar: {
		height: '3rem',
		paddingLeft: '1rem',
		paddingRight: '1rem',
		justifyContent: 'center',
	},
	title: {
		fontWeight: 500,
		fontSize: '1.1rem',
	},
	mainView: {
		position: 'fixed',
		left: 0,
		right: 0,
		overflowY: 'scroll',
	},
	problemBannerPusher: {
		bottom: '56px',
	},
	viewInset: {
		marginLeft: '.5rem',
		marginRight: '.5rem',
	},
	mainViewLoginTop: {
		top: 0,
		paddingTop: '5rem',
	},
	mainViewTop: {
		top: '5rem',
	},
	swipeView: {
		msOverflowStyle: '-ms-autohiding-scrollbar',
	},
})(component));
