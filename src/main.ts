import * as core from '@actions/core';
import { getImagesToPush } from './images';
import { run } from './utils';
import { loginToEcr } from 'gh-ecr-login';

const AWS_ACCESS_KEY_ID = core.getInput('access-key-id', { required: true });
const AWS_SECRET_ACCESS_KEY = core.getInput('secret-access-key', { required: true });
const image = core.getInput('image', { required: true });
const localImage = core.getInput('local-image') || image;
const awsRegion = core.getInput('region') || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const direction = core.getInput('direction') || 'push';
const isSemver = !!core.getInput('is-semver');

const { awsAccountId } = loginToEcr(awsRegion, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY);

let imageUrl;

const images = image.split(',').map((i: string) => i.trim());

if (direction === 'push') {
    const imagesToPush = image.split(',').map((i: string) => i.trim());
    for (const imageToPush of images) {
        const uri = `${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${imageToPush}`;
        console.log(`Pushing local image ${imageToPush} to ${uri}`);
        run(`docker tag ${imageToPush} ${uri}`);
        run(`docker push ${uri}`);
        imageUrl = uri;
    }
} else if (direction == 'pull') {
    for (const imageToPull of images) {
        const uri = `${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${imageToPull}`;
        console.log(`Pulling remote image ${uri} as ${imageToPull}`);
        run(`docker pull ${uri}`);
        run(`docker tag ${uri} ${imageToPull}`);
        imageUrl = uri;
    }
} else {
    throw new Error(`Unknown direction ${direction}`);
}

core.setOutput('imageUrl', imageUrl);
