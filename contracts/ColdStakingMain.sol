pragma solidity ^0.5.8;

import "./utils/SafeMath.sol";
import "./utils/Address.sol";
import "./interfaces/IColdStakingMain.sol";
import "./utils/Treasurer.sol";

contract ColdStakingMain is IColdStakingMain, Treasurer
{
    using SafeMath for uint;
    using Address for address;
    using Address for address payable;

    struct SubContract {
        bool whitelisted;
        uint stake;
        uint reward;        
        uint lastWeightedBlockReward;
    }
    
    mapping(address => SubContract) public subcontracts;
    
    uint public totalAmount;
    uint public weightedBlockReward;
    uint public totalClaimedReward;
    uint public lastTotalReward;
    
    address public treasuryAddress = 0x74682Fc32007aF0b6118F259cBe7bCCC21641600;
    
    function setWhiteListedAddress(address _addr, bool _whitelisted) onlyTreasurer public {
        subcontracts[_addr].whitelisted = _whitelisted;
    }

    function stake_update(uint _deposit,uint _withdraw, bool _sign) internal {
        uint m_totalAmount = totalAmount;
        uint m_totalClaimedReward = totalClaimedReward;

        uint newTotalReward = address(this).balance.add(m_totalClaimedReward).sub(m_totalAmount.add(_deposit));
        uint intervalReward = newTotalReward.sub(lastTotalReward);

        lastTotalReward = newTotalReward;

        if (m_totalAmount!=0) weightedBlockReward = weightedBlockReward.add(intervalReward.mul(1 ether).div(m_totalAmount));
        else {
            treasuryAddress.toPayable().sendValue(intervalReward);
            totalClaimedReward = m_totalClaimedReward.add(intervalReward);
        }

        if(_sign && _deposit > 0) totalAmount = m_totalAmount.add(_deposit);
        else if(_withdraw > 0) totalAmount = m_totalAmount.sub(_withdraw,"ColdStaking: stake not enough");
    }

    function reward_update(SubContract storage subcontract) internal {
        uint m_weightedBlockReward = weightedBlockReward;
        uint stakerIntervalWeightedBlockReward = m_weightedBlockReward.sub(subcontract.lastWeightedBlockReward);
        uint _reward = subcontract.stake.mul(stakerIntervalWeightedBlockReward).div(1 ether);

        subcontract.reward = subcontract.reward.add(_reward);
        subcontract.lastWeightedBlockReward = m_weightedBlockReward;
    }

    function stake() public payable {
        SubContract storage subcontract = subcontracts[msg.sender];
        require(subcontract.whitelisted,"ColdStaking: Address not whitelisted");

        stake_update(msg.value,0,true);
        reward_update(subcontract); 
        subcontract.stake = subcontract.stake.add(msg.value); 
    }
    
    function withdraw(address _addr, uint _amount) public {
        SubContract storage subcontract = subcontracts[msg.sender];
        stake_update(0,_amount,false);
        reward_update(subcontract);
        subcontract.stake  = subcontract.stake.sub(_amount,"ColdStaking: stake not enough");
        _addr.toPayable().sendValue(_amount);
    }

    function claim(address _addr, uint _reward) public {
        SubContract storage subcontract = subcontracts[msg.sender];

        stake_update(0,0,true);
        reward_update(subcontract);

        subcontract.reward  = subcontract.reward.sub(_reward,"ColdStaking: reward not enough");
        totalClaimedReward = totalClaimedReward.add(_reward);
        _addr.toPayable().sendValue(_reward);    
    }

    function withdrawAndClaim(address _addr, uint _amount, uint _reward) public {
        SubContract storage subcontract = subcontracts[msg.sender];

        stake_update(0,_amount,false);
        reward_update(subcontract);
        
        subcontract.stake  = subcontract.stake.sub(_amount);
        subcontract.reward  = subcontract.reward.sub(_reward);
        totalClaimedReward = totalClaimedReward.add(_reward);
        _addr.toPayable().sendValue(_amount.add(_reward)); 
    }

    function subContractReward(address _addr) public view returns(uint _reward) {
        uint m_totalAmount = totalAmount;
        uint newTotalReward = address(this).balance.add(totalClaimedReward).sub(m_totalAmount);
        uint intervalReward = newTotalReward.sub(lastTotalReward);
        SubContract memory subcontract = subcontracts[_addr];
        uint reward;
        if (m_totalAmount!=0) {
            uint m_weightedBlockReward = weightedBlockReward.add(intervalReward.mul(1 ether).div(m_totalAmount));
            uint m_stakerIntervalWeightedBlockReward = m_weightedBlockReward.sub(subcontract.lastWeightedBlockReward);
            reward = subcontract.stake.mul(m_stakerIntervalWeightedBlockReward).div(1 ether);
        }
        _reward = subcontract.reward + reward;
    }

    function getStake(address _addr) public view returns(uint) {
        return subcontracts[_addr].stake;
    }

    function getReward(address _addr) public view returns(uint) {
        return subcontracts[_addr].reward;
    }
}
