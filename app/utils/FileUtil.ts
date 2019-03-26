import * as csvParser from 'json2csv';

import { LogEvent } from '../providers/StateStore';
import { Logger } from '../logger/Logger';
import Client from './Client';
import Notifications from './Notifications';

const csvOptions = {
	fields: ['event', {
		label: 'timestamp',
		value: (row) => new Date(row.timestamp).toISOString(),
	}],
};

namespace FileUtil {
	function getFileOpener() {
		// @ts-ignore
		const {cordova: {plugins: {fileOpener2: opener}}} = window;
		return opener;
	}

	function getDateString() {
		const d = new Date();
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
	}

	export async function saveLog(logEntries: LogEvent[]) {
		const fs = Client.getFilesystem();
		const csvData = csvParser.parse(logEntries, csvOptions);
		const fileName = `${getDateString()}-log.log`;
		const result = await fs.writeFile(fileName, csvData);
		return Notifications.showNotification('Log saved', `Saved to ${fileName}`, () => {
			const filePath = (result as any).target.localURL;
			return openFile(filePath);
		});
	}

	export async function openFile(filePath: string): Promise<any> {
		const opener = getFileOpener();
		if (!opener) {
			return;
		}

		return new Promise((resolve, reject) => {
			opener.open(filePath, 'text/csv', {
				error: (e) => reject(e),
				success: resolve,
			});
		});
	}
}

export default FileUtil;
