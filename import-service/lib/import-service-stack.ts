import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

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

    const api = new apigateway.RestApi(this, "importApi", {
      restApiName: "Import Service",
      cloudWatchRole: true,
    });

    const importProductsFileResource = api.root.addResource("import");
    const importProductsFileLambdaIntegration =
      new apigateway.LambdaIntegration(importProductsFileFunction);
    importProductsFileResource.addMethod(
      "GET",
      importProductsFileLambdaIntegration,
      {
        requestParameters: {
          "method.request.querystring.name": true,
        },
      }
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
    //catalogBatchProcess
    const catalogBatchProcessFunction = new lambda.Function(
      this,
      "catalogBatchProcessFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "catalogBatchProcess.handler",
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName
        },
      }
    );
    productsTable.grantReadWriteData(catalogBatchProcessFunction);
    stocksTable.grantReadWriteData(catalogBatchProcessFunction);

    //SQS
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue');
    
    // Configure SQS to trigger Lambda with a batch size of 5
    catalogBatchProcessFunction.addEventSource(new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5
    }));
  }
}
