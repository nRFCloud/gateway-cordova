import * as React from 'react';
import { ListItem, ListItemText } from '@material-ui/core/es';

import { LogEvent } from '../../providers/StateStore';

const LogEntry: React.StatelessComponent<{entry: LogEvent}> = ({entry}) => {
	const date = new Date(entry.timestamp);
	return  (
		<ListItem>
			<ListItemText primary={entry.event} secondary={`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`} />
		</ListItem>
	);
};

export default LogEntry;
