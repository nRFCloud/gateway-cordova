import * as React from 'react';
import { ListItem, ListItemText, withStyles } from '@material-ui/core/es';
import red from '@material-ui/core/colors/red';
import { boundMethod } from 'autobind-decorator';

export interface Action {
	name: string;
	action: (e) => void;
	isDanger?: boolean;
}

interface MyProps {
	action: Action;
	classes?: any;
}

class ListActionItem extends React.PureComponent<MyProps, {}> {

	@boundMethod
	handleClick(e) {
		this.props.action.action(e);
	}

	render() {
		const action = this.props.action;
		let primaryClass = this.props.classes.centered;
		if (action.isDanger) {
			primaryClass = `${this.props.classes.danger} ${primaryClass}`;
		}
		return (
			<ListItem
				key={action.name}
				button
				onClick={this.handleClick}
				divider
			>
				<ListItemText
					classes={{primary: primaryClass}}
					primary={action.name}
				/>
			</ListItem>
		);
	}
}

export default withStyles({
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
})(ListActionItem);
