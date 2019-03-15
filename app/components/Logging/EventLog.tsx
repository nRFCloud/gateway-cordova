import * as React from 'react';
import { Divider, List } from '@material-ui/core/es';

import LogEntry from './LogEntry';
import { connect, LogEvent } from '../../providers/StateStore';

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

		const eventsCopy = Array.from(events);
		eventsCopy.sort((l, r) => r.timestamp - l.timestamp);

		return (
			<List>
				{eventsCopy.map((event) => {
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

export default connect(({devices, gateway}) => ({devices, gateway}))(EventLog);
