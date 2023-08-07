import { Arn, ArnFormat, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Distribution, ResponseHeadersPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { AnyPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface S3WebsiteProps {
  certificate: ICertificate;
  hostedZone: IHostedZone;
  vaultSubDomainPrefix: string;
}

export class S3Website extends Construct {
  constructor(scope: Construct, id: string, props: S3WebsiteProps) {
    super(scope, id);

    const vaultSubDomain = `${props.vaultSubDomainPrefix}.${props.hostedZone.zoneName}`;

    const logBucket = new Bucket(this, 'LogBucket', {
      bucketName: `logs.${props.hostedZone.zoneName}`,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const hostBucket = new Bucket(this, 'HostBucket', {
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      bucketName: vaultSubDomain,
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      serverAccessLogsBucket: logBucket,
      websiteErrorDocument: '404.html',
      websiteIndexDocument: 'index.html',
    });

    const origin = new S3Origin(hostBucket);

    const distribution = new Distribution(this, 'WebsiteDistribution', {
      certificate: props.certificate,
      defaultBehavior: {
        origin,
      },
      domainNames: [
        vaultSubDomain,
      ],
    });

    distribution.addBehavior('*.wasm', origin, {
      responseHeadersPolicy: new ResponseHeadersPolicy(this, 'ContentTypePolicy', {
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Content-Type',
              value: 'application/wasm',
              override: true,
            },
          ],
        },
      }),
    });

    new ARecord(this, 'HostBucketAlias', {
      recordName: vaultSubDomain,
      zone: props.hostedZone,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
