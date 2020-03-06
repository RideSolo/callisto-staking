pragma solidity ^0.5.8;

interface IColdStakingSub 
{
    event Staking(address addr, uint value, uint amount, uint time);
    event WithdrawStake(address staker, uint amount, uint reward);
    event Claim(address staker, uint reward);
    event DonationDeposited(address _address, uint value);
    event VoterWithrawlDeadlineUpdate(address _voter,uint _time);
    event InactiveStaker(address _addr,uint value);

    function start_staking() external payable;
    function withdraw_stake() external;
    function claim() external;
    function staker_info() external view returns(uint256 weight, uint256 init, uint256 actual_block,uint256 _reward);
    function report_abuse(address _addr) external;

    function getReward(address _addr) external view returns(uint);
    function getLastClaim(address _addr) external view returns(uint);
    function getStake(address _addr) external view returns(uint);
}
