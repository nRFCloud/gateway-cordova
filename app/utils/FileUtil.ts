import { LogEvent } from '../providers/StateStore';
import { Logger } from '../logger/Logger';
import Client from './Client';

namespace FileUtil {
	export async function saveLog(logEntries: LogEvent[]) {
		Logger.info('going to save log entries', logEntries);
		const fs = Client.getFilesystem();
		const result = await fs.writeFile('testlog.log', logEntries.map((entry) => JSON.stringify(entry)).join('\n'));
		Logger.info('result of saving', result);
	}
}

export default FileUtil;
