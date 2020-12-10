import * as React from 'react';
import { boundMethod } from 'autobind-decorator';

import { Platform } from '../../utils/Platform';
import ActionSheet from '../ActionSheet/ActionSheet';

interface MyProps {
	open: boolean;
	enableBackground: (result: boolean) => void;
}

export default class BackgroundModeModal extends React.Component<MyProps, {}> {

	@boundMethod
	private enableBackground() {
		this.toggleBackground(true);
	}

	@boundMethod
	private disableBackground() {
		this.toggleBackground(false);
	}

	private toggleBackground(enabled: boolean) {
		this.props.enableBackground(enabled);
	}

	render() {

		let sleepModeText = `By enabling this option, nRF Cloud Gateway will run in the background. This
							may use lots of data and battery. To close the
							gateway, you can swipe it away on the "Recent Apps" screen or use the notification's "Close"
							button.`;
		let sleepModeTitle = 'Enable background mode?';

		if (Platform.isIos()) {
			sleepModeText = `By enabling this option, nRF Cloud Gateway will keep your screen on. This
							 will drain your battery faster. To stop it, you can sleep your phone manually
							 or turn off this option.`;
			sleepModeTitle = 'Prevent sleeping?';
		}

		return (
			<ActionSheet
				onClose={this.disableBackground}
				open={this.props.open}
				actions={[{
					name: 'Enable',
					isDanger: true,
					action: this.enableBackground,
				}]}
				text={sleepModeText}
				title={sleepModeTitle}
			/>
		);
	}
}

