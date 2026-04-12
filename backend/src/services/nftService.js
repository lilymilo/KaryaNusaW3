/**
 * NFT Service — Minting and transferring KaryaNusaNFT tokens
 * 
 * Uses the platform wallet (PLATFORM_WALLET_PRIVATE_KEY) to sign transactions.
 * The platform wallet must be the contract owner.
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let contractABI;
try {
  const contractJson = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'contracts', 'KaryaNusaNFT.json'), 'utf8')
  );
  contractABI = contractJson.abi;
} catch (err) {
  console.warn('⚠️ KaryaNusaNFT.json not found. NFT features will be disabled.');
  contractABI = null;
}

/**
 * Get an ethers provider and signer for the platform wallet
 */
function getPlatformSigner() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    return null;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return { provider, wallet };
}

/**
 * Get the NFT contract instance
 */
function getContract() {
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!contractAddress || !contractABI) {
    return null;
  }

  const signer = getPlatformSigner();
  if (!signer) return null;

  return new ethers.Contract(contractAddress, contractABI, signer.wallet);
}

/**
 * Check if NFT features are available (all env vars configured)
 */
export function isNFTEnabled() {
  return !!(
    process.env.SEPOLIA_RPC_URL &&
    process.env.PLATFORM_WALLET_PRIVATE_KEY &&
    process.env.NFT_CONTRACT_ADDRESS &&
    contractABI
  );
}

/**
 * Mint a new product NFT
 * @param {string} toAddress - Seller's wallet address (will be initial owner)
 * @param {string} metadataURI - URL to product metadata JSON
 * @returns {{ tokenId: number, txHash: string }} or null if NFT not enabled
 */
export async function mintNFT(toAddress, metadataURI) {
  if (!isNFTEnabled()) {
    console.log('ℹ️ NFT minting skipped — blockchain not configured');
    return null;
  }

  const contract = getContract();
  if (!contract) return null;

  try {
    console.log(`🔨 Minting NFT for ${toAddress}...`);
    console.log(`   Metadata: ${metadataURI}`);

    const tx = await contract.mintProduct(toAddress, metadataURI);
    console.log(`   TX Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    
    const mintEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'ProductMinted';
      } catch {
        return false;
      }
    });

    let tokenId = null;
    if (mintEvent) {
      const parsed = contract.interface.parseLog(mintEvent);
      tokenId = Number(parsed.args.tokenId);
    }

    console.log(`✅ NFT minted! Token ID: ${tokenId}`);

    return {
      tokenId,
      txHash: tx.hash,
      contractAddress: process.env.NFT_CONTRACT_ADDRESS,
    };
  } catch (error) {
    console.error('❌ NFT minting failed:', error.message);
    return null;
  }
}

/**
 * Transfer NFT ownership from seller to buyer
 * @param {string} fromAddress - Seller's wallet address
 * @param {string} toAddress - Buyer's wallet address
 * @param {number} tokenId - The token ID to transfer
 * @returns {{ txHash: string }} or null
 */
export async function transferNFT(fromAddress, toAddress, tokenId) {
  if (!isNFTEnabled()) {
    console.log('ℹ️ NFT transfer skipped — blockchain not configured');
    return null;
  }

  const contract = getContract();
  if (!contract) return null;

  try {
    console.log(`🔄 Transferring NFT #${tokenId}: ${fromAddress} → ${toAddress}`);
    
    const tx = await contract.transferProduct(fromAddress, toAddress, tokenId);
    console.log(`   TX Hash: ${tx.hash}`);
    
    await tx.wait();
    console.log(`✅ NFT #${tokenId} transferred!`);

    return { txHash: tx.hash };
  } catch (error) {
    console.error('❌ NFT transfer failed:', error.message);
    return null;
  }
}

/**
 * Get the metadata URI for a token
 * @param {number} tokenId
 * @returns {string|null}
 */
export async function getTokenURI(tokenId) {
  if (!isNFTEnabled()) return null;
  
  const contract = getContract();
  if (!contract) return null;

  try {
    return await contract.tokenURI(tokenId);
  } catch {
    return null;
  }
}

/**
 * Get the current owner of a token
 * @param {number} tokenId
 * @returns {string|null}
 */
export async function getTokenOwner(tokenId) {
  if (!isNFTEnabled()) return null;

  const contract = getContract();
  if (!contract) return null;

  try {
    return await contract.ownerOf(tokenId);
  } catch {
    return null;
  }
}
