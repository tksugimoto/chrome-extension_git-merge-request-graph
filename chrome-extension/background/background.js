{
	const CONTEXT_MENU_ID = 'Open with Tab';

	const createContextMenus = () => {
		chrome.contextMenus.create({
			title: 'Tabで開く',
			contexts: ['browser_action'],
			id: CONTEXT_MENU_ID,
		});
	};

	chrome.runtime.onInstalled.addListener(createContextMenus);
	chrome.runtime.onStartup.addListener(createContextMenus);

	chrome.contextMenus.onClicked.addListener(info => {
		if (info.menuItemId === CONTEXT_MENU_ID) {
			chrome.tabs.create({
				url: '/browser-action/popup.html',
			});
		}
	});
}
