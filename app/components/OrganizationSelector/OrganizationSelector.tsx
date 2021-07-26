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

const OrganizationSelector: React.FC<MyProps> = ({ organizations, theme, handleOrganizationSelection }) => {
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
		handleOrganizationSelection(org);
	};

	return (
		<Dialog
			disableBackdropClick
			disableEscapeKeyDown
			fullScreen
			open
			id="org-selector-dialog"
		>
			<DialogTitle>
				Which Team?
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
								id={`org-selection-${org.id}`}
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
