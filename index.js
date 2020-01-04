const core = require('@actions/core');
const github = require('@actions/github');

function main() {
    const [label, prn] = init()

    if (!label) {
        core.info('No label configured. Nothing to do.');
        return
    }
    if (!prn) {
        core.setFailed('Could not get PR number.');
        return;
    }

    core.info(`Looking for label "${label}" on PR #${prn}`);
}

function init() {
    const label = core.getInput('label');
    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest) {
        core.info(github.context.payload);
        return [label, void 0];
    }

    core.info(github.context.payload);
    core.info('----------------');
    console.log(github.context.payload.pull_request);

    return [label, pullRequest.number];
}

try {
    main();
} catch(e) {
    core.error(e);
    core.setFailed(`Failure: {e.message}`);
}
