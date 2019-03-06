import * as React from 'react';
import { render } from 'react-dom';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/es';

import './styles.scss';
import App from './components/App/App';
import { Provider } from './providers/StateStore';

const theme = createMuiTheme({
	typography: {
		useNextVariants: true,
	},
	palette: {
		primary: {
			main: '#009cde',
		},
		secondary: {
			main: '#ffffff',
		},
	},
	overrides: {
		MuiBottomNavigation: {
			root: {
				backgroundColor: '#003952',
			},
		},
		MuiBottomNavigationAction: {
			root: {
				color: '#0081B7',
				'&$selected': {
					color: '#ffffff !important',
				},
			},
		},
		MuiButtonBase: {
			root: {
				cursor: 'pointer',
			},
		},
	},
});

if (process.env.NODE_ENV !== 'production' && location.host.indexOf('localhost') > -1) {
	const script = document.createElement('script');
	script.src = `http://${(location.host || 'localhost').split(':')[0]}:35730/livereload.js?snipver=1`;
	document.head.appendChild(script);
}

render(
	<MuiThemeProvider theme={theme}>
		<Provider>
			<App />
		</Provider>
	</MuiThemeProvider>,
	document.getElementById('app'),
);

