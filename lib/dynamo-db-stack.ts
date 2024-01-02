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
    const tableName = 'dynamoid_secureframe_development_authentications';

    let regionToReplicateTo = []
    for ( var region of props.replicationRegions! ){
      regionToReplicateTo.push( { region: region } )
    }

    new dynamodb.CfnGlobalTable(this, tableName, {
      attributeDefinitions: [{
        attributeName: 'id',
        attributeType: 'S',
      }],
      keySchema: [{
        attributeName: 'id',
        keyType: 'HASH',
      }],
      replicas: regionToReplicateTo,
      billingMode: 'PAY_PER_REQUEST',
      tableName: tableName,
      streamSpecification: {
        streamViewType: 'NEW_IMAGE',
      },
    });

  }
}
