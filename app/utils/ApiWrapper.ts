import axios from 'axios';


export enum HttpMethod {
	get = 'GET',
	post = 'POST',
	put = 'PUT',
	patch = 'PATCH',
	delete = 'DELETE',
}

namespace ApiWrapper {
	let apiKey;

	export function setApiKey(key: string) {
		apiKey = key;
	}


	export async function request(url: string, type: HttpMethod = HttpMethod.get, body: string = '', version: string = null, contentType?: string) {
		const headers = {
			Accept: 'application/json',
			'Content-Type': contentType ?? (typeof body === 'string' ? 'application/json' : 'application/octet-stream'),
		};

		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		let baseUrl = '';
		let insertSlash = '';

		//We might just want the private api wrapper
		if (url.indexOf('http') === -1) {
			baseUrl = process.env.DEVICE_API_ENDPOINT;
			//Protect against adding an extra slash, fetchAll will add the slash and in the past, we've had an "extra slash problem"
			insertSlash = url[0] !== '/' ? '/' : '';
		}

		const options = {
			method: type,
			url: `${baseUrl}${insertSlash}${url}`,
			headers: headers,
		};

		if (body) {
			options['data'] = body;
		}

		return axios(options);
	}
}

export default ApiWrapper;


