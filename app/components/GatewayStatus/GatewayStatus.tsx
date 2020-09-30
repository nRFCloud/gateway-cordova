import * as React from 'react';
import { AppBar, Grid, IconButton, Typography, withStyles } from '@material-ui/core/es';
import Coffee from 'mdi-material-ui/Coffee';
import { boundMethod } from 'autobind-decorator';
import { GatewayState } from '@nrfcloud/gateway-common';

interface MyProps {
	classes?: any;
	gatewayState: GatewayState;
	coffeeTouch?: () => void;
	isNoSleepModeEnabled: boolean;
}

interface MyState {
}

class GatewayStatus extends React.Component<MyProps, MyState> {

	@boundMethod
	private handleCoffeeClick(e: React.SyntheticEvent<any>) {
		if (typeof this.props.coffeeTouch === 'function') {
			this.props.coffeeTouch();
		}

		e.currentTarget.blur();
	}

	render() {
		let statusPosition = 'Connecting...';
		if (this.props.gatewayState.connected) {
			statusPosition = 'Connected';

			if (this.props.gatewayState.scanning) {
				statusPosition = 'Scanning';
			}
		}

		let coffee;

		if (this.props.isNoSleepModeEnabled) {
			coffee = (
				<IconButton className={this.props.classes.coffee} onClick={this.handleCoffeeClick}><Coffee/></IconButton>
			);
		}

		return (
			<AppBar className={this.props.classes.topBar}>
				<Grid container>
					<Grid item xs>
						<Typography variant="body2" color="secondary">Gateway {statusPosition}</Typography>
					</Grid>
					<Grid item xs={1}>
						{coffee}
					</Grid>
				</Grid>
			</AppBar>
		);
	}
}

export default withStyles({
	topBar: {
		top: '3rem',
		backgroundColor: '#0081B7',
		height: '2rem',
		paddingLeft: '1rem',
		paddingRight: '1rem',
		justifyContent: 'center',
	},
	coffee: {
		position: 'fixed',
		marginTop: '-13px',
		right: '.2rem',
		color: 'white',
	},
})(GatewayStatus);
