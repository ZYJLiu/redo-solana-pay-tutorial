/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category PartialPayment
 * @category generated
 */
export type PartialPaymentInstructionArgs = {
  tokenAmount: beet.bignum
  usdcAmount: beet.bignum
}
/**
 * @category Instructions
 * @category PartialPayment
 * @category generated
 */
export const partialPaymentStruct = new beet.BeetArgsStruct<
  PartialPaymentInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['tokenAmount', beet.u64],
    ['usdcAmount', beet.u64],
  ],
  'PartialPaymentInstructionArgs'
)
/**
 * Accounts required by the _partialPayment_ instruction
 *
 * @property [_writable_] mintPda
 * @property [_writable_] userToken
 * @property [_writable_] userUsdcToken
 * @property [**signer**] user
 * @property [_writable_] programUsdcToken
 * @property [] usdcMint
 * @property [_writable_] merchantUsdcToken
 * @category Instructions
 * @category PartialPayment
 * @category generated
 */
export type PartialPaymentInstructionAccounts = {
  mintPda: web3.PublicKey
  userToken: web3.PublicKey
  userUsdcToken: web3.PublicKey
  user: web3.PublicKey
  programUsdcToken: web3.PublicKey
  usdcMint: web3.PublicKey
  merchantUsdcToken: web3.PublicKey
}

export const partialPaymentInstructionDiscriminator = [
  17, 192, 37, 162, 156, 252, 20, 86,
]

/**
 * Creates a _PartialPayment_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category PartialPayment
 * @category generated
 */
export function createPartialPaymentInstruction(
  accounts: PartialPaymentInstructionAccounts,
  args: PartialPaymentInstructionArgs
) {
  const {
    mintPda,
    userToken,
    userUsdcToken,
    user,
    programUsdcToken,
    usdcMint,
    merchantUsdcToken,
  } = accounts

  const [data] = partialPaymentStruct.serialize({
    instructionDiscriminator: partialPaymentInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: mintPda,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: userToken,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: userUsdcToken,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: user,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: programUsdcToken,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: usdcMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: merchantUsdcToken,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId: new web3.PublicKey(
      '53pUyMnFNBEbpncA5sKZHjmf2bexs2Rk7s7d8no4vVd8'
    ),
    keys,
    data,
  })
  return ix
}
