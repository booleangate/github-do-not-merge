// Useful docs
// - https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-a-javascript-action
// - https://github.com/actions/toolkit/tree/master/packages/core
// - https://github.com/actions/toolkit/tree/master/packages/github
// - https://github.com/wip/app/
// - https://github.com/actions/labeler/blob/master/src/main.ts

// TODO: support multiple labels and tag in PR title.
//  - Will need to use separate config file (similar to labeler) to achieve the desired config structure.

const core = require('@actions/core');
const github = require('@actions/github');
const PrClient = require('./src/pr-client');

async function main() {
    const {config, pr: pr} = init()

    if (!config.labels.length) {
        core.info('No label configured. Nothing to do.');
        return
    }
    if (!pr) {
        core.setFailed('Could not get PR info.');
        return;
    }

    core.info(`Looking for label "${config.labels.join('", and "')}" on PR #${pr.getNumber()}`);

    const prLabels = await pr.getLabels();
    const isLocked = await pr.isLocked();
    let willLock = false;

    if (!prLabels) {
        core.setFailed('Could not get labels, removing lock.');
    } else {
        willLock = shouldLock(config, prLabels);
    }

    console.log("labels!");
    console.info(prLabels);

    if (isLocked === willLock) {
        core.info(`PR is already ${isLocked ? "locked" : "unlocked"}, doing nothing.`);
    } else {
        core.info(`${willLock ? "Locking" : "Unlocking"} PR.`);
        await pr.setLock(willLock)
    }
}

function init() {
    const values = {
        config: {
            labels: core.getInput('label') ? [core.getInput('label')] : [],
        },
        pr: void 0
    }

    if (github.context.payload.pull_request && github.context.payload.pull_request.number) {
        values.pr = new PrClient(github.context.payload.pull_request && github.context.payload.pull_request.number);
    } else {
        core.error("Pull request not found in `github.context.payload`")
        console.error(github.context.payload);
    }

    return values;
}

function shouldLock(config, prLabels) {
    return config.labels.some((l) => prLabels.includes(l));
}

(async () => {
    try {
        await main();
    } catch(e) {
        core.error(e);
    }
})();
