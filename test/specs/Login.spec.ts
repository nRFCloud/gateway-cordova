
import LoginPage from '../pages/Login.page';

const ENV_DEV = 'Dev';

describe('Login page', () => {
	before(() => {
		LoginPage.open();
	});

	afterEach(() => {
		browser.execute('window.localStorage.clear();');
	});

	it('successfully sets environment', async () => {
		await LoginPage.setEnvironment(ENV_DEV);
		await LoginPage.showEnvironmentSelector();
		const selector = await LoginPage.environmentSelector;
		expect(await selector.getText()).toEqual(ENV_DEV);
	});

	it('rejects invalid login', async () => {
		await LoginPage.setEnvironment(ENV_DEV);
		await LoginPage.login('bobhope@example.com', 'Password123@');
		expect(await LoginPage.errorBox).toExist();
	});

	// it('allows valid login', async () => {
	// 	await LoginPage.setEnvironment(ENV_DEV);

	// });
});
