export default class extends EventTarget {
	/**
	 * @param {string} storageKey
	 */
	constructor(storageKey) {
		super();
		this._storageKey = storageKey;
	}

	save(value) {
		chrome.storage.local.set({
			[this._storageKey]: value,
		}, () => {
			const event = new CustomEvent('update');
			event.value = value;
			this.dispatchEvent(event);
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
