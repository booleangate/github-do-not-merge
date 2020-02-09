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
    let willLock = false;

    if (!prLabels) {
        core.error('Could not get PR labels.  Will attempt to unlock.');
    } else {
        willLock = shouldLock(config, prLabels);
    }

    const existingLock = await pr.getLock();
    const isLocked = !!existingLock;

    if (isLocked === willLock) {
        core.info(`Markers haven't changed. Nothing to do.`);
        return;
    }

    const verb = willLock ? 'lock' : 'unlock';
    core.info(`Will ${verb} PR.`);

    if (await pr.setLock(willLock, existingLock)) {
        core.info(`Successfully ${verb} PR.`);
    } else {
        core.setFailed(`Failed to ${verb} PR.`);
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
    const markerRE = /^\/(.*)(?:\/([gimsuy]*)$)/i;

    return config.labels.some((marker) => {
        const hasMatch = prLabels.some((label) => {
            const match = markerRE.exec(marker);

            if (match) {
                const re = new RegExp(match[1], match[2]);

                return re.test(label);
            }

            return marker === label;
        })

        if (hasMatch) {
            core.info(`Found marker label "${marker}"`);
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
