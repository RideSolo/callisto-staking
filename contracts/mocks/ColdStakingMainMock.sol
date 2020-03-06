pragma solidity ^0.5.8;

import "../ColdStakingMain.sol";
import "../utils/Address.sol";

contract ColdStakingMainMock is ColdStakingMain  {
    
    function simulateRewardDeposit() public payable {
    }
}
