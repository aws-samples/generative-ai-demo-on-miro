import {
    Context,
    APIGatewayAuthorizerResult,
    APIGatewayRequestAuthorizerEvent,
} from 'aws-lambda'
import {
    SSMClient,
    GetParameterCommand,
    GetParameterCommandOutput,
} from '@aws-sdk/client-ssm'
import { decode, Jwt, JwtPayload } from 'jsonwebtoken'

interface MiroJwtToken extends Jwt {
    payload: MiroJwtTokenPayload
}

interface MiroJwtTokenPayload extends JwtPayload {
    team: string // ID of the Miro team that the JWT is assigned to
    user: string //ID of the Miro user that the JWT is assigned to
}

export const handler = async (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context
): Promise<APIGatewayAuthorizerResult> => {
    // const region = process.env.AWS_REGION
    // const Name = 'miroTeam'
    //
    // const client = new SSMClient({ region })
    //
    // const command = new GetParameterCommand({
    //     Name,
    // })
    // const parameter: GetParameterCommandOutput = await client.send(command)
    //
    // const jwtToken: string = event.headers['Authorization'].split(' ')[1]
    //
    // const jwsDecoded = decode(jwtToken, {
    //     complete: true,
    //     json: true,
    // }) as MiroJwtToken
    // const miroTeamFromJwt = JSON.stringify(jwsDecoded?.payload.team)
    // const miroTeamFromParameter = JSON.stringify(parameter.Parameter.Value)
    return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: event.methodArn,
                    },
                ],
            },
        }

    // return {
    //     principalId: 'user',
    //     policyDocument: {
    //         Version: '2012-10-17',
    //         Statement: [
    //             {
    //                 Action: 'execute-api:Invoke',
    //                 Effect:
    //                     miroTeamFromJwt === miroTeamFromParameter
    //                         ? 'Allow'
    //                         : 'Deny',
    //                 Resource: event.methodArn,
    //             },
    //         ],
    //     },
    // }
}
