import BasePage from './BasePage';

class LoginPage extends BasePage {
	open() {
	}

	get inputEmail() {
		return $('[type="email"]');
	}

	get inputPassword() {
		return $('#password');
	}

	get loginButton() {
		return $('[type=submit]');
	}

	get logo() {
		return $('#logo-holder');
	}

	get environmentSelector() {
		return $('#environment-selector');
	}

	get errorBox() {
		return $('#error-message');
	}

	async login(email: string, password: string) {
		const inputEmail = await this.inputEmail;
		await inputEmail.waitForEnabled();
		await inputEmail.setValue(email);

		const inputPassword = await this.inputPassword;
		await inputPassword.setValue(password);
		const loginButton = await this.loginButton;
		await loginButton.click();
	}

	async showEnvironmentSelector() {
		const logo = await this.logo;
		await logo.waitForDisplayed();
		for (let x = 0; x < 8; ++x) {
			await logo.click();
		}
		const envSelector = await this.environmentSelector;
		await envSelector.waitForDisplayed();
	}

	async setEnvironment(newEnv: string) {
		if (!(await (await this.environmentSelector).isExisting())) {
			await this.showEnvironmentSelector();
		}
		const envSelector = await this.environmentSelector;
		await envSelector.click();
		const option = await $(`li=${newEnv}`);
		await option.waitForClickable();
		await option.click();
		await browser.waitUntil(() => browser.execute(() => document.readyState === 'complete'));
		return (await this.inputEmail).waitForExist();
	}
}

export default new LoginPage();
