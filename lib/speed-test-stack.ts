import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as s3 from "aws-cdk-lib/aws-s3";
interface SpeedTestProps  extends cdk.StackProps {
<<<<<<< HEAD
  vpc: ec2.Vpc;
  elbLogBucket: s3.Bucket;
=======
  vpc: ec2.Vpc,
  elbLogBucket: s3.Bucket
>>>>>>> 2ae8676 (working logging)
}

export class SpeedTestStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: SpeedTestProps) {
    super(scope, id, props);

    const {vpc} = props;

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

<<<<<<< HEAD
    service.loadBalancer.logAccessLogs(props.elbLogBucket, 'elb-access-logs')
  }
}
=======
    //TODO add logging
    service.loadBalancer.logAccessLogs(props.elbLogBucket, 'my-prefix');

  } // end of constructor
} // end of class
>>>>>>> 2ae8676 (working logging)
