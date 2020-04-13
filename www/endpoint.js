(function(global) {
	var apiId = 'hnmr2uba55';
	var invokeBase = '.execute-api.us-east-1.amazonaws.com/';
	var configObject = {
		COGNITO_USER_POOL_ID: 'us-east-1_fdiBa7JSO',
		COGNITO_IDENTITY_POOL_ID: 'us-east-1:c00e1327-dfc2-4aa7-a484-8ca366d11a68',
		COGNITO_USER_POOL_CLIENT_ID: '2p40shpt1ru5gerbip9limhm15',
		AWS_REGION: 'us-east-1',
		graphQLUrl: 'https://s3t5ysg7pbcohkakeascjwgtcu.appsync-api.us-east-1.amazonaws.com/graphql',
		invokeUrl: 'https://' + apiId + invokeBase + 'prod',
		MQTT_ENDPOINT: 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com',
	};
	try {
		var env = localStorage.getItem('env');
		if (env) {
			switch (env) {
				case 'Dev':
					configObject = Object.assign({}, configObject, {
						COGNITO_USER_POOL_ID: 'us-east-1_nr0g7D0Zm',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:8a18575c-fd51-4cd7-a75a-117a264fa1b7',
						COGNITO_USER_POOL_CLIENT_ID: '21pbpsdk2pmalfh7j4t3t6g49j',
						graphQLUrl: 'https://frtzmlvskrflffiv5kuozm7ddu.appsync-api.us-east-1.amazonaws.com/graphql',
						invokeUrl: 'https://iris-api.dev.nrfcloud.com',
						MQTT_ENDPOINT: 'a2wg6q8yw7gv5r-ats.iot.us-east-1.amazonaws.com',
					});
					break;
				case 'Beta':
					configObject = Object.assign({}, configObject, {
						graphQLUrl: 'https://rsyyjmwgsbft7klufpm3qoqwq4.appsync-api.us-east-1.amazonaws.com/graphql',
						invokeUrl: 'https://' + apiId + invokeBase + 'beta',
					});
					break;
			}
		}
		console.log('found env is', env);
	} catch (error) {
		//Squelch
		console.error(error);
	}

	Object.assign(global, configObject);
})(window);
