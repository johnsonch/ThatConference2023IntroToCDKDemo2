import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib/core';


interface DynamoDBProps  extends cdk.StackProps {
  replicationRegions?: string[];
}

export class DynamoDBStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: DynamoDBProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const tableName = 'MyGlobalTable';
    const partitionKey = { name: 'ItemId', type: dynamodb.AttributeType.STRING };

    const globalTable = new dynamodb.Table(this, 'Table', {
      tableName,
      partitionKey,
      replicationRegions: props.replicationRegions,
      replicationTimeout: Duration.hours(3),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // This is for demo purposes, use the appropriate policy for production
    });

  }
}
