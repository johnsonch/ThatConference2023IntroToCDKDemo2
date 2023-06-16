#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from '../lib/vpc-stack';
import { BucketsStack } from '../lib/buckets-stack';
import { SpeedTestStack } from '../lib/speed-test-stack';

const app = new cdk.App();

const vpcStack = new VPCStack(app, 'vpc-stack', {
  stackName: 'vpc-stack'
})

const bucketsStack = new BucketsStack(app, 'buckets-stack', {
  stackName: 'buckets-stack'
})

const speedTestStack = new SpeedTestStack(app, 'speed-test-stack', {
  vpc: vpcStack.vpc,
  stackName: 'speed-test-stack'
})
