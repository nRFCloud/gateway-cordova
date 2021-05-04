import * as csvParser from 'json2csv';
import cpf from 'cordova-promise-fs';

import { LogEvent } from '../providers/StateStore';
import Notifications from './Notifications';
import { Platform } from './Platform';

const csvOptions = {
	fields: ['event', {
		label: 'timestamp',
		value: (row) => new Date(row.timestamp).toISOString(),
	}],
};

let fs;

namespace FileUtil {

	function getFileSystem() {
		if (!fs) {
			const fsOptions = {
				persistent: true,
				Promise: Promise,
			};
			if (Platform.isAndroid()) {
				fsOptions['fileSystem'] = window['cordova'].file.externalDataDirectory;
			}
			fs = cpf(fsOptions);
		}
		return fs;
	}

	function getFileOpener() {
		// @ts-ignore
		const { cordova: { plugins: { fileOpener2: opener } } } = window;
		return opener;
	}

	function getDateString() {
		const d = new Date();
		return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
	}

	export async function saveLog(logEntries: LogEvent[]) {
		const fs = getFileSystem();
		const csvData = csvParser.parse(logEntries, csvOptions);
		const fileName = `${getDateString()}-log.csv`;
		await fs.write(fileName, csvData);
		const url = await fs.toURL(fileName);
		return Notifications.showNotification('Log saved', `Saved to ${fileName}`, () => {
			return openFile(url);
		});
	}

	export async function openFile(filePath: string): Promise<any> {
		const opener = getFileOpener();
		if (!opener) {
			return;
		}

		try {
			return await new Promise((resolve, reject) => {
				opener.open(filePath, 'text/csv', {
					error: (e) => reject(e),
					success: resolve,
				});
			});
		} catch (err) {
			return new Promise((resolve, reject) => {
				opener.showOpenWithDialog(filePath, 'text/csv', {
					error: reject,
					success: resolve,
				});
			});
		}
	}

	export async function saveFirmwareFile(file: Blob): Promise<string> {
		const fs = getFileSystem();
		const fileName = `firmware-file-${Math.round(Math.random() * 100)}-${new Date().getTime()}`;
		await fs.write(fileName, file);
		return fs.toURL(fileName);
	}
}

export default FileUtil;
