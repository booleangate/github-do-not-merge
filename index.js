const core = require('@actions/core');
const github = require('@actions/github');

try {
    const label = core.getInput('label')

    console.log(label);
    core.info(label);
} catch(e) {
    console.error(e);
    core.error(e);
}
