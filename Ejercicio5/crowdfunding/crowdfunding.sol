// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Crowdfunding {
    address public owner;
    uint public goal;
    uint public deadline;
    uint public totalContributed;
    bool public goalReached;
    uint public contributorsCount;

    mapping(address => uint) public contributions;
    mapping(uint => address) public contributors;
    
    event Contribution(address indexed contributor, uint amount);
    event Withdraw(address indexed owner, uint amount);
    event Refund(address indexed contributor, uint amount);

    constructor(uint _goal, uint _durationInDays) {
        owner = msg.sender;
        goal = _goal;
        deadline = block.timestamp + (_durationInDays * 1 days);
    }
    
    function contribute() public payable {
        require(block.timestamp < deadline, "Campaign ended");
        require(totalContributed < goal, "Goal reached");
        require(msg.value > 0, "Must send ETH");
        if (contributions[msg.sender] == 0) {
            contributors[contributorsCount] = msg.sender;
            contributorsCount++;
        }
        contributions[msg.sender] += msg.value;
        totalContributed += msg.value;
        emit Contribution(msg.sender, msg.value);
        if (totalContributed >= goal) {
            goalReached = true;
        }
    }

    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(goalReached, "Goal not reached");
        payable(owner).transfer(address(this).balance);
        emit Withdraw(owner, address(this).balance);
    }
    function refund() public {
        require(!goalReached, "Goal reached");
        require(block.timestamp > deadline, "Campaign not ended");
        uint amount = contributions[msg.sender];
        require(amount > 0, "No funds to refund");
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit Refund(msg.sender, amount);
    }

    function showContributor(uint index) public view returns(address _contributor, uint money) {
        require(contributorsCount > 0, "There are not contributors yet");
        require(index < contributorsCount, "There are not as much contributors");
        money = contributions[contributors[index]];
        return (contributors[index], money);
    }
    function showMyContribution() public view returns (uint amount) {
        return (contributions[msg.sender]);
    }
    function showGoal() public view returns (uint) {
        return goal;
    }
    function showMoneyLeft() public view returns (uint money) {
        return (goal - totalContributed);
    }
    function showContributorsCount() public view returns (uint count) {
        return contributorsCount;
    }

    function isContributor(address contributor) public view returns (bool) {
        for (uint i = 0; i < contributorsCount; i++) {
            if (contributors[i] == contributor) {
                return true;
            }
        }
        return false;
    }
}
