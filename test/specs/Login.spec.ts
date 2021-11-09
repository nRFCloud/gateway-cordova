
import LoginPage from '../pages/Login.page';
import TeamSelectorPage from '../pages/TeamSelector.page';

const ENV_DEV = process.env.ENVIRONMENT ?? 'Dev';

describe('Login page', () => {
	beforeEach(() => {
		LoginPage.open();
	});

	after(() => {
		browser.execute('window.localStorage.clear();');
		browser.refresh();
	});

	it('successfully sets environment', async () => {
		await LoginPage.setEnvironment(ENV_DEV);
		await LoginPage.showEnvironmentSelector();
		const selector = await LoginPage.environmentSelector;
		const selectorText = await selector.getText();
		await expect(selectorText).toEqual(ENV_DEV);
	});

	it('rejects invalid login', async () => {
		await LoginPage.setEnvironment(ENV_DEV);
		await LoginPage.login('bobhope@example.com', 'fawejoiawefojiefawjio3323#');
		const box = await LoginPage.errorBox;
		await expect(box).toHaveTextContaining('Incorrect');
	});

	it('allows valid login', async () => {
		await LoginPage.setEnvironment(ENV_DEV);
		await LoginPage.login(process.env.USERNAME, process.env.PASSWORD);
		const title = await TeamSelectorPage.pageTitle;
		await expect(title).toExist();
		await expect(title).toHaveTextContaining('Team');
	});
});
