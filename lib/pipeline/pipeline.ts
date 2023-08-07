import { Arn, ArnFormat, Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { PipelineStage } from './stage';

interface PipelineStackProps extends StackProps {
  account: string,
  branch: 'dev' | 'main';
  connectionId: string;
  environment: 'dev' | 'prd';
  repoName: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const connectionArn = Arn.format({
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      resource: 'connection',
      resourceName: props.connectionId,
      service: 'codestar-connections',
    }, this);

    const pipeline = new CodePipeline(this, 'VaultPipeline', {
      crossAccountKeys: true,
      dockerEnabledForSynth: true,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection(props.repoName, props.branch, {
          connectionArn,
        }),
        commands: [
          'npm ci',
          'npm run build',
          `npx cdk synth --app \'npx ts-node --prefer-ts-exts bin/pipeline-${props.environment}.ts\'`,
        ],
      }),
    });

    pipeline.addStage(new PipelineStage(this, props.environment, {
      env: {
        account: props.account,
        region: 'eu-west-1',
      },
      environment: props.environment,
    }));

    pipeline.buildPipeline();
    pipeline.pipeline.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [connectionArn],
      actions: ['codestar-connections:UseConnection'],
      conditions: {
        'ForAllValues:StringEquals': {
          'codestar-connections:FullRepositoryId': props.repoName,
        },
      },
    }));
  }
}
