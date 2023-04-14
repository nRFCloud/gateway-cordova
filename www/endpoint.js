(function (global) {
	var configObject = {
		COGNITO_USER_POOL_ID: 'us-east-1_2u7cSZZ4K',
		COGNITO_IDENTITY_POOL_ID: 'us-east-1:cd81c47e-98de-401d-a70d-1c26b7c8ae96',
		COGNITO_USER_POOL_CLIENT_ID: 'llvecda3hv7ffn4a7j6mn35v5',
		AWS_REGION: 'us-east-1',
		GRAPHQL_URL: 'https://graphql.us-east-1.nrfcloud.com/graphql',
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
						GRAPHQL_URL: 'https://graphql.us-east-1.dev.nrfcloud.com/graphql',
						MQTT_ENDPOINT: 'a2wg6q8yw7gv5r-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.dev.nrfcloud.com/v1'
					});
					break;
				case 'Beta':
					configObject = Object.assign({}, configObject, {
						COGNITO_USER_POOL_ID: 'us-east-1_ktLOZSN2F',
						COGNITO_IDENTITY_POOL_ID: 'us-east-1:985cc751-819f-4cef-bc19-808ff02ac7aa',
						COGNITO_USER_POOL_CLIENT_ID: '2jcrv7r0d80orpcuof8jb65737',
						GRAPHQL_URL: 'https://graphql.us-east-1.beta.nrfcloud.com/graphql',
						MQTT_ENDPOINT: 'a1jtaajis3u27i-ats.iot.us-east-1.amazonaws.com',
						DEVICE_API_ENDPOINT: 'https://api.beta.nrfcloud.com/v1'
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
