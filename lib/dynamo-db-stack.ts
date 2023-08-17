import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Duration } from 'aws-cdk-lib/core';




export class DynamoDBStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const tableName = 'MyGlobalTable';
    const partitionKey = { name: 'ItemId', type: dynamodb.AttributeType.STRING };

    const table = new dynamodb.Table(this, 'MyGlobalTable', {
      tableName,
      partitionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // This is for demo purposes, use the appropriate policy for production
    });

    const globalTable = new dynamodb.Table(this, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      replicationRegions: ['us-east-2', 'us-west-1'],
      replicationTimeout: Duration.hours(3),
    });

    // Add provisioned throughput settings
    //globalTable.addProvisionedReadCapacity(10);
    //globalTable.addProvisionedWriteCapacity(10);

    // Enable automatic scaling
    //globalTable.enableAutoScaling({
      //readCapacityScaling: {
        //targetUtilization: 70,
        //scaleInCooldown: Duration.seconds(60),
        //scaleOutCooldown: Duration.seconds(60),
      //},
      //writeCapacityScaling: {
        //targetUtilization: 70,
        //scaleInCooldown: Duration.seconds(60),
        //scaleOutCooldown: Duration.seconds(60),
      //},
    //});

  } // end of constructor
} // end of class
