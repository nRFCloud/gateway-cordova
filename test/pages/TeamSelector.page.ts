import BasePage from './BasePage';

class TeamSelectorPage extends BasePage {
	open(): void {
	}

	get pageTitle() {
		return $('h6');
	}
}

export default new TeamSelectorPage();
