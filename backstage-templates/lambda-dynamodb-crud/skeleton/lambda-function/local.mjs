import { handler } from './index.mjs';

// Local testing wrapper for the Lambda function
// This allows the Express server to call the Lambda handler with proper event formatting

export { handler };

// You can also add local-specific logic here if needed
export const localHandler = async (event, context = {}) => {
  // Add local context if needed
  const localContext = {
    functionName: '${{ values.functionName }}',
    functionVersion: '$LATEST',
    invokedFunctionArn: `arn:aws:lambda:us-east-1:123456789012:function:${{ values.functionName }}`,
    memoryLimitInMB: '256',
    awsRequestId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    logGroupName: `/aws/lambda/${{ values.functionName }}`,
    logStreamName: `2023/10/15/[$LATEST]${Math.random().toString(36).substr(2, 9)}`,
    remainingTimeInMillis: 30000,
    ...context
  };

  console.log('Local Lambda execution with context:', localContext);

  try {
    const result = await handler(event, localContext);
    console.log('Local Lambda execution completed successfully');
    return result;
  } catch (error) {
    console.error('Local Lambda execution failed:', error);
    throw error;
  }
};