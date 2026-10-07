import { network } from "hardhat";

async function main() {
  const { viem } = await network.create();
  const contract = await viem.deployContract("PharmaSupplyChain");
  console.log("PharmaSupplyChain deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
