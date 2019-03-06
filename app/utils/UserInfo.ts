namespace UserInfo {
	let userInfo;
	export function getEmail() {
		const info = getUserInfo();
		return info && info.username;
	}

	function getUserInfo() {
		if (!userInfo) {
			userInfo = JSON.parse(localStorage.getItem('nrfcloudCognitoData'));
		}
		return userInfo;
	}
}

export default UserInfo;
