import * as React from 'react';
import { BottomNavigation, BottomNavigationAction, withStyles } from '@material-ui/core/es';
import { Dashboard, Portrait } from '@material-ui/icons';
import { boundMethod } from 'autobind-decorator';

import { CurrentPage } from '../Router/Router';

interface MyProps {
	currentPage: CurrentPage;
	changePage: (page: CurrentPage) => void;
	classes?: any;
}

class BottomNav extends React.Component<MyProps, any> {

	@boundMethod
	private handleChange(e: any, newPage) {
		this.props.changePage(newPage);
	}

	render() {
		return (
			<BottomNavigation
				value={this.props.currentPage}
				onChange={this.handleChange}
				showLabels
				className={this.props.classes.appBar}
			>
				<BottomNavigationAction value={CurrentPage.Dashboard} label="Dashboard" icon={<Dashboard />} />
				<BottomNavigationAction value={CurrentPage.Settings} label="Account" icon={<Portrait />} />
			</BottomNavigation>
		);
	}
}

export default withStyles({
	appBar: {
		position: 'fixed',
		bottom: 0,
		left: 0,
		right: 0,
	},
})(BottomNav);
