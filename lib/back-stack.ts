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

    const createProductFunction = new lambda.Function(
      this,
      "CreateProductFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "createProduct.handler",
        code: lambda.Code.fromAsset("lambda"),
        environment: {
          PRODUCTS_TABLE_NAME: productsTable.tableName,
        },
      }
    );

    createProductFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem", "dynamodb:TransactWriteItems"],
        resources: [productsTable.tableArn, stocksTable.tableArn],
      })
    );

    createProductFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:TransactWriteItems"],
        resources: [stocksTable.tableArn],
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
        resources: [productsTable.tableArn, stocksTable.tableArn],
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

    //валидация
    const createProductModel = new apigateway.Model(
      this,
      "CreateProductModel",
      {
        restApi: api,
        contentType: "application/json",
        modelName: "CreateProductModel",
        schema: {
          type: apigateway.JsonSchemaType.OBJECT,
          properties: {
            title: { type: apigateway.JsonSchemaType.STRING, minLength: 1 },
            description: { type: apigateway.JsonSchemaType.STRING },
            price: { type: apigateway.JsonSchemaType.NUMBER, minimum: 0 },
            count: { type: apigateway.JsonSchemaType.NUMBER, minimum: 1 },
          },
          required: ["title", "price", "description", "count"],
        },
      }
    );

    const errorResponseTemplate = JSON.stringify({
      message: "$context.error.validationErrorString",
    });
    const errorResponseModel = new apigateway.Model(
      this,
      "ErrorResponseModel",
      {
        restApi: api,
        contentType: "application/json",
        modelName: "ErrorResponseModel",
        schema: {
          type: apigateway.JsonSchemaType.OBJECT,
          properties: {
            message: { type: apigateway.JsonSchemaType.STRING },
          },
          required: ["message"],
        },
      }
    );

    const requestValidator = new apigateway.RequestValidator(
      this,
      "CreateProductRequestValidator",
      {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    productsResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(createProductFunction, {
        integrationResponses: [
          {
            selectionPattern: "(\n|.)+",
            statusCode: "400",
            responseTemplates: { "application/json": errorResponseTemplate },
          },
        ],
      }),
      {
        requestValidator: requestValidator,
        requestModels: {
          "application/json": createProductModel,
        },
        methodResponses: [
          {
            statusCode: "400",
            responseModels: {
              "application/json": errorResponseModel,
            },
          },
          {
            statusCode: "201",
            responseModels: {
              "application/json": apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );
  }
}
