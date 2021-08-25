const hre = require("hardhat");

async function main() {
  const Billboard = await hre.ethers.getContractFactory("Billboard");
  const billboard = await Billboard.deploy(
    1,
    "Hello, world!",
    "https://gateway.pinata.cloud/ipfs/"
  );

  await billboard.deployed();

  console.log("billboard deployed to:", billboard.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
