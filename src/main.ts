import * as core from '@actions/core';
import { getImagesToPush } from './images';
import { run } from './utils';
import { loginToEcr } from 'gh-ecr-login';

const SOURCE_AWS_ACCESS_KEY_ID = core.getInput('source-access-key-id', { required: true });
const SOURCE_AWS_SECRET_ACCESS_KEY = core.getInput('source-secret-access-key', { required: true });

const DEST_AWS_ACCESS_KEY_ID = core.getInput('dest-access-key-id', { required: true });
const DEST_AWS_SECRET_ACCESS_KEY = core.getInput('dest-secret-access-key', { required: true });

const awsRegion = core.getInput('region') || process.env.AWS_DEFAULT_REGION || 'us-east-1';

const images = core.getInput('images', { required: true });

const sourceLoginResult = loginToEcr(awsRegion, SOURCE_AWS_ACCESS_KEY_ID, SOURCE_AWS_SECRET_ACCESS_KEY);
const destLoginResult = loginToEcr(awsRegion, DEST_AWS_ACCESS_KEY_ID, DEST_AWS_SECRET_ACCESS_KEY);

const sourceAwsAccountId = sourceLoginResult.awsAccountId;
const destAwsAccountId = destLoginResult.awsAccountId;

const imageList = images.split(',').map((i: string) => i.trim());

for (const image of imageList) {
  const sourceUri = `${sourceAwsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}`;
  console.log(`Pulling remote image ${sourceUri} as ${image}`);
  run(`docker pull ${sourceUri}`);
  run(`docker tag ${sourceUri} ${image}`);

  const destUri = `${destAwsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/${image}`;
  console.log(`Pushing local image ${image} to ${destUri}`);
  run(`docker tag ${image} ${destUri}`);
  run(`docker push ${destUri}`);
  run(`docker rmi ${image}`);
}

