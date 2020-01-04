const core = require('@actions/core');
const github = require('@actions/github');

class PrClient {
    constructor(pr) {
        this._pr.number = pr;
        this._gh = new github.GitHub(core.getInput('repo-token'));
    }

    getNumber() {
        return this._pr.number;
    }

    async getLabels() {
        const res = await this._gh.issues.listLabelsOnIssue(this._context({
            issue_number: this._pr.number
        }));

        if (!res || !res.data) {
            return void 0;
        }

        return res.data.map((label) => label.name);
    }

    async getLock() {
        const res = await this._gh.checks.listForRef({

        })
    }

    async lock() {
        console.log("this._pr.head.sha", this._pr.head.sha)
        const check = {
            name: "DO-NOT-MERGE",
            // head_branch: '', // workaround for https://github.com/octokit/rest.js/issues/874
            head_sha: this._pr.head.sha,
            completed_at: new Date().toISOString(),
            conclusion: 'failure',
            output: {
                title: 'Merge Blocked',
                summary: 'This PR is marked as *Do Not Merge*.',
            },
            // https://github.community/t5/GitHub-API-Development-and/Random-401-errors-after-using-freshly-generated-installation/m-p/22905/highlight/true#M1596
            request: {
                retries: 3,
                retryAfter: 3
            }
        };

        // if (!shouldLock) {
        //     check.check_run_id = previousLock.check_run_id;
        //     check.conclusion = 'success'
        //     check.completed_at = new Date().toISOString()
        //     check.output.title = 'Merge Unblocked'
        //     check.output.summary = 'No *Do Not Merge* markers found.';
        // }

        const res = await client.checks.create(this._context(check));

        return res && (res.status / 100) >>> 0 === 2;
    }

    _context(obj) {
        return Object.assign({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        }, obj)
    }
}

module.exports = PrClient;
