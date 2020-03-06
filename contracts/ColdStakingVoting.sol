pragma solidity ^0.5.8;

import "./interfaces/ITreasuryVoting.sol";
import "./ColdStakingSub.sol";
import "./interfaces/IColdStakingVoting.sol";

contract ColdStakingVoting is  IColdStakingVoting , ColdStakingSub
{

 	address public governanceContract;

    function setGovernanceContract(address _governanceContract) public onlyTreasurer {
        governanceContract = _governanceContract;
    }

    modifier onlyGovernanceContract {
        require(msg.sender == governanceContract);
        _;
    }

    constructor(address _coldStakingMain) ColdStakingSub(_coldStakingMain) public {
        treasurer = address(msg.sender);
    }

	function vote_update(address _addr) internal {
	    if( ITreasuryVoting(governanceContract).is_voter(_addr) )
            ITreasuryVoting(governanceContract).update_voter(msg.sender,stakers[_addr].stake);    
    }

    function start_staking() public payable {
    	super.start_staking();
    	vote_update(msg.sender);
    }

    function withdraw_stake() public {
    	require(stakers[msg.sender].voteWithdrawalDeadline < block.timestamp);
    	super.withdraw_stake();
    	vote_update(msg.sender);
    }
    function report_abuse(address _addr) public {
    	require(stakers[_addr].voteWithdrawalDeadline < block.timestamp);
    	super.report_abuse(_addr);
    	vote_update(_addr);
    }

    function vote_casted(address voter, uint _voteWithdrawalDeadline) public onlyGovernanceContract
    {
        if(_voteWithdrawalDeadline >  stakers[voter].voteWithdrawalDeadline)
        {
            stakers[voter].voteWithdrawalDeadline = _voteWithdrawalDeadline;
            emit VoterWithrawlDeadlineUpdate(voter,_voteWithdrawalDeadline);
        }
    }

    function getStake(address _addr) public view returns(uint) {
        return stakers[_addr].stake;
    }
}
