// Import necessary modules from the Anchor framework and Solana Web3
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Votingdapp } from "../target/types/votingdapp";
import { BankrunProvider, startAnchor } from "anchor-bankrun";

// Load the Interface Definition Language (IDL) for the Voting DApp program
const IDL = require("../target/idl/votingdapp.json");

// Define the public key of the deployed voting program
const votingAddress = new PublicKey(
  "coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF"
);

// Start the test suite for the Voting DApp
describe("Voting", () => {
  it("Initialize Poll", async () => {
    // Set up an Anchor test environment using Bankrun (a Solana testing framework)
    const context = await startAnchor(
      "", // Empty string indicates using default configurations
      [{ name: "voting", programId: votingAddress }], // Define the Solana program we are testing
      []
    );

    // Create a provider instance to interact with the program
    const provider = new BankrunProvider(context);

    // Instantiate the program object using the IDL and provider
    const votingProgram = new Program<Votingdapp>(IDL, provider);

    // Call the `initializePoll` method to create a new poll
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1), // Unique poll ID
        new anchor.BN(0), // Initial vote count (if applicable)
        new anchor.BN(1821246480), // Poll expiration timestamp
        "What is your fav type of cake" // Poll question
      )
      .rpc(); // Execute the transaction on-chain

    // Derive the poll's PDA (Program Derived Address) based on the poll ID
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)], // Convert poll ID to Buffer for PDA derivation
      votingAddress // Use the program's address as the seed
    );

    // Fetch and log the newly created poll's data from the blockchain
    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your fav type of cake");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });
});
