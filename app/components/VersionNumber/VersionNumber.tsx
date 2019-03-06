import * as React from 'react';
import { Typography } from '@material-ui/core/es';

import { connect } from '../../providers/StateStore';

interface MyProps {
	codePushPackage?: any;
	versionNumber?: string;
}

interface MyState {
}

class VersionNumber extends React.PureComponent<MyProps, MyState> {
	render() {
		let versionLabel = this.props.versionNumber || 'Loading...';
		if (this.props.codePushPackage && this.props.codePushPackage.appVersion && this.props.codePushPackage.label) {
			versionLabel = `${this.props.codePushPackage.appVersion}${this.props.codePushPackage.label}`;
		}
		return (
			<Typography>{versionLabel}</Typography>
		);
	}
}

export default connect(
	({
		appversion,
		codePushPackage,
	}) => ({
		versionNumber: appversion,
		codePushPackage,
	}),
)(VersionNumber);
