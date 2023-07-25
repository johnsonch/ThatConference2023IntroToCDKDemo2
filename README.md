# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
*
## Install CDK and Typescript
This repository assumes you already have Node/NPM installed

`npm install -g aws-cdk`
`npm install -g typescript`

---
## Setup
Setup the first project first create a directory and `cd` into it. I used `demo2`

```
cdk init app --language typescript
```
The `cdk init` takes a template and then a `--language` flag. We're using the `app` template and working in Typescript today

Then go and setup your AWS account with the information from your desired user.

`aws configure`

---

We can see the results in the AWS console

## Our Project
We're gonna build a stack to host a speed test.

We'll create the following:
* VPC, with subnets
* Application Load Balancer (ELB)
* ECS Fargate Cluster
* ECS Fargate Task (To run https://hub.docker.com/r/adolfintel/speedtest)
* S3 Bucket for Logging

## Add some code
### Cleaning Up
First we need to clean up some of the generated project.

Open up `bin/demo2.ts` and remove the default stack from `bin/demo2.ts`, start with the import

```
import { Demo2Stack } from '../lib/demo2-stack';
```

and then move do the decleration

```
new Demo2Stack(app, 'Demo2Stack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
```

Finally remove the `lib/demo2-stack.ts` file as well.

### Adding a VPC

First we'll start by adding a file to hold the VPC stack code. Make a file in `lib/vpc-stack.ts` and add the following boilerplate code:

```
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export class VPCStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  }
}
```

This is the bare minimum code we need to create a stack, well kinda! If we run our `cdk bootstrap` now we'll get an error : `This app contains no stacks`

Let's fix that and make it be able to bootstrap and deploy an empty stack

In our `bin/demo2.ts` file we'll import the `lib/vpc-stack.ts` we just created and then define a new stack for it.

```
import { VPCStack } from '../lib/vpc-stack';
```

Then below our `app` `const` add:

```
const vpcStack = new VPCStack(app, 'vpc-stack', {
  stackName: 'vpc-stack'
})
```

Now we can `cdk bootstrap` and then `cdk deploy --all`. Note that we are deploying "all" of our stacks but we can do a `cdk list` and see our `vpc-stack`, going forward if we want we can target only one stack to deploy to!

Now let's add our basic VPC components: subnets, NAT Gateways, CIDR, etc.

```
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2'

export class VPCStack extends cdk.Stack {

  // Add a property for the VPC that will be returned to the caller
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Build our VPC here
    this.vpc = new ec2.Vpc(
      this,
      'Vpc',
      {
        vpcName: 'Demo',
        ipAddresses: ec2.IpAddresses.cidr('192.168.0.0/16'),
        natGateways: 1,
        maxAzs: 2,
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24
          },
          {
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24
          }
        ]
      }
    );

  }
}
```

Let's see if things are working by running a `ckd diff --all` and viewing what the difference is from our empty deploy.

Look's good ship it: `cdk deploy --all`


### Adding our S3 logging bucket

For our S3 resoruces lets create `lib/buckets-stack.ts` and add the following boilerplate to it:

```
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class BucketsStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

  }
}
```

Then create the stack call function in `bin/demo2.ts` and add the import statement.

```
const bucketsStack = new BucketsStack(app, 'buckets-stack', {
  stackName: 'buckets-stack'
})
```

```
import { BucketsStack } from '../lib/buckets-stack';
```

Let's see if things are working by running a `ckd diff --all` and viewing what the difference is from our empty deploy.

Look's good ship it: `cdk deploy --all`

Now we can add our S3 goodness in and get our bucket created.

First we'll add the `readonly elbLogBucket: s3.Bucket;` property so we can bubble up the bucket for use later.

Then add our bucket construct:

```
    this.elbLogBucket = new s3.Bucket(this, 'tccc23-log-bucket', {
      bucketName: 'tccc23-log-bucket',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    });
```

Next we'll add a Glacier lifecycle rule that will move files after 30 days to Glacier

```
    // Move Files to Glacier after 30 Days
    this.elbLogBucket.addLifecycleRule({
      id: 'ELBLoggingBucketGlacierMigration',
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });
```
Let's see if things are working by running a `ckd diff --all` and viewing what the difference is from our empty deploy.

Look's good ship it: `cdk deploy --all`

### Adding our applicaiton stack


For our ECS resoruces lets create `lib/speed-test-stack.ts` and add the following boilerplate to it:

```
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface SpeedTestProps  extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class SpeedTestStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: SpeedTestProps) {
    super(scope, id, props);

  }
}
```

Then in our `bin/demo2.ts` we can import our speed test stack and add the function call to create a new stack.

```
import { SpeedTestStack } from '../lib/speed-test-stack';
```

```
const speedTestStack = new SpeedTestStack(app, 'speed-test-stack', {
  vpc: vpcStack.vpc,
  stackName: 'speed-test-stack'
})
```

Next we can add our ECS cluster construct and supporting code:

```
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
```

Then above import the other libraries we are going to need

```
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
```


Now we can view our app, the output is in the CDK run


#### Add our access logging

We'll need to pass the bucket into this stack

In `bin/demo2.ts` we're going to add `elbLogBucket: bucketsStack.elbLogBucket` to our call to the speed test stack.

Then in our speed test stack we're going to add `elbLogBucket: s3.Bucket;` to the interface. In order for that not to error we'll also need to import the S3 lib `import * as s3 from 'aws-cdk-lib/aws-s3';`

Below our deffintion of the `ApplicationLoadBalancedFargateService` we can use a construct to add access logging. However we're going to need to modify our service deffintion so we can act on the object.

We'll change the line `new ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {` to `const service = new  ecs_patterns.ApplicationLoadBalancedFargateService(this, "MyFargateService", {` and then add below the construct the access logging code:

```
    service.loadBalancer.logAccessLogs(props.elbLogBucket, 'elb-access-logs')
```

Let's see if things are working by running a `ckd diff --all`

Oh we get an error `Error: Region is required to enable ELBv2 access logging` let's fix that!

We'll specify the region in each stack `env: { region: 'us-east-1' }`

Let's see if things are working by running a `ckd diff --all`

It's all good, let's deploy! `cdk deploy --all`
