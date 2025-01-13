const UserRegistry = artifacts.require("UserRegistry");
const CardMarketplace = artifacts.require("CardMarketplace");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(UserRegistry);
  const userRegistryInstance = await UserRegistry.deployed();

  const userRegistryAddress = userRegistryInstance.address;

  await deployer.deploy(CardMarketplace, userRegistryAddress);
};