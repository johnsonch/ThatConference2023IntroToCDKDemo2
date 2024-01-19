import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaRuby from 'cdk-lambda-ruby';
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
      desiredCount: 3, // Default is 1
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry("linuxserver/librespeed") },
      memoryLimitMiB: 512, // Default is 512
      publicLoadBalancer: true, // Default is true
    });

    service.loadBalancer.logAccessLogs(props.elbLogBucket, 'elb-access-logs')


    // Create a Lambda function to handle ECS task stop events
    const stopTaskLambda = new lambdaRuby.RubyFunction(this, 'MyFunction', {
      runtime: lambda.Runtime.RUBY_2_7,
      sourceDirectory: path.join(__dirname, 'lambda/oom-monitor'),
      handler: 'index.handler',
      environment: {
        BUCKET_NAME: props.elbLogBucket.bucketName,
        DD_API_KEY: 'd9ffd6e03d5a5d8a53de5cf3aaeceb41'
      },
      timeout: Duration.seconds(10),
      bundlerConfig: {  // optional
        without: 'development:test',  // optional, default: 'development:test'
      },
    });

    // Grant necessary permissions for the Lambda function to write to the S3 bucket
    props.elbLogBucket.grantReadWrite(stopTaskLambda);

    // Create a CloudWatch Events rule to capture ECS task stop events
    const eventRule = new events.Rule(this, 'EcsTaskStopEventRule', {
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change', 'ECS Container Instance State Change'],
        detail: {
          lastStatus: ['STOPPED'],
        },
      },
    });

    // Connect the Lambda function as a target for the CloudWatch Events rule
    eventRule.addTarget(new targets.LambdaFunction(stopTaskLambda));
  }
}
