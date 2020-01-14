import * as React from 'react';
import { FormControl, InputLabel, MenuItem, Paper, Select, Typography, withStyles } from '@material-ui/core/es';
import { boundMethod } from 'autobind-decorator';

// @ts-ignore
import RestApi from 'RestApi';
// @ts-ignore
import AWS from 'AWS';

import { Cognito } from '../../utils/Cognito';

import LoginForm, { LoginType } from '../LoginForm/LoginForm';
import { Logger } from '../../logger/Logger';
import Loader from '../Loader/Loader';
import Environment, { EnvironmentType } from '../../utils/Environment';
import { DevzoneHelper } from '../../utils/DevzoneHelper';
import Splashscreen from '../../utils/Splashscreen';
import Client from '../../utils/Client';
import VersionNumber from '../VersionNumber/VersionNumber';

interface MyProps {
	handleSuccessfulLogin: (client: any, username: string) => void;
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
	private doLogin(username, password, type: LoginType) {
		let outerClient;
		this.setStateReturnPromise({
			loggingIn: true,
			error: null,
		}).then(() => {
			return new Promise((resolve) => setTimeout(resolve, 100));
		}).then(() => {
			if (type !== LoginType.DevZone) {
				return Cognito.login(username.toLowerCase(), password);
			} else {
				return DevzoneHelper.showDevzoneWindow();
			}
		}).then(() => {
			return AWS.config.credentials
				.getPromise()
				.then(() => RestApi(AWS.config.credentials));
		}).then((client) => {
			Logger.info('logged in successfully!', client);
			outerClient = client;
			return Client.getCurrentTenant(); //So I don't forget, this is to catch the user when they haven't logged into the main site. Without this, the next bit of error catch fails
		}).then(() => {
			this.props.handleSuccessfulLogin(outerClient, username);
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
		return new Promise((resolve) => {
			this.setState(state, () => resolve());
		});
	}

	private checkForLogin() {
		DevzoneHelper.resumeSession().then((result) => {
			if (!result) {
				return Cognito.resumeSession();
			}
		}).then(() => {
			return AWS.config.credentials
				.getPromise()
				.then(() => RestApi(AWS.config.credentials));
		}).then((client) => {
			if (client) {
				return this.props.handleSuccessfulLogin(client, client.cognitoUser && client.cognitoUser.username);
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
				<FormControl className={this.props.classes.envSelector}>
					<InputLabel htmlFor="env-select">Environment</InputLabel>
					<Select
						value={this.state.currentEnv}
						onChange={this.handleEnvOption}
					>
						<MenuItem value={EnvironmentType.Production}>Production</MenuItem>
						<MenuItem value={EnvironmentType.Beta}>Beta</MenuItem>
						<MenuItem value={EnvironmentType.Dev}>Dev</MenuItem>
					</Select>
				</FormControl>
			);
		}

		// noinspection HtmlUnknownTarget
		// noinspection CheckTagEmptyBody
		return (
			<div>
				<div
					className={this.props.classes.logoArea}
					onClick={this.handleImgClick}
				>
					<img src="img/logo.svg" className={this.props.classes.logo}/>
					<Typography
						variant="h5"
						className={this.props.classes.logoText}
						color="secondary"
						noWrap
					>
						nRF Cloud Gateway
					</Typography>
				</div>
				<div className={this.props.classes.upperBg}/>
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
			</div>
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
