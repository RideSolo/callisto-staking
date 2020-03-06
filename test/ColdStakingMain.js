
const chai = require('chai');
const csmm = artifacts.require("ColdStakingMainMock");

const {
  BN, 
  constants,
  expectEvent,
  expectRevert,
} = require('@openzeppelin/test-helpers');

chai.use(require('chai-bn')(BN));

const PREFIX = "VM Exception while processing transaction: ";

contract('ColdStakingMainMock', (accounts) => {
  before(async () => {
    this.csmm = await csmm.deployed()
  })

  it('Deployed successfully', async () => {
    chai.expect(await this.csmm.treasuryAddress()).to.be.equal('0x74682Fc32007aF0b6118F259cBe7bCCC21641600')
    chai.expect(await this.csmm.treasurer()).to.be.equal(accounts[0])
  })

  it('Set Treasurer Test', async () => {
    await this.csmm.transferTreasurerOwnership(accounts[1],{from: accounts[0]});
    chai.expect(await this.csmm.treasurer()).to.be.equal(accounts[1])

    await expectRevert(
      this.csmm.transferTreasurerOwnership(accounts[1],{from: accounts[0]}),
      "Treasurer: caller is not the treasurer"
    )
    await this.csmm.transferTreasurerOwnership(accounts[0],{from: accounts[1]});
    chai.expect(await this.csmm.treasurer()).to.be.equal(accounts[0])
  })

  it('Whitelisting Test', async () => {

    await expectRevert(
      this.csmm.stake({from: accounts[1],value: web3.utils.toWei('1')}),
      "ColdStaking: Address not whitelisted"
    )
    await this.csmm.setWhiteListedAddress(accounts[1],true,{from: accounts[0]});
    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('1')});
    chai.expect(await this.csmm.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('1'))
  })

  it('Stake & Withdrawal Test', async () => {

    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('1')});
    await this.csmm.withdraw(accounts[6],web3.utils.toWei('2'),{from:accounts[1]});
    chai.expect(await web3.eth.getBalance(accounts[6])).to.be.bignumber.equal(web3.utils.toWei('102'))
    chai.expect(await this.csmm.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
    await expectRevert(
      this.csmm.withdraw(accounts[6],web3.utils.toWei('2'),{from:accounts[1]}),
      "ColdStaking: stake not enough"
    )
    chai.expect(await this.csmm.subContractReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
  })


  it('Two subcontracts with equal staking time and stake', async () => {

    await this.csmm.setWhiteListedAddress(accounts[2],true,{from: accounts[0]});

    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});
    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('1')});
    
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});
    await this.csmm.stake({from:accounts[2],value: web3.utils.toWei('1')});
    
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});
    await this.csmm.withdraw(accounts[1],web3.utils.toWei('1'),{from: accounts[1]});
    
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});
    // await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});
    await this.csmm.withdraw(accounts[2],web3.utils.toWei('1'),{from: accounts[2]});
    
    var reward1 = await this.csmm.getReward(accounts[1])
    var reward2 = await this.csmm.getReward(accounts[2])

    await this.csmm.claim(accounts[1],reward1,{from: accounts[1]})
    await this.csmm.claim(accounts[2],reward2,{from: accounts[2]})
    
    chai.expect(reward1).to.be.bignumber.equal(reward2)
    chai.expect(reward1).to.be.bignumber.equal(web3.utils.toWei('3'));
  })

  it('Two subcontracts with same staking time and different stake', async () => {
    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('2')});
    await this.csmm.stake({from:accounts[2],value: web3.utils.toWei('1')});
    
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.withdraw(accounts[1],web3.utils.toWei('2'),{from: accounts[1]});
    await this.csmm.withdraw(accounts[2],web3.utils.toWei('1'),{from: accounts[2]});
    
    var reward1 = await this.csmm.getReward(accounts[1])
    var reward2 = await this.csmm.getReward(accounts[2])

    await this.csmm.claim(accounts[1],reward1,{from: accounts[1]})
    await this.csmm.claim(accounts[2],reward2,{from: accounts[2]})
    
    chai.expect(reward1).to.be.bignumber.equal(web3.utils.toWei('4'))
    chai.expect(reward2).to.be.bignumber.equal(web3.utils.toWei('2'))
  })

  it('Two subcontracts with different staking time and same stake', async () => {

    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('1')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.stake({from:accounts[2],value: web3.utils.toWei('1')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.withdraw(accounts[1],web3.utils.toWei('1'),{from: accounts[1]});
    await this.csmm.withdraw(accounts[2],web3.utils.toWei('1'),{from: accounts[2]});
    
    var reward1 = await this.csmm.getReward(accounts[1])
    var reward2 = await this.csmm.getReward(accounts[2])
    
    await this.csmm.claim(accounts[1],reward1,{from: accounts[1]})
    await this.csmm.claim(accounts[2],reward2,{from: accounts[2]})
    
    chai.expect(reward1).to.be.bignumber.equal(web3.utils.toWei('9'))
    chai.expect(reward2).to.be.bignumber.equal(web3.utils.toWei('3'))
  })

  it('Three subcontracts with different staking time and same stake', async () => {

    await this.csmm.setWhiteListedAddress(accounts[3],true,{from: accounts[0]});

    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('1')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.stake({from:accounts[2],value: web3.utils.toWei('1')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.stake({from:accounts[3],value: web3.utils.toWei('1')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});


    await this.csmm.withdraw(accounts[1],web3.utils.toWei('1'),{from: accounts[1]});
    await this.csmm.withdraw(accounts[2],web3.utils.toWei('1'),{from: accounts[2]});
    await this.csmm.withdraw(accounts[3],web3.utils.toWei('1'),{from: accounts[3]});
    
    var reward1 = await this.csmm.getReward(accounts[1])
    var reward2 = await this.csmm.getReward(accounts[2])
    var reward3 = await this.csmm.getReward(accounts[3])
    
    await this.csmm.claim(accounts[1],reward1,{from: accounts[1]})
    await this.csmm.claim(accounts[2],reward2,{from: accounts[2]})
    await this.csmm.claim(accounts[3],reward3,{from: accounts[3]})
    
    chai.expect(reward1).to.be.bignumber.equal(web3.utils.toWei('11'))
    chai.expect(reward2).to.be.bignumber.equal(web3.utils.toWei('5'))
    chai.expect(reward3).to.be.bignumber.equal(web3.utils.toWei('2'))
  })

  it('Three subcontracts with different staking time and different stake', async () => {

    await this.csmm.stake({from:accounts[1],value: web3.utils.toWei('1')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.stake({from:accounts[2],value: web3.utils.toWei('2')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.stake({from:accounts[3],value: web3.utils.toWei('3')});
    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.withdraw(accounts[3],web3.utils.toWei('3'),{from: accounts[3]});
    var reward3 = await this.csmm.getReward(accounts[3])
    await this.csmm.claim(accounts[3],reward3,{from: accounts[3]})

    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.withdraw(accounts[2],web3.utils.toWei('2'),{from: accounts[2]});
    var reward2 = await this.csmm.getReward(accounts[2])
    await this.csmm.claim(accounts[2],reward2,{from: accounts[2]})

    await this.csmm.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('6')});

    await this.csmm.withdraw(accounts[1],web3.utils.toWei('1'),{from: accounts[1]});
    var reward1 = await this.csmm.getReward(accounts[1])
    await this.csmm.claim(accounts[1],reward1,{from: accounts[1]})
    
    chai.expect(reward1).to.be.bignumber.equal(web3.utils.toWei('17'))
    chai.expect(reward2).to.be.bignumber.equal(web3.utils.toWei('10'))
    chai.expect(reward3).to.be.bignumber.equal(web3.utils.toWei('3'))
  })
})