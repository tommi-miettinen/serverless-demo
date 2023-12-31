import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { GetUserCommand, UpdateUserAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";
import client from "../../services/cognito";
import { getAccessToken } from "./utils/getAccessToken";

const getUser: NextApiHandler = async (req, res) => {
  try {
    const accessToken = getAccessToken(req);

    const getUserCommand = new GetUserCommand({
      AccessToken: accessToken,
    });

    const userDetails = await client.send(getUserCommand);

    return res.status(200).json({ user: userDetails });
  } catch (error) {
    res.status(500).json(error);
  }
};

const updateUser: NextApiHandler = async (req, res) => {
  try {
    const accessToken = getAccessToken(req);
    const { UserAttributes } = req.body;

    const updateUserAttributesCommand = new UpdateUserAttributesCommand({
      AccessToken: accessToken,
      UserAttributes: UserAttributes,
    });

    await client.send(updateUserAttributesCommand);

    const getUserCommand = new GetUserCommand({
      AccessToken: accessToken,
    });
    const userDetails = await client.send(getUserCommand);

    return res.status(200).json({ user: userDetails });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return getUser(req, res);

    case "PATCH":
      return updateUser(req, res);

    default:
      res.setHeader("Allow", ["GET", "PATCH"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
