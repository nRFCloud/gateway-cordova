import * as React from 'react';
import { Typography } from '@material-ui/core/es';

import { connect } from '../../providers/StateStore';

interface MyProps {
	versionNumber?: string;
}

const VersionNumber: React.FC<MyProps> = ({ versionNumber }) => {

	let versionLabel = versionNumber || 'Loading...';

	return (
		<Typography>{versionLabel}</Typography>
	);
};

export default connect(
	({
		appversion,
	}) => ({
		versionNumber: appversion,
	}),
)(React.memo(VersionNumber));
