import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Создаем Lambda функцию
    const basicAuthorizerFunction = new lambda.Function(this, 'basicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'basicAuthorizer.handler',
      code: lambda.Code.fromAsset("lambda"),
    });

    // Пример использования метода grant для предоставления разрешений
    basicAuthorizerFunction.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // Определяем Output для имени Lambda функции
    new cdk.CfnOutput(this, 'BasicAuthorizerFunctionArnOutput', {
      value: basicAuthorizerFunction.functionArn,
      description: 'ARN of the Basic Authorizer Lambda function',
      exportName: 'BasicAuthorizerFunctionArn', // Имя для экспорта в CloudFormation Outputs
    });
  }
}
