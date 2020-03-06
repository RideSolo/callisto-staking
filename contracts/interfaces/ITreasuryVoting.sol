pragma solidity ^0.5.8;

interface ITreasuryVoting 
{
    function update_voter(address _who, uint _new_weight) external;
    function is_voter(address _who) external view returns (bool);
}
