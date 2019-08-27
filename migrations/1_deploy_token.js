require('dotenv').config({path: '../.env'});

const SwarmToken = artifacts.require('SwarmToken');

const {
  CONTROLLER_ADDRESS,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
  INITIAL_ACCOUNT,
  TOTAL_SUPPLY,
} = process.env;

module.exports = function(deployer) {
  deployer.deploy(SwarmToken,
    CONTROLLER_ADDRESS,
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
    INITIAL_ACCOUNT,
    TOTAL_SUPPLY,
    );
};
