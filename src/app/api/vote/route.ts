import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Votingdapp } from "../../../../anchor/target/types/votingdapp";
import { Program, BN } from "@coral-xyz/anchor";
const IDL = require("../../../../anchor/target/idl/votingdapp.json");

export const OPTIONS = GET;

export async function GET(req: Request, res: Response) {
  const actionMetaData: ActionGetResponse = {
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkzcqsa9CEKuTEKeQACf23-NFIsd5LCWg9zA&s",
    title: "Vote for your favorite type of peanut butter",
    description: "Vote for your favorite type",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Alice",
          href: "/api/vote?candidate=Alice",
          type: "message",
        },
        {
          label: "Smooth",
          href: "/api/vote?candidate=Smooth",
          type: "message",
        },
      ],
    },
  };

  return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  const candidate = url.searchParams.get("candidate");

  if (candidate !== "Alice" && candidate !== "Smooth") {
    return new Response("INvalid candidate", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Votingdapp> = new Program(IDL, { connection });

  const body: ActionPostRequest = await request.json();

  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("INvalid account", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: "transaction",
    },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
