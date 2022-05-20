//ngrok http 3000

import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  createAccount,
} from '@solana/spl-token'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import { NextApiRequest, NextApiResponse } from 'next'
import { couponAddress, shopAddress, usdcAddress } from '../../lib/addresses'
import calculatePrice from '../../lib/calculatePrice'
import base58 from 'bs58'

import idl from './tokens.json'
import * as anchor from '@project-serum/anchor'
import { Program, Provider, web3 } from '@project-serum/anchor'

import { createMintToInstruction } from '../../src/generated/instructions'
import { publicKey } from '@project-serum/anchor/dist/cjs/utils'

export type MakeTransactionInputData = {
  account: string
}

type MakeTransactionGetResponse = {
  label: string
  icon: string
}

export type MakeTransactionOutputData = {
  transaction: string
  message: string
}

type ErrorOutput = {
  error: string
}

function get(res: NextApiResponse<MakeTransactionGetResponse>) {
  res.status(200).json({
    label: 'Cookies Inc',
    icon: 'https://freesvg.org/img/1370962427.png',
  })
}

async function post(
  req: NextApiRequest,
  res: NextApiResponse<MakeTransactionOutputData | ErrorOutput>
) {
  try {
    // We pass the selected items in the query, calculate the expected cost
    const amount = calculatePrice(req.query)
    if (amount.toNumber() === 0) {
      console.log('Returning 400: amount = 0')
      res.status(400).json({ error: "Can't checkout with charge of 0" })
      return
    }

    // We pass the reference to use in the query
    const { reference } = req.query
    if (!reference) {
      console.log('Returning 400: no reference')
      res.status(400).json({ error: 'No reference provided' })
      return
    }

    // We pass the buyer's public key in JSON body
    const { account } = req.body as MakeTransactionInputData
    if (!account) {
      console.log('Returning 400: no account')
      res.status(400).json({ error: 'No account provided' })
      return
    }

    // We get the shop private key from .env - this is the same as in our script
    const shopPrivateKey = process.env.SHOP_PRIVATE_KEY as string
    if (!shopPrivateKey) {
      console.log('Returning 500: shop private key not available')
      res.status(500).json({ error: 'Shop private key not available' })
    }
    const shopKeypair = Keypair.fromSecretKey(base58.decode(shopPrivateKey))

    const buyerPublicKey = new PublicKey(account)
    const shopPublicKey = shopKeypair.publicKey

    const network = WalletAdapterNetwork.Devnet
    const endpoint = clusterApiUrl(network)
    const connection = new Connection(endpoint)

    const shopCouponAddress = await getAssociatedTokenAddress(
      couponAddress,
      shopPublicKey
    )

    // Get details about the USDC token
    const usdcMint = await getMint(connection, usdcAddress)
    // Get the buyer's USDC token account address
    const buyerUsdcAddress = await getAssociatedTokenAddress(
      usdcAddress,
      buyerPublicKey
    )

    const programId = new PublicKey(
      '53pUyMnFNBEbpncA5sKZHjmf2bexs2Rk7s7d8no4vVd8'
    )

    const [usdcPDA, usdcBump] = await PublicKey.findProgramAddress(
      [usdcMint.address.toBuffer()],
      programId
    )

    const programUsdcToken = new PublicKey(
      '39rtxjhXKkVHyonBAEE4dy9cvD5h6ZfCBB7UFxGqzbyz'
    )

    console.log(programUsdcToken)

    const diamMerchant = new PublicKey(
      'DiamXf1XxDSc3NA3KHhZ7Ss3s2CcwpT5SXxkrqjodNMX'
    )
    const diam = new PublicKey('CNgaEyK4fFP2SJEVvMWg3QPbMg3sncUKC151c2UZfZEm')

    const buyerTokenAddress = await getOrCreateAssociatedTokenAccount(
      connection,
      shopKeypair, // shop pays the fee to create it
      diam, // which token the account is for
      buyerPublicKey // who the token account belongs to (the buyer)
    )

    // Get a recent blockhash to include in the transaction
    const { blockhash } = await connection.getLatestBlockhash('finalized')

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The shop pays the transaction fee
      feePayer: buyerPublicKey,
    })

    // Create the instruction to send USDC from the buyer to the shop
    const transferInstruction = createMintToInstruction(
      {
        merchant: diamMerchant,
        mintPda: diam,
        userToken: buyerTokenAddress.address,
        userUsdcToken: buyerUsdcAddress,
        user: buyerPublicKey,
        programUsdcToken: programUsdcToken,
      },
      { amount: amount.toNumber() * 10 ** usdcMint.decimals }
    )

    // Add the reference to the instruction as a key
    // This will mean this transaction is returned when we query for the reference
    transferInstruction.keys.push({
      pubkey: new PublicKey(reference),
      isSigner: false,
      isWritable: false,
    })

    // Add both instructions to the transaction
    transaction.add(transferInstruction)

    // transaction.partialSign(shopKeypair)

    // Serialize the transaction and convert to base64 to return it
    const serializedTransaction = transaction.serialize({
      // We will need the buyer to sign this transaction after it's returned to them
      requireAllSignatures: false,
    })

    const tx2 = Transaction.from(serializedTransaction)

    const serializedTx2 = transaction.serialize({
      requireAllSignatures: false,
    })

    const base64 = serializedTx2.toString('base64')

    // Insert into database: reference, amount

    const message = 'Thanks for your order! 🍪'

    // Return the serialized transaction
    const responseBody = {
      transaction: base64,
      message,
    }

    console.log('returning 200', responseBody)
    res.status(200).json(responseBody)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'error creating transaction' })
    return
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    MakeTransactionGetResponse | MakeTransactionOutputData | ErrorOutput
  >
) {
  if (req.method === 'GET') {
    return get(res)
  } else if (req.method === 'POST') {
    return await post(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}
