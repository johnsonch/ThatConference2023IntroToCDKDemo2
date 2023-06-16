import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";


// 👇 extend the props interface of Ec2Stack
interface SpeedTestProps  extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class SpeedTestStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: SpeedTestProps) {
    super(scope, id, props);

    const {vpc} = props;

    const cluster = new ecs.Cluster(this, "MyCluster", {
      vpc: vpc
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {
      cluster: cluster, // Required
      cpu: 256, // Default is 256
      desiredCount: 1, // Default is 1
      taskImageOptions: { image: ecs.ContainerImage.fromRegistry("linuxserver/librespeed") },
      memoryLimitMiB: 512, // Default is 512
      publicLoadBalancer: true // Default is true
    });

    //TODO add logging


  } // end of constructor
} // end of class
