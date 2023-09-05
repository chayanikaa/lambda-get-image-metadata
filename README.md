# Image metadata extraction using lambda

Project suggestion from Chat GPT

**Project**: Automatically extract and index metadata of images uploaded to an S3 bucket.

**Expected Behaviour**: Whenever an image is uploaded to a specific S3 bucket, a Lambda function should be triggered to extract metadata from the image such as its dimensions, file size, colour distribution, GPS info, and camera info. This metadata should then be indexed and stored in an Amazon DynamoDB table. Additionally, a thumbnail of the image should be created and saved in another S3 bucket.

### How to approach it

- Use image processing library: done
	- Need to bundle this with the lambda. See if the import works.
	- Works. But what is the best way to deploy libs? With every lambda? Or layers? How does this effect warm start/cold start.
- Download image from S3 bucket: done
- Upload thumbnail to S3 bucket: TODO
- Execution role for Lambda: done
- DynamoDB table:
	- Map what the data should look like
	- Fields
		- ImageId(PK): path in bucket
		- GPSLatitude
		- GPSLongitude
		- GPSLatitudeRef
		- GPSLongitudeRef
		- GPSAltitude
		- CreateDate
		- LensMake
		- LensModel
		- Height
		- Width
- How would you connect this to CI/CD
	- CodeBuild/Deploy/Pipeline - connect to Github?


### Things to clean up:
- lambda
- execution role
- s3 buckets
- dynamodb table

Follow up:
- Send PR to update the snippet for get S3 to use the new SDK?
	- https://docs.aws.amazon.com/lambda/latest/dg/with-s3-example.html
