import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from "aws-cdk-lib/aws-s3";



export class BucketsStack extends cdk.Stack {
  readonly elbLogBucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const elbLogBucket = new s3.Bucket(this, 'that-conf-cdk-demo-23-log-bucket', {
      bucketName: 'tccc23-log-bucket',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    });
    // Move Files to Glacier after 30 Days
    elbLogBucket.addLifecycleRule({
      id: 'ELBLoggingBucketGlacierMigration',
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(30),
        },
      ],
    });
    // This is needed so we can import the bucket into other stacks
    this.elbLogBucket = elbLogBucket;


  } // end of constructor
} // end of class
