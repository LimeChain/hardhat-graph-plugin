require("@nomiclabs/hardhat-waffle");
const fs = require('fs');
const shell = require('shelljs');
const yaml = require('js-yaml');

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

    // Generate schema file
    // TODO: Remove hardcoded string
    fs.writeFile("example-subgraph/schema.graphql", `type Greeter @entity {
    id: ID!
    text: String!
}`, () => {

    })
    // Generate mapping code and write to file
    // TODO: Remove hardcoded string
    fs.writeFile("example-subgraph/src/mapping.ts", `import { NewGreeting } from '../generated/Greeter/Greeter'
import { Greeter } from '../generated/schema'

export function handleNewGreeting(event: NewGreeting): void {
    let greeter = new Greeter(event.params.id.toHex())
    greeter.text = event.params.text
    greeter.save()
}
    `, () => {

    })

    // Parse subgraph.yaml file
    const doc = yaml.load(fs.readFileSync('example-subgraph/subgraph.yaml', 'utf8'));

    // Edit fields
    // Sorry for hardcoding these fields, was kind of tight on time :(
    // TODO: Remove hardcoded values (loop through artifacts/contracts folder)
    doc.description = "Please change me";

    // TODO: Ask user for contract address
    doc.dataSources[0].source.address = "0x2E645469f354BB4F5c8a05B3b30A929361cf77eC";
    doc.dataSources[0].source.abi = "Greeter";
    doc.dataSources[0].name = "Greeter";
    doc.dataSources[0].mapping.entities = ["Greeter"];
    doc.dataSources[0].mapping.abis[0].name = "Greeter";
    doc.dataSources[0].mapping.abis[0].file = "./abis/Greeter.json";
    doc.dataSources[0].mapping.eventHandlers = [{"event": "NewGreeting(uint256,string)", "handler": "handleNewGreeting"}];

    fs.writeFile("example-subgraph/subgraph.yaml", yaml.dump(doc, {
        flowLevel: 6,
        styles: {
            '!!int': 'hexadecimal',
            '!!null': 'camelcase'
        }
    }), () => {

    });
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.4",
};
