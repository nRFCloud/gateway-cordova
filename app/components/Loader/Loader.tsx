import * as React from 'react';
import { Backdrop, withStyles } from '@material-ui/core/es';

import './styles.scss';

interface MyProps {
	backdrop?: boolean;
	classes?: any;
}

class Loader extends React.Component<MyProps, any> {
	public render() {
		const setting = this.props.backdrop ? 'loaderCenter' : '';
		// This comes from http://tobiasahlin.com/spinkit/
		return (
			<div>
				<Backdrop className={this.props.classes.backdrop} open={!!this.props.backdrop} />
				<div className={setting}>
					<div className="sk-folding-cube">
						<div className="sk-cube1 sk-cube"/>
						<div className="sk-cube2 sk-cube"/>
						<div className="sk-cube4 sk-cube"/>
						<div className="sk-cube3 sk-cube"/>
					</div>
				</div>
			</div>
		);
	}
}

export default withStyles({
	backdrop: {
		zIndex: 9999,
	},
})(Loader);
