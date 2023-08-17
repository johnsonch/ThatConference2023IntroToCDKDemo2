#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VPCStack } from '../lib/vpc-stack';
import { BucketsStack } from '../lib/buckets-stack';
import { SpeedTestStack } from '../lib/speed-test-stack';
import { DynamoDBStack } from '../lib/dynamo-db-stack';


const app = new cdk.App();

const regions = ['us-east-1', 'us-west-2'];

for (var region of regions) {
  const vpcStack = new VPCStack(app, `vpc-stack-${region}`, {
    stackName: `vpc-stack-${region}`,
    env: { region: region }
  })

  const bucketsStack = new BucketsStack(app, `buckets-stack-${region}`, {
    stackName: `buckets-stack-${region}`,
    region: region,
    env: { region: region }
  })

  const speedTestStack = new SpeedTestStack(app, `speed-test-stack-${region}`, {
    vpc: vpcStack.vpc,
    stackName: `speed-test-stack-${region}`,
    elbLogBucket: bucketsStack.elbLogBucket,
    env: { region: region }
  })

}

// DynamoDB doesn't need to be created in every region
const dynamodbStack = new DynamoDBStack(app, `dynamo-db-stack`, {
  stackName: 'dynamo-db-stack',
  replicationRegions: ['us-west-2'],
  env: { region: 'us-east-1' }
})
