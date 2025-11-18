// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CrowdfundingNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public owner;
    uint public goal;              // en WEI
    uint public deadline;          // timestamp
    uint public totalContributed;  // en WEI
    bool public goalReached;
    uint public contributorsCount;

    mapping(address => uint) public contributions;   // contribución total por address (WEI)
    mapping(uint => address) public contributors;    // índice -> address
    mapping(uint => string) private _tokenURIs;      // tokenId -> CID de metadatos (metadata.json)

    // Imagen / archivo base de la campaña (subido por el owner)
    string public campaignFileIPFS; 
    mapping(address => uint[]) public userNFTs;      // NFTs que tiene cada contribuidor

    event Contribution(address indexed contributor, uint amount);
    event Withdraw(address indexed owner, uint amount);
    event Refund(address indexed contributor, uint amount);
    event CampaignFileSet(string ipfsHash);
    // Ahora el tercer parámetro es el CID de los METADATOS, no de la imagen
    event NFTMinted(address indexed contributor, uint tokenId, string metadataIpfsHash);

    constructor(uint _goal, uint _durationInDays) ERC721("CampaignNFT", "CNFT") {
        owner = msg.sender;
        goal = _goal; // Interpretado en WEI
        deadline = block.timestamp + (_durationInDays * 1 days);
    }

    // Permite al owner subir archivo/imagen base a IPFS
    function setCampaignFile(string memory _ipfsHash) public {
        require(msg.sender == owner, "Only owner can set file");
        campaignFileIPFS = _ipfsHash;
        emit CampaignFileSet(_ipfsHash);
    }

    /**
     * Usuario dona WEI y se mintea un NFT.
     * _metadataIPFS: CID del JSON con metadatos (incluye image: ipfs://campaignFileIPFS, donor, amount, etc.)
     */
    function contributeAndMint(string memory _metadataIPFS) public payable {
        require(block.timestamp < deadline, "Campaign ended");
        require(totalContributed < goal, "Goal reached");
        require(msg.value > 0, "Must send some WEI");
        require(bytes(campaignFileIPFS).length > 0, "Campaign NFT not configured");
        require(bytes(_metadataIPFS).length > 0, "Metadata IPFS required");

        // Registrar contribucion
        if (contributions[msg.sender] == 0) {
            contributors[contributorsCount] = msg.sender;
            contributorsCount++;
        }

        contributions[msg.sender] += msg.value;   // WEI
        totalContributed += msg.value;           // WEI
        emit Contribution(msg.sender, msg.value);

        if (totalContributed >= goal) {
            goalReached = true;
        }

        // Mintear NFT
        _tokenIds.increment();
        uint newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);

        // Guardamos el CID de los METADATOS (no directamente el de la imagen)
        _tokenURIs[newTokenId] = _metadataIPFS;
        userNFTs[msg.sender].push(newTokenId);

        emit NFTMinted(msg.sender, newTokenId, _metadataIPFS);
    }

    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw");
        require(goalReached, "Goal not reached");
        uint balance = address(this).balance;
        payable(owner).transfer(balance);
        emit Withdraw(owner, balance);
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

    function showContributor(uint index) public view returns (address _contributor, uint money) {
        require(contributorsCount > 0, "No contributors yet");
        require(index < contributorsCount, "Index out of bounds");
        money = contributions[contributors[index]];
        return (contributors[index], money);
    }

    function showMyContribution() public view returns (uint amount) {
        return contributions[msg.sender];
    }

    function showGoal() public view returns (uint) {
        return goal;
    }

    function showMoneyLeft() public view returns (uint money) {
        return goal - totalContributed;
    }

    function showContributorsCount() public view returns (uint count) {
        return contributorsCount;
    }

    // Devuelve el CID de los metadatos (que tu front monta como http://localhost:8080/ipfs/<CID>)
    function tokenURI(uint tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function getUserNFTs(address user) public view returns (uint[] memory) {
        return userNFTs[user];
    }
}