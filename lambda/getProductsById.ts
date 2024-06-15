import {  APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import {  products } from "./data";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const idParams = event.pathParameters?.productId;
  const result = products.filter(({id}) => id === idParams)
  if (result.length) {
    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json",
          "Access-Control-Allow-Headers" : "Content-Type",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
         },
        body: JSON.stringify(result[0]),
    };
  } else {
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json",
          "Access-Control-Allow-Headers" : "Content-Type",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
         },
        body: JSON.stringify(`No products with id ${idParams}`),
    };
  }
};
