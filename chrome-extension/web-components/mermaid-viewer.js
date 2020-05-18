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
		this.querySelectorAll('a').forEach(a => {
			a.setAttribute('target', '_blank');
		});
	}

}

window.customElements.define('mermaid-viewer', MermaidViewer);
