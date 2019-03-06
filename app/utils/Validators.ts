export function validateEmail(email): boolean {
	if (email.length < 1) {
		return false;
	}

	if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
		const input: HTMLInputElement = document.createElement('input') as HTMLInputElement;
		input.type = 'email';
		input.value = email;
		if (typeof input.checkValidity === 'function') {
			return input.checkValidity();
		}
	}

	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(pw): boolean {
	return (
		//Based on Cognito's requirements:
		pw.length >= 8 && //Length

		///[A-Z]/.test(pw) && //Must have uppercase

		/[0-9]/.test(pw) // && //Must have digit

		///[a-z]/.test(pw) && //Must have lowercase

		///[\^$*.\[\]{}()?\-"!@#%&\/,><`:;|_~']/.test(pw) //Must have special character
	);
}
