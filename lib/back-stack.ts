import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';


export class BackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Define the Lambda function resource
    const productsListFunction = new lambda.Function(this, 'productsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset('lambda'), // Points to the lambda directory
      handler: 'productsList.handler', // Points to the 'productsList' file in the lambda directory
    });
    const productIdFunction = new lambda.Function(this, 'productIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset('lambda'), // Points to the lambda directory
      handler: 'getProductsById.handler', // Points to the 'getProductsById' file in the lambda directory
    });
    // Define the API Gateway resource
    const api = new apigateway.LambdaRestApi(this, 'productsApi', {
      handler: productsListFunction,
      proxy: false,
    });
     // Define the '/products' resource with a GET method
    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET');
    
    const productWithId = productsResource.addResource('{productId}');
    productWithId.addMethod('GET', new apigateway.LambdaIntegration(productIdFunction));
  }
}
