
const chai = require('chai');
const coldStakingSub = artifacts.require("ColdStakingSub");
const coldStakingMainMock = artifacts.require("ColdStakingMainMock");

const {
  BN, 
  constants,
  expectEvent,
  expectRevert,
  time
} = require('@openzeppelin/test-helpers');

chai.use(require('chai-bn')(BN));

contract('ColdStakingSub', (accounts) => {
  before(async () => {
    this.coldStakingSub = await coldStakingSub.deployed()
    this.coldStakingMainMock = await coldStakingMainMock.deployed()
  })

  it('Deployed successfully', async () => {
    chai.expect(await this.coldStakingSub.treasuryAddress()).to.be.equal('0x74682Fc32007aF0b6118F259cBe7bCCC21641600')
    chai.expect(await this.coldStakingSub.treasurer()).to.be.equal(accounts[0])
    await this.coldStakingMainMock.setWhiteListedAddress(coldStakingSub.address,true,{from: accounts[0]});
  })

  it('Set Treasurer Test', async () => {
    await this.coldStakingSub.transferTreasurerOwnership(accounts[1],{from: accounts[0]});
    chai.expect(await this.coldStakingSub.treasurer()).to.be.equal(accounts[1])

    await expectRevert(
      this.coldStakingSub.transferTreasurerOwnership(accounts[1],{from: accounts[0]}),
      "Treasurer: caller is not the treasurer"
    )
    await this.coldStakingSub.transferTreasurerOwnership(accounts[0],{from: accounts[1]});
    chai.expect(await this.coldStakingSub.treasurer()).to.be.equal(accounts[0])
  })

  it('Stake & Withdrawal Test 27 days', async () => {

    await this.coldStakingSub.start_staking({from:accounts[1],value: web3.utils.toWei('1')});
    var lastClaim = await this.coldStakingSub.getLastClaim(accounts[1])
    await time.increaseTo(lastClaim.add(time.duration.days(27).subn(60)))
    await expectRevert(
      this.coldStakingSub.withdraw_stake({from:accounts[1]}),
      "ColdStakingSub: minimum staking time not reached"
    )
    await time.increaseTo(lastClaim.add(time.duration.days(27).addn(1)))
    var tx = await this.coldStakingSub.withdraw_stake({from:accounts[1]})
    chai.expect(await this.coldStakingSub.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
  })

  it('Two Years Staking Test', async () => {
    await this.coldStakingSub.start_staking({from:accounts[1],value: web3.utils.toWei('10')});
    var lastClaim = await this.coldStakingSub.getLastClaim(accounts[1])
    chai.expect(await this.coldStakingSub.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('10'))

    await time.increaseTo(lastClaim.add(time.duration.years(2).subn(60)))
    await expectRevert(
      this.coldStakingSub.report_abuse(accounts[1],{from:accounts[0]}),
      "ColdStakingSub: delay less than 2 years"
    )
    await time.increaseTo(lastClaim.add(time.duration.years(2).addn(1)))
    this.coldStakingSub.report_abuse(accounts[1],{from:accounts[3]})

    chai.expect(await this.coldStakingSub.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.coldStakingMainMock.totalAmount()).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.coldStakingSub.stakedAmount()).to.be.bignumber.equal(web3.utils.toWei('0'))

    chai.expect(await web3.eth.getBalance(this.coldStakingMainMock.address)).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await web3.eth.getBalance(this.coldStakingSub.address)).to.be.bignumber.equal(web3.utils.toWei('0'))
  })

  it('Two Staker with equal staking time and stake', async () => {

    await this.coldStakingSub.start_staking({from:accounts[1],value: web3.utils.toWei('1')});
    await this.coldStakingSub.start_staking({from:accounts[2],value: web3.utils.toWei('1')});

    chai.expect(await this.coldStakingSub.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('1'))
    chai.expect(await this.coldStakingSub.getStake(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('1'))
    chai.expect(await web3.eth.getBalance(this.coldStakingMainMock.address)).to.be.bignumber.equal(web3.utils.toWei('2'))
    chai.expect(await web3.eth.getBalance(this.coldStakingSub.address)).to.be.bignumber.equal(web3.utils.toWei('0'))

    await this.coldStakingMainMock.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});

    chai.expect(await this.coldStakingSub.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('1'))
    chai.expect(await this.coldStakingSub.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('1'))
    
    await this.coldStakingMainMock.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});
    await this.coldStakingMainMock.simulateRewardDeposit({from: accounts[0],value: web3.utils.toWei('2')});

    chai.expect(await this.coldStakingSub.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('3'))
    chai.expect(await this.coldStakingSub.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('3'))
    
    await time.increase(time.duration.days(26))

    await expectRevert(
      this.coldStakingSub.withdraw_stake({from:accounts[1],gasPrice:0}),
      "ColdStakingSub: minimum staking time not reached"
    )
    await expectRevert(
      this.coldStakingSub.withdraw_stake({from:accounts[2],gasPrice:0}),
      "ColdStakingSub: minimum staking time not reached"
    )

    balance1 = await web3.eth.getBalance(accounts[1])
    balance2 = await web3.eth.getBalance(accounts[2])

    await time.increase(time.duration.days(2))
    
    await this.coldStakingSub.withdraw_stake({from:accounts[1]});
    await this.coldStakingSub.withdraw_stake({from:accounts[2]});

    chai.expect(await this.coldStakingSub.getStake(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.coldStakingSub.getStake(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.coldStakingSub.getReward(accounts[1])).to.be.bignumber.equal(web3.utils.toWei('0'))
    chai.expect(await this.coldStakingSub.getReward(accounts[2])).to.be.bignumber.equal(web3.utils.toWei('0'))
  })
})