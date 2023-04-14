import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import AmplifyConfig from '../../infra/aws-export.json'

import { UserSchema } from '~/schemas/user'

export class UserServiceClass {
  private dynCli: DynamoDB
  private userTableName = 'le-cahier-users'
  constructor() {
    const region = AmplifyConfig.region
    this.dynCli = new DynamoDB({ region })
  }

  public async setLichessUsername(userId: string, lichessUsername: string) {
    await this.dynCli.updateItem({
      TableName: this.userTableName,
      Key: marshall({ userId }),
      UpdateExpression: 'SET lichessUsername = :lichessUsername',
      ExpressionAttributeValues: marshall({
        ':lichessUsername': lichessUsername,
      }),
    })
  }

  public async getUser(userId: string) {
    const user = await this.dynCli.getItem({
      TableName: this.userTableName,
      Key: {
        userId: {
          S: userId,
        },
      },
    })
    if (!user.Item) {
      return undefined
    }
    return UserSchema.parse(unmarshall(user.Item))
  }
}

export const UserService = new UserServiceClass()
