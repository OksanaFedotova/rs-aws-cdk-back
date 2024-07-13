import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';
import * as dotenv from 'dotenv';

dotenv.config();

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log("Event", JSON.stringify(event));

  try {
    if (event.type !== 'TOKEN') {
      throw new Error('Unauthorized: Invalid event type');
    }

    const authHeader = event.authorizationToken;

    if (!authHeader) {
      throw new Error('Unauthorized: Missing Authorization Header');
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const expectedPassword = process.env[username];

    if (!expectedPassword || expectedPassword !== password) {
      throw new Error('Forbidden: Invalid credentials');
    }

    return {
      principalId: username,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (error) {
    console.error('Error:', (error as Error).message);
    return {
      principalId: 'unauthorized',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
      },
      context: {
        statusCode: (error as Error).message.includes('Unauthorized') ? 401 : 403,
      },
    };
  }
};
