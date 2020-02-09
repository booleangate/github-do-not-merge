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

    _context(obj) {
        return Object.assign({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        }, obj)
    }
}

module.exports = PrClient;
