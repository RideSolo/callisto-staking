pragma solidity ^0.5.8;


contract Treasurer  {

    address public treasurer;

    event TreasurerOwnershipTransferred(address indexed previousOwner, address indexed newOwner);


    constructor () internal {
        treasurer = msg.sender;
        emit TreasurerOwnershipTransferred(address(0), treasurer);
    }

    modifier onlyTreasurer() {
        require(msg.sender == treasurer, "Treasurer: caller is not the treasurer");
        _;
    }

    modifier only_treasurer() {
        require(msg.sender == treasurer, "Treasurer: caller is not the treasurer");
        _;
    }
	
	function renounceTreasurerOwnership() public onlyTreasurer {
        emit TreasurerOwnershipTransferred(treasurer, address(0));
        treasurer = address(0);
    }


    function transferTreasurerOwnership(address newTreasurer) public onlyTreasurer {
        require(newTreasurer != address(0), "Treasurer: new treasurer is zero address");
        emit TreasurerOwnershipTransferred(treasurer, newTreasurer);
        treasurer = newTreasurer;
    }
}