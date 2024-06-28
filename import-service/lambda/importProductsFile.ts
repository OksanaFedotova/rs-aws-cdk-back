import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const headers = {
    "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    "Access-Control-Allow-Origin": '*',
    "Access-Control-Allow-Methods": '*'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Incoming request:", JSON.stringify(event));
    
    const fileName = event.queryStringParameters?.name;
    if (!fileName) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Missing name in query parameters" }),
        };
    }

    const client = new S3Client({});
    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: `uploaded/${fileName}`,
    });

    try {
        const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
        const response: APIGatewayProxyResult = {
            statusCode: 200,
            headers,
            body: JSON.stringify({ url: signedUrl })
        };
        return response;
    } catch (error) {
        console.error("Error getting signed URL from S3:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};
