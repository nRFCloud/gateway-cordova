import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
	FormControl,
	TextField,
	Input,
	InputLabel,
	InputAdornment,
	IconButton,
	Typography,
	Button, Grid, withStyles,
} from '@material-ui/core/es';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import { boundMethod } from 'autobind-decorator';

import Loader from '../Loader/Loader';
import { connect } from '../../providers/StateStore';
import { validateEmail, validatePassword } from '../../utils/Validators';

interface MyState {
	username: string;
	password: string;
	showPassword: boolean;
}

export enum LoginType {
	Normal,
	DevZone,
}

interface MyProps {
	doLogin: (username: string, password: string) => void;
	loggingIn: boolean;
	error: any;
	classes?: any;
	isOnline?: boolean;
}

class LoginForm extends React.Component<MyProps, MyState> {
	passwordElem: any;

	constructor(props) {
		super(props);
		let defaults = {
			username: '',
			password: '',
			showPassword: false,
		};
		if (process.env.NODE_ENV !== 'production') {
			defaults = {
				username: process.env.TEST_USERNAME ?? '',
				password: process.env.TEST_PASSWORD ?? '',
				showPassword: true,
			};
		}

		this.state = defaults;
	}

	private isFormValid(): boolean {
		return validateEmail(this.state.username) && this.state.password.length > 0;
	}

	@boundMethod
	private handleLogin(e) {
		e.preventDefault();
		e.stopPropagation();

		if (this.isFormValid()) {
			this.props.doLogin(this.state.username, this.state.password);
		}
	}

	@boundMethod
	private handleUsernameChange(e) {
		this.handleChange(e, 'username');
	}

	@boundMethod
	private handlePasswordChange(e) {
		this.handleChange(e, 'password');
	}

	private handleChange(e: any, key: string): void {
		const obj = {};
		obj[key] = e.target.value;
		this.setState(obj);
	}

	@boundMethod
	private togglePassword(e) {
		e.preventDefault();
		e.stopPropagation();
		if (this.passwordElem) {
			setTimeout(() => this.passwordElem.focus());
		}
		this.setState({ showPassword: !this.state.showPassword });
	}

	@boundMethod
	private assignPasswordRef(ref) {
		this.passwordElem = ref;
	}

	public render() {

		let loginBtn = (
			<Grid container justify="flex-end" spacing={24} className={this.props.classes.padTop}>
				<Grid item>
					<Button
						variant="contained"
						color="primary"
						disabled={!this.props.isOnline || !this.isFormValid()}
						type="submit"
					>
						Sign In
					</Button>
				</Grid>
			</Grid>
		);
		if (this.props.loggingIn) {
			loginBtn = <Loader />;
		}

		let error;

		if (this.props.error) {
			if (typeof this.props.error === 'object') {
				error = (
					<pre>{JSON.stringify(this.props.error, null, 2)}</pre>
				);
			} else {
				error = (
					<Typography color="error" id="error-message">{this.props.error}</Typography>
				);
			}
		}

		return (
			<form id="login-form" name="login-form" className={`form-group ${this.props.classes.spacer}`} onSubmit={this.handleLogin}>
				{error}
				<TextField
					label="Email"
					type="email"
					fullWidth
					disabled={this.props.loggingIn}
					value={this.state.username}
					onChange={this.handleUsernameChange}
					id="email"
				/>
				<FormControl
					fullWidth
					className={this.props.classes.padTop}
				>
					<InputLabel htmlFor="password">Password</InputLabel>
					<Input
						id="password"
						fullWidth
						disabled={this.props.loggingIn}
						value={this.state.password}
						onChange={this.handlePasswordChange}
						type={this.state.showPassword ? 'text' : 'password'}
						inputRef={this.assignPasswordRef}
						endAdornment={
							<InputAdornment position="end">
								<IconButton
									aria-label="Toggle password visibility"
									onClick={this.togglePassword}
								>
									{this.state.showPassword ? <VisibilityOff /> : <Visibility />}
								</IconButton>
							</InputAdornment>
						}
					/>
				</FormControl>
				{loginBtn}
			</form>

		);
	}
}

export default connect(({ isOnline }) => ({ isOnline }))(withStyles({
	padTop: {
		marginTop: '1.5rem',
	},
	devZone: {
		backgroundImage: 'url(img/icon-sign-in-with-DevZone.svg)',
		backgroundSize: 'contain',
		width: '368px',
		height: '48px',
		backgroundRepeat: 'no-repeat',
	},
	altSignin: {
		display: 'flex',
		justifyContent: 'center',
	},
	spacer: {
		marginTop: '1rem',
	},
})(LoginForm));
