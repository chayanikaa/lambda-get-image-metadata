import exifParser from 'exif-parser';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';


const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

// is there a better way to do this?
const stream2buffer = (stream) => {
  return new Promise((resolve, reject) => {
    const _buf = [];
    stream.on('data', (chunk) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err) => reject(err));
  });
}

const getS3Object = async (event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  const params = {
    Bucket: bucket,
    Key: key,
  };
  try {
    console.log({ region: process.env.AWS_REGION });
    const response = await s3.send(new GetObjectCommand(params));
    console.log('Response:', response);
    return { response, imageKey: key };
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
}

const putItemDynamoDB = async (imageKey, metadata) => {
  const input = {
    Item: {
      ImageId: {
        S: imageKey,
      },
      GPSLatitude: {
        N: metadata.tags.GPSLatitude.toString(),
      },
      GPSLongitude: {
        N: metadata.tags.GPSLongitude.toString(),
      },
      GPSLatitudeRef: {
        S: metadata.tags.GPSLatitudeRef,
      },
      GPSLongitudeRef: {
        S: metadata.tags.GPSLongitudeRef,
      },
      GPSAltitude: {
        N: metadata.tags.GPSAltitude.toString(),
      },
      CreateDate: {
        N: metadata.tags.CreateDate.toString(),
      },
      LensMake: {
        S: metadata.tags.LensMake,
      },
      LensModel: {
        S: metadata.tags.LensModel,
      },
      Height: {
        N: metadata.imageSize.height.toString(),
      },
      Width: {
        N: metadata.imageSize.width.toString(),
      },
    },
    ReturnConsumedCapacity: 'TOTAL',
    TableName: process.env.METADATA_TABLE_NAME,
  };

  return dynamodb.send(new PutItemCommand(input));
}

export const handler = async function (event, context) {
  const {response: imageObjectResponse, imageKey} = await getS3Object(event);
  const parser = exifParser.create(await stream2buffer(imageObjectResponse.Body));
  const imageMetadata = parser.parse();
  const dynamodbPutResult = await putItemDynamoDB(imageKey, imageMetadata);

  console.log('dynamodbPutResult', dynamodbPutResult);
  console.log('metadata: \n' + JSON.stringify(imageMetadata, null, 2));
  console.log('event: \n' + JSON.stringify(event, null, 2));
  return context.logStreamName;
};