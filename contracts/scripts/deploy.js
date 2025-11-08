const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Shadow Mint Contracts to Sepolia...\n");

  // Deploy BraggingRightsNFT
  console.log("📜 Deploying BraggingRightsNFT...");
  const BraggingRightsNFT = await hre.ethers.getContractFactory("BraggingRightsNFT");
  const nftContract = await BraggingRightsNFT.deploy();
  await nftContract.waitForDeployment();
  const nftAddress = await nftContract.getAddress();
  console.log(`✅ BraggingRightsNFT deployed to: ${nftAddress}`);

  // Deploy CryptoMixer
  console.log("\n💰 Deploying CryptoMixer...");
  const CryptoMixer = await hre.ethers.getContractFactory("CryptoMixer");
  const mixerContract = await CryptoMixer.deploy();
  await mixerContract.waitForDeployment();
  const mixerAddress = await mixerContract.getAddress();
  console.log(`✅ CryptoMixer deployed to: ${mixerAddress}`);

  // Summary
  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log(`NFT Contract: ${nftAddress}`);
  console.log(`Mixer Contract: ${mixerAddress}`);
  console.log(`Network: ${hre.network.name}`);
  console.log("\n🔐 Add these addresses to your .env file:");
  console.log(`NFT_CONTRACT_ADDRESS=${nftAddress}`);
  console.log(`MIXER_CONTRACT_ADDRESS=${mixerAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
