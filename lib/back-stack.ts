import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

export class BackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    // Define the Lambda function resource
    const productsListFunction = new lambda.Function(
      this,
      "productsListFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
        code: lambda.Code.fromAsset("lambda"), // Points to the lambda directory
        handler: "getProductsList.handler", // Points to the 'productsList' file in the lambda directory
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
          STOCKS_TABLE_NAME: stocksTable.tableName,
        },
      }
    );

    const productIdFunction = new lambda.Function(this, "productIdFunction", {
      runtime: lambda.Runtime.NODEJS_20_X, // Choose any supported Node.js runtime
      code: lambda.Code.fromAsset("lambda"), // Points to the lambda directory
      handler: "getProductsById.handler", // Points to the 'getProductsById' file in the lambda directory
      environment: {
        TABLE_NAME: productsTable.tableName,
      },
    });

    // Определение Lambda функции
    const createProductFunction = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "createProduct.handler", // Имя файла и обработчика
        code: lambda.Code.fromAsset("lambda"), // Путь к коду Lambda функции
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName, // Передача имени таблицы через переменную окружения
        },
      }
    );

    // Добавление политики IAM для Lambda функции
    createProductFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [productsTable.tableArn], // ARN вашей DynamoDB таблицы
      })
    );

    productsListFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [productsTable.tableArn],
      })
    );
    productsListFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:Scan"],
        resources: [stocksTable.tableArn],
      })
    );
    productIdFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:GetItem"],
        resources: [productsTable.tableArn],
      })
    );
    // Define the API Gateway resource
    const api = new apigateway.LambdaRestApi(this, "productsApi", {
      handler: productsListFunction,
      proxy: false,
    });

    // Define the '/products' resource with a GET method
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET");

    const productWithId = productsResource.addResource("{productId}");
    productWithId.addMethod(
      "GET",
      new apigateway.LambdaIntegration(productIdFunction)
    );

    // Определение метода POST для создания продукта
    productsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createProductFunction)
    );
  }
}
