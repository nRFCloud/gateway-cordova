(function(global) {
	var invokeBase = 'https://hnmr2uba55.execute-api.us-east-1.amazonaws.com/';
	var invokeUrl = 'prod';
	try {
		var env = localStorage.getItem('env');
		if (env) {
			switch (env) {
				case 'Dev':
					invokeUrl = 'dev';
					break;
				case 'Beta':
					invokeUrl = 'beta';
					break;
			}
		}
		console.log('found env is', env);
	} catch (error) {
		//Squelch
		console.error(error);
	}
	global.invokeUrl = invokeBase + invokeUrl;
})(this);