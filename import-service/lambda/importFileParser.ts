import * as AWS from 'aws-sdk';
import * as csvParser from 'csv-parser';
import * as stream from 'stream';

const s3 = new AWS.S3();

export async function handler(event: AWSLambda.S3Event): Promise<void> {
  console.log("event", event);
  
  try {
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    console.log(`Object created in bucket: ${bucketName}, key: ${objectKey}`);

    const s3ReadStream = s3.getObject({ Bucket: bucketName, Key: objectKey }).createReadStream();


    const csvParserStream = s3ReadStream.pipe(csvParser());

    await new Promise<void>((resolve, reject) => {
      csvParserStream.on('data', (data: any) => {
        console.log('CSV Record:', data);
      });

      csvParserStream.on('end', () => {
        console.log('CSV parsing finished');
        resolve(); 
      });

      csvParserStream.on('error', (err: Error) => {
        console.error('Error parsing CSV:', err);
        reject(err);
      });
    });

    console.log('Lambda function execution finished successfully.');

  } catch (err) {
    console.error('Error processing S3 event:', err);
    throw err; 
  }
}
