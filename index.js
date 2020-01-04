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

    core.info(`Looking for label(s) "${config.labels.join('", and "')}" on PR #${pr.getNumber()}`);

    const prLabels = await pr.getLabels();
    if (!prLabels) {
        core.setFailed('Could not get PR labels, doing nothing.');
        return
    }

    if (shouldLock(config, prLabels)) {
        core.info('Locking PR.');

        if (await pr.lock()) {
            core.info('PR locked.');
        } else {
            core.setFailed('Failed to lock PR.');
        }
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
        values.pr = new PrClient(github.context.payload.pull_request);
    } else {
        core.error("Pull request not found in `github.context.payload`")
        console.error(github.context.payload);
    }

    return values;
}

function shouldLock(config, prLabels) {
    return config.labels.some((l) => {
        if (prLabels.includes(l)) {
            core.info(`Found marker label "${l}"`);
            return true;
        }

        return false;
    });
}

(async () => {
    try {
        await main();
    } catch(e) {
        core.error(e);
    }
})();
