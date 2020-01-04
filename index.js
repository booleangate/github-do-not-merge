const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
    const {config, client} = init()

    if (!config.labels.length) {
        core.info('No label configured. Nothing to do.');
        return
    }
    if (!client) {
        core.setFailed('Could not get PR info.');
        return;
    }

    core.info(`Looking for label "${config.labels.join('", and "')}" on PR #${client.getPrNumber()}`);

    const labels = await client.getLabels();
    console.log("labels!");
    console.info(labels);

    // client.checks.create()
}

function init() {
    const values = {
        config: {
            labels: core.getInput('label') ? [core.getInput('label')] : [],
        },
        client: void 0
    }

    if (github.context.payload.pull_request && github.context.payload.pull_request.number) {
        values.client = new Client(github.context.payload.pull_request && github.context.payload.pull_request.number);
    } else {
        core.error("Pull request not found in `github.context.payload`")
        console.error(github.context.payload);
    }

    return values
}

class Client {
    constructor(prNumber) {
        this._prn = prNumber
        this._gh = new github.GitHub(core.getInput('repo-token'));
    }

    getLabels() {
        return this._gh.pulls.listLabelsOnIssue({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: this._prn
        });
    }

    getPrNumber() {
        return this._prn;
    }
}

(async () => {
    try {
        await main();
    } catch(e) {
        core.error(e);
    }
})();
