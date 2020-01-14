import cpf from 'cordova-promise-fs';
const fs = cpf({
	persistent: true,
	Promise: Promise,
});

export default class FS {
	async exists(file: string): Promise<boolean> {
		return !!(await fs.exists(file));
	}

	writeFile(file: string, data: string): Promise<void> {
		return fs.write(file, data);
	}

	unlink(file: string): Promise<void> {
		return fs.remove(file);
	}

	readFile(file: string): Promise<string> {
		return fs.read(file);
	}
}
