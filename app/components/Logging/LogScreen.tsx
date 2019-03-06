import * as React from 'react';
import { AppBar, Dialog, IconButton, Slide, Toolbar, Typography, withStyles } from '@material-ui/core/es';
import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import { boundMethod } from 'autobind-decorator';

import EventLog from './EventLog';
import { actions } from '../../providers/StateStore';

interface MyProps {
	deviceId?: string;
	classes?: any;
	isOpen: boolean;
	close: () => void;
}

function Transition(props) {
	return <Slide direction="up" {...props} />;
}

class LogScreen extends React.Component<MyProps, {}> {

	@boundMethod
	private clearLog(e: React.SyntheticEvent<any>) {
		e.preventDefault();
		e.stopPropagation();
		e.currentTarget.blur();

		// noinspection TypeScriptValidateJSTypes
		actions.clearLog(this.props.deviceId);
	}

	@boundMethod
	private close() {
		this.props.close();
	}

	render() {
		const deviceTitle = this.props.deviceId ? (
			<Typography color="secondary" variant="subtitle1">{this.props.deviceId}</Typography>
		) : null;

		return (
			<Dialog
				fullScreen
				open={this.props.isOpen}
				onClose={this.close}
				TransitionComponent={Transition}
			>
				<AppBar>
					<Toolbar disableGutters>
						<IconButton color="secondary" onClick={this.close} aria-label="Close">
							<CloseIcon/>
						</IconButton>
						<Typography color="secondary" variant="h6" className={this.props.classes.flex}>
							Logs
						</Typography>
						{deviceTitle}
						<IconButton color="secondary" onClick={this.clearLog} aria-label="Clear">
							<DeleteIcon/>
						</IconButton>
					</Toolbar>
				</AppBar>
				<div className={this.props.classes.logArea}>
					<EventLog deviceId={this.props.deviceId}/>
				</div>
			</Dialog>
		);
	}
}

export default withStyles({
	flex: {
		flex: 1,
	},
	logArea: {
		paddingTop: '3rem',
	},
})(LogScreen);
