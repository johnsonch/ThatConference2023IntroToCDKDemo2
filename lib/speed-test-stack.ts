import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'

interface SpeedTestProps extends cdk.StackProps {
  vpc: ec2.Vpc,
  elbLogBucket: s3.Bucket
}

export class SpeedTestStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: SpeedTestProps) {
    super(scope, id, props);

    const { vpc } = props;

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      cpu: 256, // Default is 256
      desiredCount: 1, // Default is 1
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry("linuxserver/librespeed") },
      memoryLimitMiB: 512, // Default is 512
      publicLoadBalancer: true, // Default is true
    });

    service.loadBalancer.logAccessLogs(props.elbLogBucket, 'elb-access-logs')


    // Create a Lambda function to handle ECS task stop events
    const stopTaskLambda = new lambda.Function(this, 'StopTaskLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('ECS Task stopped:', JSON.stringify(event, null, 2));
          var AWS = require('aws-sdk');
          // Log the event to S3 bucket
          // You can customize this part based on your specific requirements
          // In this example, the task stop event is logged to a file in the S3 bucket
          const s3 = new AWS.S3();
          await s3.putObject({
            Bucket: '${props.elbLogBucket.bucketName}',
            Key: 'ecs-task-stop-events.log',
            Body: JSON.stringify(event, null, 2),
          }).promise();

          return {
            statusCode: 200,
            body: 'Task stop event processed successfully',
          };
        };
      `),
    });

    // Grant necessary permissions for the Lambda function to write to the S3 bucket
    props.elbLogBucket.grantWrite(stopTaskLambda);

    // Create a CloudWatch Events rule to capture ECS task stop events
    const eventRule = new events.Rule(this, 'EcsTaskStopEventRule', {
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change'],
        detail: {
          lastStatus: ['STOPPED'],
        },
      },
    });

    // Connect the Lambda function as a target for the CloudWatch Events rule
    eventRule.addTarget(new targets.LambdaFunction(stopTaskLambda));
  }
}
