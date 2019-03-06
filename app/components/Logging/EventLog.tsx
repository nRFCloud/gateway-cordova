import * as React from 'react';
import { Divider, List } from '@material-ui/core/es';

import LogEntry from './LogEntry';
import { connect, LogEvent, AppState } from '../../providers/StateStore';
import { Logger } from '../../logger/Logger';

interface MyProps {
	gateway?: LogEvent[];
	devices?: {[key: string]: LogEvent[]};
	deviceId?: string;
}

class EventLog extends React.PureComponent<MyProps, {}> {

	render() {
		let events = this.props.gateway;

		if (this.props.deviceId) {
			events = this.props.devices[this.props.deviceId] || [];
		}

		return (
			<List>
				{events.map((event) => {
					return (
						<React.Fragment key={event.timestamp}>
							<LogEntry entry={event}/>
							<Divider/>
						</React.Fragment>
					);
				})}
			</List>
		);
	}
}

const mapStateToProps = (state: AppState) => {
	Logger.info('called mapstatetoprops', state);
	return {
		devices: state.devices,
		gateway: state.gateway,
	};
};

export default connect(({devices, gateway}) => ({devices, gateway}))(EventLog);
