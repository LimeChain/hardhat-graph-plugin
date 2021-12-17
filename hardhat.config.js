require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
const shell = require('shelljs');


// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
task("graph", "Generates a template subgraph", async () => {
  console.log("Generating template subgraph...");

  // TODO: Support multiple contracts
  const raw = fs.readFileSync("artifacts/contracts/Greeter.sol/Greeter.json")
  const json = JSON.parse(raw)
  const abi = json.abi;

  // Get only events
  const events = abi.filter(i => {
    return i.type === "event";
  })

  events.forEach(e => {
   let { inputs, name } = e;
   console.log(inputs);
  })
  
  // Pull the official demo subgraph locally
  shell.exec('git clone https://github.com/graphprotocol/example-subgraph.git');

  // Override example subgraph contracts with the ones from Hardhat
  shell.exec('rm -rf example-subgraph/contracts');
  shell.exec('cp -r contracts example-subgraph');

  // Override example subgraph abis with the ones from Hardhat
  shell.exec('rm -rf example-subgraph/abis');
  // TODO: Some logic where we get all ABIs from the artifacts/contracts folder and move the into example-subgraph/abi
  shell.exec('mkdir -p example-subgraph/abis')
  shell.exec('cp -r artifacts/contracts/Greeter.sol/Greeter.json example-subgraph/abis');

  // Delete mappings file and create empty file
  shell.exec('rm -rf example-subgraph/src/mapping.ts');
  shell.exec('touch example-subgraph/src/mapping.ts');

  // TODO: Delete schema.graphql file and create new one with an entity corresponding to the NewGreeter event
  // TODO: Delete subgraph.yml and re-create it with the corresponding info from the hardhat project (prompt the user for info if needed)
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
};
