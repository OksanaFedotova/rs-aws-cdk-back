import {  APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import {  products } from "./data";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (products) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json",
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
      body: JSON.stringify(products),
    };
  } else {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json",
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
      body: JSON.stringify('No products'),
    };
  }
};
