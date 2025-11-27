const AWS = require(‘aws-sdk’);
const logger = require(’../middleware/logger’);

// Configure AWS
AWS.config.update({
accessKeyId: process.env.AWS_ACCESS_KEY_ID,
secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
region: process.env.AWS_REGION || ‘us-east-1’,
});

const s3Client = new AWS.S3({
apiVersion: ‘2006-03-01’,
});

// Upload file to S3
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
try {
const params = {
Bucket: process.env.AWS_S3_BUCKET,
Key: `meetings/${Date.now()}-${fileName}`,
Body: fileBuffer,
ContentType: mimeType,
ACL: ‘private’,
Metadata: {
‘uploaded-at’: new Date().toISOString(),
},
};

```
const result = await s3Client.upload(params).promise();
logger.info(`File uploaded to S3: ${result.Key}`);
return {
  url: result.Location,
  key: result.Key,
  size: fileBuffer.length,
};
```

} catch (error) {
logger.error(‘S3 upload error:’, error);
throw new Error(`Failed to upload to S3: ${error.message}`);
}
};

// Download file from S3
const downloadFromS3 = async (key) => {
try {
const params = {
Bucket: process.env.AWS_S3_BUCKET,
Key: key,
};

```
const data = await s3Client.getObject(params).promise();
return data.Body;
```

} catch (error) {
logger.error(‘S3 download error:’, error);
throw new Error(`Failed to download from S3: ${error.message}`);
}
};

// Delete file from S3
const deleteFromS3 = async (key) => {
try {
const params = {
Bucket: process.env.AWS_S3_BUCKET,
Key: key,
};

```
await s3Client.deleteObject(params).promise();
logger.info(`File deleted from S3: ${key}`);
```

} catch (error) {
logger.error(‘S3 delete error:’, error);
throw new Error(`Failed to delete from S3: ${error.message}`);
}
};

// Generate presigned URL
const generatePresignedUrl = async (key, expiresIn = 3600) => {
try {
const params = {
Bucket: process.env.AWS_S3_BUCKET,
Key: key,
Expires: expiresIn,
};

```
const url = s3Client.getSignedUrl('getObject', params);
return url;
```

} catch (error) {
logger.error(‘Presigned URL generation error:’, error);
throw new Error(`Failed to generate presigned URL: ${error.message}`);
}
};

// List objects in S3 bucket
const listS3Objects = async (prefix) => {
try {
const params = {
Bucket: process.env.AWS_S3_BUCKET,
Prefix: prefix,
};

```
const data = await s3Client.listObjectsV2(params).promise();
return data.Contents || [];
```

} catch (error) {
logger.error(‘S3 list error:’, error);
throw new Error(`Failed to list S3 objects: ${error.message}`);
}
};

module.exports = {
s3Client,
uploadToS3,
downloadFromS3,
deleteFromS3,
generatePresignedUrl,
listS3Objects,
};