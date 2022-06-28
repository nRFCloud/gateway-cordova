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
						COGNITO_USER_POOL_ID: 'us-east-1_ywR9wLS8D',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:8a142f1c-da22-4fb8-ac91-feefc2a36bf3',
						COGNITO_USER_POOL_CLIENT_ID: '423c0o1fdrphdb6uhoc8528d9r',
						GRAPHQL_URL: 'https://hh47fjznxzcu5l5erye2zuhoba.appsync-api.us-east-1.amazonaws.com/graphql',
						MQTT_ENDPOINT: 'a2wg6q8yw7gv5r-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.dev.nrfcloud.com/v1'
					});
					break;
				case 'Beta':
					configObject = Object.assign({}, configObject, {
						COGNITO_USER_POOL_ID: 'us-east-1_ktLOZSN2F',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:985cc751-819f-4cef-bc19-808ff02ac7aa',
						COGNITO_USER_POOL_CLIENT_ID: '2jcrv7r0d80orpcuof8jb65737',
						GRAPHQL_URL: 'https://hfqlyvy7ivcotl2ax7edtyx5sa.appsync-api.us-east-1.amazonaws.com/graphql',
						MQTT_ENDPOINT: 'a1jtaajis3u27i-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.beta.nrfcloud.com/v1'
					});
					break;
				case 'Feature':
					configObject = Object.assign({}, configObject, {
						COGNITO_USER_POOL_ID: 'us-east-1_6h4HcUqOw',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:11e36768-a6ae-4d28-87cc-3677886b0249',
						COGNITO_USER_POOL_CLIENT_ID: 'otsdg93k7klq3p20g63cl66hj',
						GRAPHQL_URL: 'https://bru3adoj4rfntmos2d56p6gaau.appsync-api.us-east-1.amazonaws.com/graphql',
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
