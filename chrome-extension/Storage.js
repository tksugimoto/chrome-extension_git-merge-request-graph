export default class {
	/**
	 * @param {string} storageKey
	 */
	constructor(storageKey) {
		this._storageKey = storageKey;
	}

	save(value) {
		chrome.storage.local.set({
			[this._storageKey]: value,
		});
	}

	load() {
		return new Promise(resolve => {
			chrome.storage.local.get(this._storageKey, items => {
				resolve(items[this._storageKey]);
			});
		});
	}
}
