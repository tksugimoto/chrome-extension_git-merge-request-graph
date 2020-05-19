import env from '../.env.js';
import Storage from '../Storage.js';
import MermaidViewer from '../web-components/mermaid-viewer.js';

const escapeMermaidMeta = text => {
	return text.replace(/class/g, 'CLASS');
};

/**
 * @returns {Promise<Object[]>} Promise.resolve(mergeRequests)
 */
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

/**
 *
 * @param {string} baseBranchName
 * @param {Object.<string, Object[]>} branchMap key: ブランチ名, value: key のブランチに向いている MergeRequest の配列
 * @returns {string} mermaidText
 */
const transformToMermaidText = (baseBranchName, branchMap) => {
	const mermaidTextArray = [];
	mermaidTextArray.push('graph RL');
	mermaidTextArray.push(`${baseBranchName}`);

	const generateRelationGraphText = targetBranch => {
		if (!branchMap[targetBranch]) return;
		branchMap[targetBranch].forEach(mergeRequest => {
			if (mergeRequest.state !== 'opened') return;
			const sourceBranch = mergeRequest.source_branch;
			mermaidTextArray.push(`${escapeMermaidMeta(sourceBranch)}("!${mergeRequest.iid}: ${mergeRequest.title.replace(/"/g, '#quot;')}<br>${sourceBranch}")`);
			mermaidTextArray.push(`click ${escapeMermaidMeta(sourceBranch)} "${mergeRequest.web_url}"`);
			mermaidTextArray.push(`${escapeMermaidMeta(sourceBranch)} --> ${escapeMermaidMeta(targetBranch)}`);
			generateRelationGraphText(sourceBranch);
		});
	};
	generateRelationGraphText(baseBranchName);

	return mermaidTextArray.join('\n');
};

/**
 *
 * @param {Object.<string, Object[]>} branchMap key: ブランチ名, value: key のブランチに向いている MergeRequest の配列
 * @param {string} currentBaseBranchName
 */
const updateBranchList = (branchMap, currentBaseBranchName) => {
	const container = document.getElementById('base-branch-selector');
	container.querySelectorAll('select').forEach(elem => elem.remove());

	const select = document.createElement('select');

	Object.entries(branchMap).map(([branchName, mergeRequests]) => {
		return {
			branchName,
			openedMergeRequestcount: mergeRequests.filter(mergeRequest => mergeRequest.state === 'opened').length,
		};
	})
	.sort((a, b) => b.openedMergeRequestcount - a.openedMergeRequestcount)
	.forEach(({ branchName, openedMergeRequestcount }) => {
		const option = document.createElement('option');
		option.value = branchName;
		option.textContent = `${branchName} (${openedMergeRequestcount})`;
		if (currentBaseBranchName === branchName) option.selected = true;
		select.append(option);
	});
	select.addEventListener('change', event => {
		const selectedBranchName = event.target.value;
		baseBranchStorage.save(selectedBranchName);
		const mermaidText = transformToMermaidText(selectedBranchName, branchMap);
		showGraph(mermaidText);
	});

	container.querySelector('label').append(select);
	container.style.display = '';
	select.focus();
};

/**
 *
 * @param {string} mermaidText
 */
const showGraph = mermaidText => {
	const container = document.querySelector('#result');
	container.textContent = '';
	const mermaidViewer = new MermaidViewer(mermaidText);
	container.append(mermaidViewer);
};

const baseBranchStorage = new Storage('base-branch');
const branchMapStorage = new Storage('previous-branch-map');

baseBranchStorage.load().then(baseBranchName => {
	if (!baseBranchName) baseBranchName = 'master';

	baseBranchStorage.addEventListener('update', event => {
		baseBranchName = event.value;
	});

	branchMapStorage.load().then(branchMap => {
		if (branchMap) {
			updateBranchList(branchMap, baseBranchName);
			const mermaidText = transformToMermaidText(baseBranchName, branchMap);
			showGraph(mermaidText);
		}
	});

	document.querySelector('#update').addEventListener('click', () => {
		fetchMergeRequests()
		.then(transformToBranchMap)
		.then(branchMap => {
			branchMapStorage.save(branchMap);
			updateBranchList(branchMap, baseBranchName);
			return transformToMermaidText(baseBranchName, branchMap);
		})
		.then(mermaidText => {
			showGraph(mermaidText);
		});
	});
});
