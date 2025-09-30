// SPDX-License-Identifier: Unlicenced
pragma solidity 0.8.30;
contract TokenContract {

    address public owner;
    uint256 public constant pricePerToken = 5 ether;

    struct Receivers {
        string name;
        uint256 tokens;
    }
    mapping(address => Receivers) public users;

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    constructor(){
        owner = msg.sender;
        users[owner].tokens = 100;
    }

    function double(uint _value) public pure returns (uint){
        return _value*2;
    }

    function register(string memory _name) public{
        users[msg.sender].name = _name;
    }

    function giveToken(address _receiver, uint256 _amount) onlyOwner public{
        require(users[owner].tokens >= _amount);
        users[owner].tokens -= _amount;
        users[_receiver].tokens += _amount;
    }

    function buyTokens(uint256 _amount) public payable {
        uint256 cost = _amount * pricePerToken;
        require(msg.value >= cost, "No has enviado suficiente Ether");
        require(users[owner].tokens >= _amount, "El propietario no tiene suficientes tokens");

        // transferir tokens
        users[owner].tokens -= _amount;
        users[msg.sender].tokens += _amount;

        // si envian de mas, se devuelve el Ether sobrante
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    function contractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}