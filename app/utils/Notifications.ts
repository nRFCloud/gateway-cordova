namespace Notifications {

	const notificationHolder = {};
	let counter = 0;
	let isSetup = false;

	function getNotificationService() {
		// @ts-ignore
		const {cordova: {plugins: {notification: {local: pgnote}}}} = window;
		return pgnote;
	}

	function createNotification(title: string, text: string) {
		const note = getNotificationService();
		if (!note) {
			return;
		}

		return {
			id: counter++,
			title,
			text,
		};
	}

	export async function showNotification(title: string, text: string, callback?: (event) => void) {
		const notification = createNotification(title, text);
		if (!notification) {
			return;
		}

		const note = getNotificationService();
		if (!note) {
			return;
		}

		if (!isSetup) {
			await setup();
		}

		notificationHolder[notification.id] = callback || (() => undefined);

		note.schedule(notification);
	}

	export async function setup() {
		const note = getNotificationService();
		if (!note) {
			throw new Error('Notification service not available');
		}

		if (!(await new Promise((resolve) => note.hasPermission(resolve)))) {
			await new Promise((resolve) => note.requestPermission(resolve));
		}

		note.setDefaults({
			foreground: true,
			smallIcon: 'res://nrfcloud',
		});

		note.on('click', (notification, event) => {
			const id = notification.id;
			if (typeof notificationHolder[id] === 'function') {
				notificationHolder[id](event);
			}
		});
		isSetup = true;
	}
}

export default Notifications;
