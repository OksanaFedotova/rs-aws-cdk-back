import * as AWS from "aws-sdk";
import { resolve } from "path";
const csvParser = require("csv-parser");

interface IMessageBatch {
  Id: string;
  MessageBody: string;
}
export interface ICSVRow {
  [key: string]: string;
}
const s3 = new AWS.S3();
export async function handler(event: AWSLambda.S3Event): Promise<void> {
  console.log("event", event);

  try {
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    console.log(`Object created in bucket: ${bucketName}, key: ${objectKey}`);
    const sqs = new AWS.SQS();
    const queueUrl = process.env.SQS_QUEUE_URL!;

    const s3ReadStream = s3
      .getObject({ Bucket: bucketName, Key: objectKey })
      .createReadStream();

    const csvParserStream = s3ReadStream.pipe(csvParser());
    const messageBatch: IMessageBatch[] = [];

    const results: any[] = [];

    await new Promise<void>((resolve, reject) => {
      csvParserStream.on("data", (data: ICSVRow) => {
        const obj = data;
        const keys = Object.keys(obj)[0].split(';');
        const values = Object.values(obj)[0].split(';');
        const result = keys.reduce((acc, key, i) => {
          return { ...acc, [key]: values[i] };
        }, {});
        results.push(result);
      });

      csvParserStream.on("end", async () => {
        console.log("CSV parsing finished");
        console.log("CSV results:", results);
        try {
          messageBatch.push({
            Id: "1",
            MessageBody: JSON.stringify(results),
          });
          await sqs
            .sendMessageBatch({ QueueUrl: queueUrl, Entries: messageBatch })
            .promise();
          resolve();
        } catch (e) {
          reject(e);
        }
      });

      csvParserStream.on("error", (err: Error) => {
        console.error("Error parsing CSV:", err);
        reject(err);
      });
    });
  } catch (err) {
    console.error("Error processing S3 event:", err);
    throw err;
  }
}


