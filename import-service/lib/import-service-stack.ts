import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';


export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importBucket = s3.Bucket.fromBucketName(this, 'ImportBucket', 'import-bucket-oksana');

    const importProductsFileFunction = new lambda.Function(this, 'importProductsFileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'importProductsFile.handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    })

    importBucket.grantReadWrite(importProductsFileFunction);

    const api = new apigateway.RestApi(this, 'importApi', {
      restApiName: 'Import Service',
      cloudWatchRole: true,
    })

    const importProductsFileResource = api.root.addResource('import');
    const importProductsFileLambdaIntegration = new apigateway.LambdaIntegration(importProductsFileFunction);
    importProductsFileResource.addMethod('GET', importProductsFileLambdaIntegration, {
      requestParameters: {
        'method.request.querystring.name': true
      }
    });
     // Создаем Lambda функцию для обработки файла
    const importFileParserFunction = new lambda.Function(this, 'importFileParserFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'importFileParser.handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    });

    // Даем разрешение на чтение бакета Lambda функции
     importBucket.grantReadWrite(importFileParserFunction);

    importBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserFunction), {
      prefix: 'uploaded/'
    });
    
  }
  
}