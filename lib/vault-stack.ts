import * as cdk from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

import { S3Website } from './constructs/s3-website';

interface VaultStackProps extends cdk.StackProps {
  certificateId: string;
  hostedZoneDomain: string;
  hostedZoneId: string;
}

export class VaultStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VaultStackProps) {
    super(scope, id, props);

    const certificate = Certificate.fromCertificateArn(this, 'BFLCertificate', cdk.Arn.format({
      region: 'us-east-1',
      resource: 'certificate',
      resourceName: props.certificateId,
      service: 'acm',
    }, this));

    const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      zoneName: props.hostedZoneDomain,
      hostedZoneId: props.hostedZoneId,
    });

    new S3Website(this, 'Vault', {
      certificate,
      hostedZone,
      vaultSubDomainPrefix: 'vault',
    });
  }
}
