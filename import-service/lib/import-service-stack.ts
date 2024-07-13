import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = s3.Bucket.fromBucketName(
      this,
      "ImportBucket",
      "import-bucket-oksana"
    );
    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      "products"
    );
    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      "stocks"
    );

    const importProductsFileFunction = new lambda.Function(
      this,
      "importProductsFileFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "importProductsFile.handler",
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      }
    );

    importBucket.grantReadWrite(importProductsFileFunction);

    const basicAuthorizerFunctionArn = cdk.Fn.importValue(
      "BasicAuthorizerFunctionArn"
    );


    const authorizerFunction = lambda.Function.fromFunctionArn(
      this,
      "AuthorizerFunction",
      basicAuthorizerFunctionArn
    );

    if (typeof basicAuthorizerFunctionArn !== "string") {
      throw new Error(`Invalid ARN: ${basicAuthorizerFunctionArn}`);
    }

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      "LambdaAuthorizer",
      {
        handler: authorizerFunction,
        identitySource: apigateway.IdentitySource.header("Authorization"),
      }
    );

    const api = new apigateway.RestApi(this, "importApi", {
      restApiName: "Import Service",
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const importProductsFileResource = api.root.addResource("import");

     const importProductsFileLambdaIntegration =
      new apigateway.LambdaIntegration(importProductsFileFunction, {
        proxy: true,
      });

    importProductsFileResource.addMethod(
      "GET",
      importProductsFileLambdaIntegration,
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
        authorizer,
        authorizationType: apigateway.AuthorizationType.CUSTOM,
      }
    );
  const responseHeaders = {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers":
        "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        "Access-Control-Allow-Methods": "'OPTIONS,GET,PUT'"
    }
    api.addGatewayResponse("GatewayResponseUnauthorized", {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders,
      statusCode:"401"
    });

    api.addGatewayResponse("GatewayResponseAccessDenied", {
      type: apigateway.ResponseType.ACCESS_DENIED,
      responseHeaders,
      statusCode:"403"
    });

    const catalogItemsQueueArn =
      "arn:aws:sqs:eu-west-1:905418269002:BackStack-CatalogItemsQueueB3B6CE23-jMbspiPg9JAP";
    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      "catalogItemsQueue",
      catalogItemsQueueArn
    );
    // Создаем Lambda функцию для обработки файла
    const importFileParserFunction = new lambda.Function(
      this,
      "importFileParserFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "importFileParser.handler",
        environment: {
          BUCKET_NAME: importBucket.bucketName,
          SQS_QUEUE_URL: catalogItemsQueue.queueUrl,
        },
      }
    );

    // Даем разрешение на чтение бакета Lambda функции
    importBucket.grantReadWrite(importFileParserFunction);

    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFunction),
      {
        prefix: "uploaded/",
      }
    );
    catalogItemsQueue.grantSendMessages(importFileParserFunction);
  }
}
