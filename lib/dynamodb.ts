import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const REGION = process.env.AWS_REGION || 'us-east-1';

// Build credentials — use explicit keys for Amplify, otherwise default chain.
const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: REGION,
};

if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  clientConfig.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}

const ddbClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

// ---------------------------------------------------------------------------
// CRUD helpers using PK / SK pattern
// ---------------------------------------------------------------------------

export async function putItem(item: Record<string, unknown>) {
  return docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  );
}

export async function getItem(pk: string, sk: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    }),
  );
  return result.Item ?? null;
}

export async function queryItems(
  pk: string,
  skPrefix?: string,
  options?: { limit?: number; scanForward?: boolean },
) {
  const params: ConstructorParameters<typeof QueryCommand>[0] = {
    TableName: TABLE_NAME,
    KeyConditionExpression: skPrefix
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk',
    ExpressionAttributeValues: skPrefix
      ? { ':pk': pk, ':sk': skPrefix }
      : { ':pk': pk },
    ScanIndexForward: options?.scanForward ?? true,
  };

  if (options?.limit) {
    params.Limit = options.limit;
  }

  const result = await docClient.send(new QueryCommand(params));
  return result.Items ?? [];
}

export async function scanItems(
  filterExpression: string,
  expressionValues: Record<string, unknown>,
  expressionNames?: Record<string, string>,
) {
  const allItems: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const params: ConstructorParameters<typeof ScanCommand>[0] = {
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues,
      ExclusiveStartKey: lastKey,
    };
    if (expressionNames) {
      params.ExpressionAttributeNames = expressionNames;
    }
    const result = await docClient.send(new ScanCommand(params));
    if (result.Items) allItems.push(...result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return allItems;
}

export async function updateItem(
  pk: string,
  sk: string,
  updates: Record<string, unknown>,
) {
  const keys = Object.keys(updates);
  const expressionParts = keys.map((k, i) => `#k${i} = :v${i}`);
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = {};

  keys.forEach((k, i) => {
    expressionNames[`#k${i}`] = k;
    expressionValues[`:v${i}`] = updates[k];
  });

  return docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    }),
  );
}

export async function deleteItem(pk: string, sk: string) {
  return docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: pk, SK: sk },
    }),
  );
}
