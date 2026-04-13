import { ethers } from 'ethers';
import fs from 'fs';

async function deploy() {
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat account 0 (owner)
  const wallet = new ethers.Wallet(privateKey, provider);

  const contractJson = JSON.parse(fs.readFileSync('./contracts/KaryaNusaNFT.json', 'utf8'));
  const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode, wallet);

  console.log('Deploying contract...');
  const contract = await factory.deploy(wallet.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  
  console.log('Contract deployed at:', address);
}

deploy().catch(console.error);
