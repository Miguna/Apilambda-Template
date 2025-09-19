import { DynamoDBClient, GetItemCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const TABLE_NAME = process.env.TABLE_NAME || '${{ values.tableName }}';
const REGION = process.env.REGION || 'us-east-1';
const ENDPOINT_URL = process.env.ENDPOINT_URL; // For local DynamoDB

const dynamoDBClient = new DynamoDBClient({
  region: REGION,
  ...(ENDPOINT_URL && { endpoint: ENDPOINT_URL })
});

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const messageId = randomUUID();
  const timestamp = new Date().toISOString();

  try {
    const { operation } = event;
    const { pathParameters, queryStringParameters, body: eventBody } = event;

    let body = {};
    if (eventBody) {
      body = typeof eventBody === 'string' ? JSON.parse(eventBody) : eventBody;
    }

    console.log(`Processing operation: ${operation}`);

    switch (operation) {
      case 'list':
        return await list${{ values.entityName }}s(queryStringParameters, messageId, timestamp);

      case 'get':
        return await get${{ values.entityName }}(pathParameters?.id, messageId, timestamp);

      case 'create':
        return await create${{ values.entityName }}(body, messageId, timestamp);

      case 'update':
        return await update${{ values.entityName }}(pathParameters?.id, body, messageId, timestamp);

      case 'delete':
        return await delete${{ values.entityName }}(pathParameters?.id, messageId, timestamp);

      default:
        return errorResponse(400, `Unsupported operation: ${operation}`, event, messageId, timestamp);
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return errorResponse(500, 'Internal server error', event, messageId, timestamp, error.message);
  }
};

// ===========================================
// CRUD OPERATIONS
// ===========================================

async function list${{ values.entityName }}s(queryParams, messageId, timestamp) {
  try {
    console.log('Listing ${{ values.entityName | lower }}s with params:', queryParams);

    let command;
    let params = {
      TableName: TABLE_NAME
    };

    // If specific PK is provided, use Query, otherwise Scan all
    if (queryParams && queryParams.${{ values.pkAttribute }}) {
      params.KeyConditionExpression = '${{ values.pkAttribute }} = :pk';
      params.ExpressionAttributeValues = {
        ':pk': { S: queryParams.${{ values.pkAttribute }} }
      };
      command = new QueryCommand(params);
    } else {
      // Optional: Add filter for entity type
      params.FilterExpression = 'begins_with(${{ values.pkAttribute }}, :entityPrefix)';
      params.ExpressionAttributeValues = {
        ':entityPrefix': { S: '${{ values.entityName | upper }}#' }
      };
      command = new ScanCommand(params);
    }

    const result = await dynamoDBClient.send(command);
    const items = result.Items ? result.Items.map(item => unmarshall(item)) : [];

    return successResponse(200, {
      items,
      count: items.length,
      scannedCount: result.ScannedCount || 0
    }, null, messageId, timestamp);

  } catch (error) {
    console.error('Error listing ${{ values.entityName | lower }}s:', error);
    return errorResponse(500, 'Failed to list ${{ values.entityName | lower }}s', null, messageId, timestamp, error.message);
  }
}

async function get${{ values.entityName }}(id, messageId, timestamp) {
  try {
    if (!id) {
      return errorResponse(400, 'ID parameter is required', null, messageId, timestamp);
    }

    console.log(`Getting ${{ values.entityName | lower }} with ID: ${id}`);

    const params = {
      TableName: TABLE_NAME,
      Key: marshall({
        '${{ values.pkAttribute }}': `${{ values.entityName | upper }}#${id}`,
        '${{ values.skAttribute }}': 'METADATA'
      })
    };

    const result = await dynamoDBClient.send(new GetItemCommand(params));

    if (!result.Item) {
      return errorResponse(404, '${{ values.entityName }} not found', null, messageId, timestamp);
    }

    const item = unmarshall(result.Item);
    return successResponse(200, item, null, messageId, timestamp);

  } catch (error) {
    console.error('Error getting ${{ values.entityName | lower }}:', error);
    return errorResponse(500, 'Failed to get ${{ values.entityName | lower }}', null, messageId, timestamp, error.message);
  }
}

async function create${{ values.entityName }}(body, messageId, timestamp) {
  try {
    // Validate required fields
    if (!body.${{ values.pkAttribute }} && !body.id) {
      return errorResponse(400, 'Either ${{ values.pkAttribute }} or id is required', null, messageId, timestamp);
    }

    // Generate ID if not provided
    const entityId = body.id || body.${{ values.pkAttribute }}?.split('#')[1] || randomUUID();
    const pk = `${{ values.entityName | upper }}#${entityId}`;
    const sk = body.${{ values.skAttribute }} || 'METADATA';

    console.log(`Creating ${{ values.entityName | lower }} with PK: ${pk}, SK: ${sk}`);

    // Check if entity already exists
    const existingItem = await dynamoDBClient.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ '${{ values.pkAttribute }}': pk, '${{ values.skAttribute }}': sk })
    }));

    if (existingItem.Item) {
      return errorResponse(409, '${{ values.entityName }} already exists', null, messageId, timestamp);
    }

    // Prepare item for creation
    const item = {
      '${{ values.pkAttribute }}': pk,
      '${{ values.skAttribute }}': sk,
      ...body,
      id: entityId,
      createdAt: timestamp,
      updatedAt: timestamp,
      entityType: '${{ values.entityName }}',
      version: 1
    };

    // Remove any undefined or null values
    Object.keys(item).forEach(key => {
      if (item[key] === undefined || item[key] === null) {
        delete item[key];
      }
    });

    const params = {
      TableName: TABLE_NAME,
      Item: marshall(item),
      ConditionExpression: 'attribute_not_exists(${{ values.pkAttribute }}) AND attribute_not_exists(${{ values.skAttribute }})'
    };

    await dynamoDBClient.send(new PutItemCommand(params));

    return successResponse(201, item, null, messageId, timestamp);

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return errorResponse(409, '${{ values.entityName }} already exists', null, messageId, timestamp);
    }
    console.error('Error creating ${{ values.entityName | lower }}:', error);
    return errorResponse(500, 'Failed to create ${{ values.entityName | lower }}', null, messageId, timestamp, error.message);
  }
}

async function update${{ values.entityName }}(id, body, messageId, timestamp) {
  try {
    if (!id) {
      return errorResponse(400, 'ID parameter is required', null, messageId, timestamp);
    }

    const pk = `${{ values.entityName | upper }}#${id}`;
    const sk = body.${{ values.skAttribute }} || 'METADATA';

    console.log(`Updating ${{ values.entityName | lower }} with PK: ${pk}, SK: ${sk}`);

    // Check if entity exists
    const existingItem = await dynamoDBClient.send(new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ '${{ values.pkAttribute }}': pk, '${{ values.skAttribute }}': sk })
    }));

    if (!existingItem.Item) {
      return errorResponse(404, '${{ values.entityName }} not found', null, messageId, timestamp);
    }

    const currentItem = unmarshall(existingItem.Item);

    // Prepare update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Always update timestamp and version
    updateExpressions.push('#updatedAt = :updatedAt');
    updateExpressions.push('#version = #version + :inc');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeNames['#version'] = 'version';
    expressionAttributeValues[':updatedAt'] = { S: timestamp };
    expressionAttributeValues[':inc'] = { N: '1' };

    // Add other fields from body
    Object.entries(body).forEach(([key, value]) => {
      if (key !== '${{ values.pkAttribute }}' && key !== '${{ values.skAttribute }}' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'version' && value !== undefined && value !== null) {
        const attrName = `#${key}`;
        const attrValue = `:${key}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = marshall(value);
      }
    });

    if (updateExpressions.length === 2) { // Only updatedAt and version
      return errorResponse(400, 'No valid fields to update', null, messageId, timestamp);
    }

    const params = {
      TableName: TABLE_NAME,
      Key: marshall({ '${{ values.pkAttribute }}': pk, '${{ values.skAttribute }}': sk }),
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(${{ values.pkAttribute }}) AND attribute_exists(${{ values.skAttribute }})',
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDBClient.send(new UpdateItemCommand(params));
    const updatedItem = unmarshall(result.Attributes);

    return successResponse(200, updatedItem, null, messageId, timestamp);

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return errorResponse(404, '${{ values.entityName }} not found', null, messageId, timestamp);
    }
    console.error('Error updating ${{ values.entityName | lower }}:', error);
    return errorResponse(500, 'Failed to update ${{ values.entityName | lower }}', null, messageId, timestamp, error.message);
  }
}

async function delete${{ values.entityName }}(id, messageId, timestamp) {
  try {
    if (!id) {
      return errorResponse(400, 'ID parameter is required', null, messageId, timestamp);
    }

    const pk = `${{ values.entityName | upper }}#${id}`;
    const sk = 'METADATA';

    console.log(`Deleting ${{ values.entityName | lower }} with PK: ${pk}, SK: ${sk}`);

    const params = {
      TableName: TABLE_NAME,
      Key: marshall({ '${{ values.pkAttribute }}': pk, '${{ values.skAttribute }}': sk }),
      ConditionExpression: 'attribute_exists(${{ values.pkAttribute }}) AND attribute_exists(${{ values.skAttribute }})',
      ReturnValues: 'ALL_OLD'
    };

    const result = await dynamoDBClient.send(new DeleteItemCommand(params));

    if (!result.Attributes) {
      return errorResponse(404, '${{ values.entityName }} not found', null, messageId, timestamp);
    }

    return successResponse(204, {
      message: '${{ values.entityName }} deleted successfully',
      deletedItem: unmarshall(result.Attributes)
    }, null, messageId, timestamp);

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return errorResponse(404, '${{ values.entityName }} not found', null, messageId, timestamp);
    }
    console.error('Error deleting ${{ values.entityName | lower }}:', error);
    return errorResponse(500, 'Failed to delete ${{ values.entityName | lower }}', null, messageId, timestamp, error.message);
  }
}

// ===========================================
// RESPONSE HELPERS
// ===========================================

function successResponse(statusCode, data, event, messageId, timestamp) {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      ...data,
      messageId,
      timestamp,
      service: '${{ values.projectName }}',
      entity: '${{ values.entityName }}'
    })
  };

  console.log('Success response:', JSON.stringify(response, null, 2));
  return response;
}

function errorResponse(statusCode, message, event, messageId, timestamp, details = null) {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify({
      error: getErrorType(statusCode),
      message,
      messageId,
      timestamp,
      service: '${{ values.projectName }}',
      entity: '${{ values.entityName }}',
      ...(details && { details })
    })
  };

  console.error('Error response:', JSON.stringify(response, null, 2));
  return response;
}

function getErrorType(statusCode) {
  const errorTypes = {
    400: 'BadRequest',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'NotFound',
    409: 'Conflict',
    500: 'InternalServerError'
  };
  return errorTypes[statusCode] || 'Error';
}