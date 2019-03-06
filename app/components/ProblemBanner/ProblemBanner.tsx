import * as React from 'react';
import { Button, Snackbar, SnackbarContent, withStyles } from '@material-ui/core/es';
import { emphasize } from '@material-ui/core/es/styles/colorManipulator';
import { boundMethod } from 'autobind-decorator';

import { Platform } from '../../utils/Platform';

export enum Problem {
	Disabled,
	Permission,
	Location,
	None,
	Network,
}

interface MyProps {
	problem: Problem;
	tryEnable: () => void;
	classes?: any;
	className?: string;
}



class ProblemBanner extends React.Component<MyProps, any> {

	@boundMethod
	private tryEnable() {
		this.props.tryEnable();
	}

	private getProblemBanner(): JSX.Element {

		if (this.props.problem === Problem.None) {
			return null;
		}
		let message;
		let isPossible;

		switch (this.props.problem) {
			case Problem.Location:
				message = 'Bluetooth needs location to operate';
				isPossible = true;
				break;
			case Problem.Permission:
				message = 'Bluetooth needs permission to operate';
				isPossible = true;
				break;
			case Problem.Disabled:
				message = 'Bluetooth is disabled!';
				isPossible = Platform.isAndroid(); //only on Android
				break;
			case Problem.Network:
				message = 'Network connection is down!';
				isPossible = false;
				break;
		}

		let action = null;
		if (isPossible) {
			action = (<Button variant="text" color="primary" onClick={this.tryEnable}>Enable</Button>);
		}

		return (
			<SnackbarContent
				className={this.props.classes.content}
				message={message}
				action={action}
				classes={{root: this.props.classes.snackbarContentRoot}}
			/>
		);
	}


	render() {
		return (
			<Snackbar
				open={this.props.problem !== Problem.None}
				anchorOrigin={{horizontal: 'center', vertical: 'bottom'}}
				className={`${this.props.className} ${this.props.classes.messagebar}`}
				autoHideDuration={null}
				classes={{anchorOriginBottomCenter: this.props.classes.anchorOriginBottomCenter}}
			>
				{this.getProblemBanner()}
			</Snackbar>
		);
	}
}

const styles = theme => {
	const bottom = { bottom: 0 };
	const center = {
		left: '50%',
		right: 'auto',
		transform: 'translateX(-50%)',
	};

	const emphasis = theme.palette.type === 'light' ? 0.8 : 0.98;
	const backgroundColor = emphasize(theme.palette.background.default, emphasis);


	return {
		messagebar: {
			alignItems: 'center',
			justifyContent: 'center',
			zIndex: 0,
		},
		content: {
			width: '100%',
			maxWidth: '100%',
			borderRadius: 0,
		},
		anchorOriginBottomCenter: {
			...bottom,
			[theme.breakpoints.up('sm')]: {
				...center,
			},
		},
		snackbarContentRoot: {
			color: theme.palette.getContrastText(backgroundColor),
			backgroundColor,
			display: 'flex',
			alignItems: 'center',
			flexWrap: 'wrap',
			padding: '6px 24px',
			[theme.breakpoints.up('sm')]: {
				minWidth: 288,
				maxWidth: 568,
				// borderRadius: theme.shape.borderRadius,
			},
			[theme.breakpoints.down('sm')]: {
				flexGrow: 1,
			},
		},
	};
};
export default withStyles(styles as any)(ProblemBanner);
