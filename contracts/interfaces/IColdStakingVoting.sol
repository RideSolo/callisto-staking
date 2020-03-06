pragma solidity ^0.5.8;

interface IColdStakingVoting  {
	function getStake(address _addr) external view returns(uint);
    function vote_casted(address _addr, uint _proposal_deadline) external;
}