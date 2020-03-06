
var coldStakingMain = artifacts.require("ColdStakingMain");
var coldStakingMainMock = artifacts.require("ColdStakingMainMock");
var coldStakingSub = artifacts.require("ColdStakingSub");
var coldStakingVoting = artifacts.require("ColdStakingVoting");

module.exports = function(deployer, network, accounts) {
  
  // real envirenement testing or mainnet deployement
  if(network === "cloMainnet" || network === "cloTestnet") {
    deployer.deploy(coldStakingMain).then(function() {
      return deployer.deploy(coldStakingVoting, coldStakingMain.address);
    })
  }
  // only intended for local testing
  else if(network === "development" || network ==="localTest" || network=="test") {
  	deployer.deploy(coldStakingMainMock).then(function() {
	   deployer.deploy(coldStakingSub, coldStakingMainMock.address);
	   return deployer.deploy(coldStakingVoting, coldStakingMainMock.address);
    })
  }
}

