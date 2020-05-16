import env from '../.env.js';
import MermaidViewer from '../web-components/mermaid-viewer.js';

const escapeMermaidMeta = text => {
	return text.replace(/class/g, 'CLASS');
};

const fetchMergeRequests = () => {
	const url = new URL(`${env.baseUrl}/api/v4/projects/${env.projectId}/merge_requests`);
	url.searchParams.set('private_token', env.accessToken);
	url.searchParams.set('per_page', 100);
	url.searchParams.set('state', 'all');
	url.searchParams.set('order_by', 'updated_at');
	return fetch(url.toString()).then(res => res.json());
};

/**
 *
 * @param {Object[]} mergeRequests
 * @returns {Object.<string, Object[]>} key: ブランチ名, value: key のブランチに向いている MergeRequest の配列
 */
const transformToBranchMap = mergeRequests => {
	const branchMap = {};
	mergeRequests.forEach(mergeRequest => {
		const target = mergeRequest.target_branch;
		if (!branchMap[target]) branchMap[target] = [];
		branchMap[target].push(mergeRequest);
	});
	mergeRequests
	.filter(mergeRequest => mergeRequest.state === 'merged')
	.forEach(mergeRequest => {
		const target = mergeRequest.target_branch;
		// TODO: merge済みMRが多段になっているときに対応
		branchMap[target] = branchMap[target].concat(branchMap[mergeRequest.source_branch] || []);
	});
	return branchMap;
};

document.querySelector('#generate').addEventListener('click', () => {
	fetchMergeRequests()
	.then(transformToBranchMap)
	.then(branchMap => {
		const mermaidTextArray = [];
		mermaidTextArray.push('graph RL');
		mermaidTextArray.push(`${env.baseBranchName}`);

		const disp = targetBranch => {
			if (!branchMap[targetBranch]) return;
			branchMap[targetBranch].forEach(mergeRequest => {
				if (mergeRequest.state !== 'opened') return;
				const sourceBranch = mergeRequest.source_branch;
				mermaidTextArray.push(`${escapeMermaidMeta(sourceBranch)}("!${mergeRequest.iid}: ${mergeRequest.title.replace(/"/g, '#quot;')}<br>${sourceBranch}")`);
				mermaidTextArray.push(`click ${escapeMermaidMeta(sourceBranch)} "${mergeRequest.web_url}"`);
				mermaidTextArray.push(`${escapeMermaidMeta(sourceBranch)} --> ${escapeMermaidMeta(targetBranch)}`);
				disp(sourceBranch);
			});
		};
		disp(env.baseBranchName);

		return mermaidTextArray.join('\n');
	}).then(mermaidText => {
		saveResult(mermaidText);
		showGraph(mermaidText);
	});
});

const showGraph = mermaidText => {
	const container = document.querySelector('#result');
	container.textContent = '';
	const mermaidViewer = new MermaidViewer(mermaidText);
	container.append(mermaidViewer);
};

const storageKey = 'previous-result';
const saveResult = mermaidText => {
	chrome.storage.local.set({
		[storageKey]: mermaidText,
	});
};
const loadResult = () => {
	return new Promise(resolve => {
		chrome.storage.local.get(storageKey, items => {
			resolve(items[storageKey]);
		});
	});
};

loadResult().then(mermaidText => {
	if (mermaidText) showGraph(mermaidText);
});
