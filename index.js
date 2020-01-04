const core = require('@actions/core');
const github = require('@actions/github');

try {
    const labels = core.getInput('labels')
    console.log(labels);
    core.log(labels);
} catch(e) {
    console.error(e);
    core.error(e);
}
