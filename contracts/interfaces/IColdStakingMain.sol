pragma solidity ^0.5.8;

interface IColdStakingMain 
{
    function stake() external payable;
    function withdraw(address _addr, uint _amount) external;
    function claim(address _addr, uint _reward) external;
    function withdrawAndClaim(address _addr, uint _amount, uint _reward) external;
    function subContractReward(address _addr) external view returns(uint _reward) ;
}
