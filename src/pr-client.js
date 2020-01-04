const core = require('@actions/core');
const github = require('@actions/github');

class PrClient {
    constructor(prNumber) {
        this._num = prNumber
        this._gh = new github.GitHub(core.getInput('repo-token'));
    }

    getNumber() {
        return this._num;
    }

    async isLocked() {
        return false;
    }

    async getLabels() {
        const res = await this._gh.issues.listLabelsOnIssue({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: this._num
        });

        if (!res || !res.data) {
            return void 0;
        }

        return res.data.map((label) => label.name);
    }

    async setLock(shouldLock) {
        // client.checks.create()
    }
}

module.exports = PrClient;
