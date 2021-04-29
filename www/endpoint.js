(function (global) {
	var configObject = {
		COGNITO_USER_POOL_ID: 'us-east-1_fdiBa7JSO',
		COGNITO_IDENTITY_POOL_ID: 'us-east-1:c00e1327-dfc2-4aa7-a484-8ca366d11a68',
		COGNITO_USER_POOL_CLIENT_ID: '2p40shpt1ru5gerbip9limhm15',
		AWS_REGION: 'us-east-1',
		GRAPHQL_URL: 'https://pdhccldfvzh5pjwtjpr5wyjvxu.appsync-api.us-east-1.amazonaws.com/graphql',
		MQTT_ENDPOINT: 'a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com',
		DEVICE_API_ENDPOINT: 'https://api.nrfcloud.com/v1'
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
						GRAPHQL_URL: 'https://oguodtpv5zhuja2mthb4ur2nku.appsync-api.us-east-1.amazonaws.com/graphql',
						MQTT_ENDPOINT: 'a2wg6q8yw7gv5r-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.dev.nrfcloud.com/v1'
					});
					break;
				case 'Beta':
					configObject = Object.assign({}, configObject, {
						COGNITO_USER_POOL_ID: 'us-east-1_DNB5DSPuV',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:7ac015e8-97bc-4038-99a9-e5a8ad94bedd',
						COGNITO_USER_POOL_CLIENT_ID: '32nf5gkols4vjngt09rdu7lvcu',
						GRAPHQL_URL: 'https://oueegzvkmra7tpfvqnb45l7lzq.appsync-api.us-east-1.amazonaws.com/graphql',
						MQTT_ENDPOINT: 'a1jtaajis3u27i-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.beta.nrfcloud.com/v1'
					});
					break;
				case 'Feature':
					configObject = Object.assign({}, configObject, {
						COGNITO_USER_POOL_ID: 'us-east-1_7j72ADM6A',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:11e36768-a6ae-4d28-87cc-3677886b0249',
						COGNITO_USER_POOL_CLIENT_ID: '6u6aitl15tmulpb7e6amfm6095',
						GRAPHQL_URL: 'https://dya2vcgtmbaavlmijboptsgj64.appsync-api.us-east-1.amazonaws.com/graphql',
						MQTT_ENDPOINT: 'a1zbg31mxiwr-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.feature.nrfcloud.com/v1'
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
