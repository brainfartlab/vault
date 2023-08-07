import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { VaultStack } from '../vault-stack';

interface PipelineStageProps extends StageProps {
  environment: 'tst' | 'dev' | 'prd';
}

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props);

    const config = this.node.tryGetContext(props.environment);

    new VaultStack(this, 'VaultStack', {
      certificateId: config.certificateId,
      hostedZoneDomain: `${props.environment}.brainfartlab.com`,
      hostedZoneId: config.hostedZoneId,
    });
  }
}
