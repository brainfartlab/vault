#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VaultStack } from '../lib/vault-stack';

const app = new cdk.App();
const env = app.node.tryGetContext("env");
const config = app.node.tryGetContext(env);

const hostedZoneDomain = `${env}.brainfartlab.com`;

new VaultStack(app, 'VaultStack', {
  env: {
    account: config.account,
    region: config.region,
  },
  certificateId: config.certificateId,
  hostedZoneDomain,
  hostedZoneId: config.hostedZoneId,
});
