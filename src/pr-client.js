const core = require('@actions/core');
const github = require('@actions/github');

const checkName = 'DO NOT MERGE';
const checkTitle = 'Merge Blocked';
const checkSummary = 'This PR is marked as *Do Not Merge*.';

class PrClient {
    constructor(pr) {
        this._pr = pr;
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
            core.error('listLabelsOnIssue response', res);
            return void 0;
        }

        return res.data.map((label) => label.name);
    }

    async getLock() {
        const res = await this._gh.checks.listForRef(this._context({
            ref: this._pr.head.ref
        }));

        if (!res || !res.data) {
            core.error('listForRef response', res);
            return void 0;
        }

        return res.data.check_runs.find(
            (check) => check.name === checkName
                && check.output.title === checkTitle
                && check.output.summary === checkSummary
        );
    }

    async setLock(lock, previousLock) {
        const check = {
            name: checkName,
            // head_branch: '', // workaround for https://github.com/octokit/rest.js/issues/874
            head_sha: this._pr.head.sha,
            completed_at: new Date().toISOString(),
            conclusion: 'failure',
            output: {
                title: checkTitle,
                summary: checkSummary,
            },
            // https://github.community/t5/GitHub-API-Development-and/Random-401-errors-after-using-freshly-generated-installation/m-p/22905/highlight/true#M1596
            request: {
                retries: 3,
                retryAfter: 3
            }
        };

        let res;

        if (lock) {
            res = await this._gh.checks.create(this._context(check));
        } else {
            check.check_run_id = previousLock.id;
            check.conclusion = 'success'
            check.completed_at = new Date().toISOString()
            check.Name = 'can merge'
            check.output.title = 'Merge Unblocked'
            check.output.summary = '*Do Not Merge* markers removed.';

            res = await this._gh.checks.update(this._context(check));
        }

        if (!res || !res.data) {
            core.error(`checks.${lock ? 'create' : 'update'} response`, res);
            return void 0;
        }

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
