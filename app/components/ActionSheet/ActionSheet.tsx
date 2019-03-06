import * as React from 'react';
import {
	DialogContent,
	DialogContentText, DialogTitle,
	List,
	ListItem,
	ListItemText,
	SwipeableDrawer,
	withStyles,
} from '@material-ui/core/es';
import red from '@material-ui/core/colors/red';
import { boundMethod } from 'autobind-decorator';

import ListActionItem, { Action } from '../ListActionItem/ListActionItem';

interface MyProps {
	actions: Action[];
	text: string;
	onClose: () => void;
	open: boolean;
	classes?: any;
	includeCancel?: boolean;
	title?: string;
}

class ActionSheet extends React.PureComponent<MyProps, {}> {

	@boundMethod
	onClose() {
		this.props.onClose();
	}

	@boundMethod
	noop() {
	}

	@boundMethod
	getListItem(action: Action) {
		return (
			<ListActionItem key={action.name} action={action} />
		);
	}

	render() {
		let cancel;

		if (typeof this.props.includeCancel === 'undefined' || this.props.includeCancel) {
			cancel = (
				<ListItem
					button
					onClick={this.onClose}
					autoFocus
				>
					<ListItemText classes={{primary: this.props.classes.centered}} primary="Cancel"/>
				</ListItem>
			);
		}

		let title;

		if (this.props.title) {
			title = (
				<DialogTitle>{this.props.title}</DialogTitle>
			);
		}

		return (
			<SwipeableDrawer
				open={this.props.open}
				onClose={this.onClose}
				onOpen={this.noop}
				disableDiscovery
				disableSwipeToOpen
				anchor="bottom"
				classes={{
					paperAnchorBottom: this.props.classes.paperAnchorBottom,
				}}
			>
				{title}
				<DialogContent>
					<DialogContentText>{this.props.text}</DialogContentText>
				</DialogContent>
				<List>
					{this.props.actions.map(this.getListItem)}
					{cancel}
				</List>
			</SwipeableDrawer>
		);
	}
}

export default withStyles(theme => ({
	danger: {
		color: red[500],
		'&:hover': {
			color: red[700],
		},
	},
	centered: {
		textAlign: 'center',
		paddingRight: 0,
	},
	paperAnchorBottom: {
		[theme.breakpoints.up('sm')]: {
			left: '15%',
			right: '15%',
		},
	},
}))(ActionSheet);
