import * as React from 'react';

import ActionSheet from '../ActionSheet/ActionSheet';
import { boundMethod } from 'autobind-decorator';

interface MyProps {
	open: boolean;
	logout: (result: boolean) => void;
}

export default class SignOutModal extends React.Component<MyProps, {}> {

	@boundMethod
	private cancelLogout() {
		this.props.logout(false);
	}

	@boundMethod
	private handleLogout(e) {
		e.stopPropagation();
		e.preventDefault();

		this.props.logout(true);
	}

	render() {
		return (
			<ActionSheet
				text="If you sign out, you won't be able to access this gateway	again."
				actions={[
					{
						name: 'Sign out',
						isDanger: true,
						action: this.handleLogout,
					},
				]}
				open={this.props.open}
				onClose={this.cancelLogout}
			/>
		);
	}
}
