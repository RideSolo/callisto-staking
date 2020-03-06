pragma solidity ^0.5.8;

import "./utils/SafeMath.sol";
import "./utils/Address.sol";
import "./interfaces/IColdStakingMain.sol";
import "./interfaces/IColdStakingSub.sol";
import "./utils/Treasurer.sol";

contract ColdStakingSub is Treasurer, IColdStakingSub
{
    using SafeMath for uint;
    using Address for address;
    using Address for address payable;

    struct Staker {
        uint stake;
        uint reward;        
        uint lastClaim;
        uint lastWeightedBlockReward;
        uint voteWithdrawalDeadline;
    }
    
    mapping(address => Staker) public stakers;
    
    
    uint public stakedAmount;
    uint public weightedBlockReward;
    uint public totalClaimedReward;
    uint public lastTotalReward;
 
    uint public claim_delay = 27 days;
    uint public max_delay = 365 * 2 days; 

    address payable public treasuryAddress = 0x74682Fc32007aF0b6118F259cBe7bCCC21641600;
    
    IColdStakingMain public coldStakingMain;

    constructor(address _coldStakingMain) public {
        coldStakingMain = IColdStakingMain(_coldStakingMain);
    }
    
    function() external payable {
        start_staking();
    }

    function stake_update(uint _deposit,uint _withdraw, bool _sign) internal {

        uint m_stakedAmount = stakedAmount;
        uint m_totalClaimedReward = totalClaimedReward;

        uint newTotalReward = coldStakingMain.subContractReward(address(this)).add(m_totalClaimedReward);
        uint intervalReward = newTotalReward.sub(lastTotalReward);
        
        lastTotalReward = newTotalReward;

        if (m_stakedAmount!=0) weightedBlockReward = weightedBlockReward.add(intervalReward.mul(1 ether).div(m_stakedAmount));
        else {
            treasuryAddress.sendValue(intervalReward);
            totalClaimedReward = m_totalClaimedReward.add(intervalReward);
        }

        if(_sign && _deposit > 0) stakedAmount = m_stakedAmount.add(_deposit);
        else if(_withdraw > 0) stakedAmount = m_stakedAmount.sub(_withdraw,"ColdStaking: stake not enough");

    }

    function reward_update(Staker storage staker) internal {
        uint m_weightedBlockReward = weightedBlockReward;
        uint stakerIntervalWeightedBlockReward = m_weightedBlockReward.sub(staker.lastWeightedBlockReward);
        uint _reward = staker.stake.mul(stakerIntervalWeightedBlockReward).div(1 ether);
        
        staker.reward = staker.reward.add(_reward);
        staker.lastWeightedBlockReward = m_weightedBlockReward;
    }

    function start_staking() public payable {
        Staker storage staker = stakers[msg.sender];
        stake_update(msg.value,0,true);
        reward_update(staker); 
        
        staker.stake =  staker.stake.add(msg.value);
        staker.lastClaim = block.timestamp;
        
        coldStakingMain.stake.value(msg.value)();
        emit Staking(msg.sender,msg.value,staker.stake,block.timestamp);
    }

    function withdraw_stake() public 
    {   Staker storage staker = stakers[msg.sender];
        require(staker.lastClaim.add(claim_delay) < block.timestamp,"ColdStakingSub: minimum staking time not reached");
            
        stake_update(0,staker.stake,false);
        reward_update(staker);
        
        uint _stake = staker.stake;
        uint _reward = staker.reward;

        staker.stake = 0;
        staker.reward = 0;
        staker.lastClaim = block.timestamp;

        totalClaimedReward = totalClaimedReward.add(_reward); 
        coldStakingMain.withdrawAndClaim(msg.sender,_stake,_reward);
        emit WithdrawStake(msg.sender,_stake,_reward);
    }

    function claim() public {
        Staker storage staker = stakers[msg.sender];
        require(staker.lastClaim + claim_delay <= block.timestamp,"ColdStakingSub: minimum staking time not reached");
        
        stake_update(0,0,false);
        reward_update(staker);
        
        uint _reward = staker.reward;
            
        staker.reward = 0;
        staker.lastClaim = block.timestamp;

        totalClaimedReward = totalClaimedReward.add(_reward);
        coldStakingMain.claim(msg.sender,_reward);
        emit Claim(msg.sender, _reward);
    }

    function staker_info() public view returns(uint256 weight, uint256 init, uint256 actual_block,uint256 _reward)
    {
        weight = stakers[msg.sender].stake;
        init = stakers[msg.sender].lastClaim;
        actual_block = block.number;
        _reward = getReward(msg.sender);

    }
    
    function report_abuse(address _addr) public
    {
        Staker storage staker = stakers[_addr];
        require(staker.stake > 0);
        require(staker.lastClaim.add(max_delay) < block.timestamp,"ColdStakingSub: delay less than 2 years");
        
        stake_update(0,staker.stake,false);
        reward_update(staker);

        uint _reward = staker.reward;
        uint _stake = staker.stake; 

        staker.reward = 0;
        staker.stake = 0;

        coldStakingMain.withdraw(_addr,_stake);
        coldStakingMain.claim(address(treasuryAddress),_reward);
        emit InactiveStaker(_addr,_stake);
    }

    function getReward(address _addr) public view returns(uint _reward) {
        uint newTotalReward = coldStakingMain.subContractReward(address(this)).add(totalClaimedReward);
        uint intervalReward = newTotalReward - lastTotalReward;

        if (stakedAmount!=0) {
            uint _weightedBlockReward = weightedBlockReward.add(intervalReward.mul(1 ether).div(stakedAmount));
            uint _stakerIntervalWeightedBlockReward = _weightedBlockReward.sub(stakers[_addr].lastWeightedBlockReward);
            _reward = stakers[_addr].stake.mul(_stakerIntervalWeightedBlockReward).div(1 ether);
        } 
        _reward = stakers[_addr].reward + _reward;
    }
    
    function getLastClaim(address _addr) public view returns(uint) {
        return stakers[_addr].lastClaim;
    }

    function getStake(address _addr) public view returns(uint) {
        return stakers[_addr].stake;
    }
}
