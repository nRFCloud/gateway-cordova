import * as React from 'react';
import { makeStyles } from '@material-ui/styles';
import { Dialog, DialogContent, DialogTitle, List, ListItem, withTheme, ListItemText } from '@material-ui/core/es';

import { SystemTenant } from '../../utils/API';
import { Logger } from '../../logger/Logger';

interface MyProps {
	organizations: SystemTenant[];
	handleOrganizationSelection: (org: SystemTenant) => void;
	theme: any;
}

const OrganizationSelector: React.FC<MyProps> = ({organizations, theme, handleOrganizationSelection}) => {
	Logger.info('going to display selection list for orgs', organizations);
	const styles = makeStyles({
		paper: {
			padding: '1.2rem',
			margin: '0 auto',
			[theme.breakpoints.up('sm')]: {
				maxWidth: '40rem',
			},
		},
	})();

	const handleClick = (org: SystemTenant) => {
		Logger.info('clicked on', org);
		handleOrganizationSelection(org);
	};

	return (
		<Dialog
			disableBackdropClick
			disableEscapeKeyDown
			fullScreen
			open
		>
			<DialogTitle>
				Which organization?
			</DialogTitle>
			<DialogContent>
				<List>
					{organizations.sort((l, r) => l.name.localeCompare(r.name)).map((org) => {
						const onClick = () => handleClick(org);
						return (
							<ListItem
								divider
								button
								key={org.id}
								onClick={onClick}
							>
								<ListItemText>{org.name}</ListItemText>
							</ListItem>
						);
					})}
				</List>
			</DialogContent>
		</Dialog>
	);
};

export default withTheme()(OrganizationSelector);
