/* global mermaid */

mermaid.initialize({
	startOnLoad: false,
});

export default class MermaidViewer extends HTMLElement {
	/**
	 *
	 * @param {string} mermaidCode
	 */
	constructor(mermaidCode) {
		super();
		this.textContent = mermaidCode;
	}

	connectedCallback() {
		mermaid.init(this);
	}

}

window.customElements.define('mermaid-viewer', MermaidViewer);
