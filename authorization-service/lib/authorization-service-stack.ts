import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from "constructs";

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Создаем Lambda функцию
    const basicAuthorizerFunсtion = new lambda.Function(this, 'basicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'basicAuthorizer.handler',
      code: lambda.Code.fromAsset("lambda"),
    });

    // Пример использования метода grant для предоставления разрешений
    basicAuthorizerFunсtion.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // Определяем Output для имени Lambda функции
    new cdk.CfnOutput(this, 'BasicAuthorizerFunctionOutput', {
      value: basicAuthorizerFunсtion.functionName,
      description: 'Name of the Basic Authorizer Lambda function',
      exportName: 'BasicAuthorizerFunctionName', 
    });
  }
}
