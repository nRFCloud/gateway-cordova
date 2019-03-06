namespace Splashscreen {
	export function hide() {
		if (navigator['splashscreen']) {
			navigator['splashscreen'].hide();
		}
	}
}

export default Splashscreen;
