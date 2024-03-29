import * as React from 'react';
import { FormControl, InputLabel, MenuItem, Paper, Select, Typography, withStyles } from '@material-ui/core/es';
import { boundMethod } from 'autobind-decorator';

import * as AWS from 'aws-sdk';

import LoginForm, { LoginType } from '../LoginForm/LoginForm';
import { Logger } from '../../logger/Logger';
import Loader from '../Loader/Loader';
import Environment, { EnvironmentType } from '../../utils/Environment';
import Splashscreen from '../../utils/Splashscreen';
import Client from '../../utils/Client';
import VersionNumber from '../VersionNumber/VersionNumber';
import { loginEmailPassword, resumeSession } from '../../gateway-abstract/login';

interface MyProps {
	handleSuccessfulLogin: (username: string) => void;
	classes?: any;
}


interface MyState {
	error: any;
	isLoading: boolean;
	showEnvironmentSelector: boolean;
	currentEnv: EnvironmentType;
	loggingIn: boolean;
}

class LoginPage extends React.Component<MyProps, MyState> {

	timeoutHolder;
	imgClicks = 0;

	constructor(props: MyProps) {
		super(props);
		const environ = Environment.getCurrentEnvironment();

		this.state = {
			error: null,
			isLoading: true,
			showEnvironmentSelector: false,
			currentEnv: environ,
			loggingIn: false,
		};
	}

	public componentDidMount() {
		// noinspection JSIgnoredPromiseFromCall
		this.checkForLogin();
	}

	@boundMethod
	private doLogin(username: string, password: string) {
		this.setStateReturnPromise({
			loggingIn: true,
			error: null,
		}).then(() => {
			return new Promise((resolve) => setTimeout(resolve, 100));
		}).then(() => {
			return loginEmailPassword(username, password);
		}).then((credentials) => {
			AWS.config.credentials = credentials;
			return Client.getCurrentTenant(); //So I don't forget, this is to catch the user when they haven't logged into the main site. Without this, the next bit of error catch fails
		}).then(() => {
			this.props.handleSuccessfulLogin(username);
		}).catch((error) => {
			let err = error && error.message;
			Logger.error('Error logging in', JSON.stringify(error), err);
			if (err.indexOf('does not exist') > -1) {
				err = 'Incorrect username or password';
			}
			if (error.response && error.response.data && error.response.data.detail && error.response.data.detail.indexOf('create=true')) {
				err = 'You need to log in on the main website first.';
			}
			this.setState({
				error: err,
				isLoading: false,
				loggingIn: false,
			});
		});
	}

	private setStateReturnPromise(state): Promise<any> {
		return new Promise<void>((resolve) => {
			this.setState(state, () => resolve());
		});
	}

	private checkForLogin() {
		resumeSession().then((username) => {
			if (username) {
				return this.props.handleSuccessfulLogin(username);
			}
			throw new Error('Client creation failed');
		}).catch((error) => {
			Logger.info('failed to resume session', error);

			this.setState({
				isLoading: false,
			});
			Splashscreen.hide();
		});
	}

	@boundMethod
	private handleImgClick(e) {
		e.preventDefault();
		e.stopPropagation();
		if (this.state.showEnvironmentSelector) {
			return;
		}

		if (!this.timeoutHolder) {
			this.timeoutHolder = setTimeout(() => {
				this.imgClicks = 0;
			}, 5000);
		}
		++this.imgClicks;
		if (this.imgClicks > 7) {
			clearTimeout(this.timeoutHolder);
			this.timeoutHolder = null;
			this.setState({
				showEnvironmentSelector: true,
			});
		}
	}

	@boundMethod
	private handleEnvOption(e) {
		const option = +e.target.value;

		this.setState({
			currentEnv: option,
		});

		Environment.setNewEnvironment(option);
		window.location.reload();
	}

	render() {
		if (this.state.isLoading) {
			return (<Loader />);
		}

		let envSelector = null;
		if (this.state.showEnvironmentSelector) {
			envSelector = (
				<FormControl className={this.props.classes.envSelector} >
					<InputLabel htmlFor="environment-selector">Environment</InputLabel>
					<Select
						value={this.state.currentEnv}
						onChange={this.handleEnvOption}
						SelectDisplayProps={{
							id: 'environment-selector'
						}}

					>
						<MenuItem value={EnvironmentType.Prod}>Production</MenuItem>
						<MenuItem value={EnvironmentType.Beta}>Beta</MenuItem>
						<MenuItem value={EnvironmentType.Dev}>Dev</MenuItem>
						{/* <MenuItem value={EnvironmentType.Feature}>Feature</MenuItem> */}
					</Select>
				</FormControl>
			);
		}

		return (
			<>
				<div
					className={this.props.classes.logoArea}
					onClick={this.handleImgClick}
					id="logo-holder"
				>
					<img src="img/logo.svg" className={this.props.classes.logo} />
					<Typography
						variant="h5"
						className={this.props.classes.logoText}
						color="secondary"
						noWrap
					>
						nRF Cloud Gateway
					</Typography>
				</div>
				<div className={this.props.classes.upperBg} />
				<Paper className={this.props.classes.paper} elevation={1}>
					<LoginForm
						doLogin={this.doLogin}
						loggingIn={this.state.loggingIn}
						error={this.state.error}
					/>
				</Paper>
				{envSelector}
				<div className={this.props.classes.versionPlacer}>
					<VersionNumber />
				</div>
			</>
		);
	}
}

export default withStyles(theme => ({
	upperBg: {
		backgroundColor: '#009cde',
		position: 'fixed',
		height: '15rem',
		width: '100%',
		top: 0,
		zIndex: -1000,
		right: 0,
		left: 0,
	},
	logoArea: {
		textAlign: 'center',
		paddingBottom: '3.5rem',
		cursor: 'pointer', //Safari needs this
	},
	logoText: {
		display: 'inline',
		verticalAlign: '18px',
		paddingLeft: '10px',
	},
	logo: {
		width: '56px',
		color: 'white',
	},
	paper: {
		padding: '1.2rem',
		margin: '0 .5rem',
		[theme.breakpoints.up('sm')]: {
			margin: '0 auto',
			maxWidth: '40rem',
		},
	},
	envSelector: {
		marginTop: '10px',
	},
	versionPlacer: {
		position: 'absolute',
		bottom: '.5rem',
		textAlign: 'center',
		width: '100%',
		zIndex: -10,
	},
}))(LoginPage);
