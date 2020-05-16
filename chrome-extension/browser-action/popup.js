import env from '../.env.js';
import MermaidViewer from '../web-components/mermaid-viewer.js';

const fetchMergeRequests = () => {
	const url = new URL(`${env.baseUrl}/api/v4/projects/${env.projectId}/merge_requests`);
	url.searchParams.set('private_token', env.accessToken);
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
	return branchMap;
};

document.querySelector('#generate').addEventListener('click', () => {
	fetchMergeRequests()
	.then(transformToBranchMap)
	.then(branchMap => {
		const mermaidTextArray = [];
		mermaidTextArray.push('graph BT');
		mermaidTextArray.push(`${env.baseBranchName}`);

		const disp = targetBranch => {
			if (!branchMap[targetBranch]) return;
			branchMap[targetBranch].forEach(mergeRequest => {
				const sourceBranch = mergeRequest.source_branch;
				mermaidTextArray.push(`${sourceBranch}("!${mergeRequest.iid}: ${mergeRequest.title.replace(/"/g, '#quot;')}")`);
				mermaidTextArray.push(`${sourceBranch} --> ${targetBranch}`);
				disp(sourceBranch);
			});
		};
		disp(env.baseBranchName);

		return mermaidTextArray.join('\n');
	}).then(mermaidText => {
		const mermaidViewer = new MermaidViewer(mermaidText);
		document.querySelector('#result').append(mermaidViewer);
	});
});
