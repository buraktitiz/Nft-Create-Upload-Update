import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  NftWithToken,
} from "@metaplex-foundation/js"
import * as fs from "fs"

const tokenName = "DeagleNFT"
const description = "The first operation"
const symbol = "DEN"
const sellerFeeBasisPoints = 100
const imageFile = "albatross.jpeg"

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())

  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(user))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    )

  // file to buffer
  const buffer = fs.readFileSync("src/" + imageFile)

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, imageFile)

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: tokenName,
      description: description,
      image: imageUri,
    })
    .then()

  console.log("metadata uri:", uri)

  // await createNft(metaplex, uri)

  // You can get this from the Solana Explorer URL 
  const mintAddress = new web3.PublicKey("6kh6jZyzVmLRXNsvEPanmSxh9Qbdmi2AGh7aFFWotBuu")
  await updateNft(metaplex, uri, mintAddress)



}

async function updateNft(
  metaplex: Metaplex,
  uri: string,
  mintAddress: web3.PublicKey
) {
  // get "NftWithToken" type from mint address
  const nft = await metaplex.nfts().findByMint({ mintAddress })

  // omit any fields to keep unchanged
  await metaplex
    .nfts()
    .update({
      nftOrSft: nft,
      name: tokenName,
      symbol: symbol,
      uri: uri,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
    })

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )
}

// create NFT
async function createNft(
  metaplex: Metaplex,
  uri: string
): Promise<NftWithToken> {
  const { nft } = await metaplex
    .nfts()
    .create({
      uri: uri,
      name: tokenName,
      sellerFeeBasisPoints: sellerFeeBasisPoints,
      symbol: symbol,
    })
    .then()

  console.log(
    `Token Mint: https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  )

  return nft
}



main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
