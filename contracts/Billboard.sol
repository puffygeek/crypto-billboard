//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Billboard is Ownable, ReentrancyGuard, ERC721 {
    event NewMessage(string message, uint256 price, address publisher);

    using Counters for Counters.Counter;

    string public message;
    uint256 public price;
    address public publisher;
    uint256 public totalPaid;
    uint256 public totalMessages;

    Counters.Counter private _tokenIds;
    string private _baseURIparam;
    string private _contractURI;

    constructor(
        uint256 startPrice,
        string memory startMessage,
        string memory baseURI,
        string memory defaultContractURI
    ) ERC721("Billboard", "BLBD") {
        price = startPrice;
        message = startMessage;
        publisher = msg.sender;
        setBaseURI(baseURI);
        _contractURI = defaultContractURI;
    }

    function setMessage(string memory newMessage) public payable nonReentrant {
        require(
            msg.value > price,
            "Payment needs to be above the current price"
        );

        price = msg.value;
        totalPaid += msg.value;
        totalMessages += 1;
        publisher = msg.sender;
        _mintNFT(msg.sender);
        message = newMessage;
        emit NewMessage(message, price, publisher);
    }

    function getInfo()
        public
        view
        returns (
            string memory,
            uint256,
            address
        )
    {
        return (message, price, publisher);
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function withdrawAll() public payable onlyOwner {
        require(payable(msg.sender).send(address(this).balance));
    }

    function grantNewNFT(address to) public onlyOwner returns (uint256) {
        return _mintNFT(to);
    }

    function setContractURI(string memory defaultContractURI) public onlyOwner {
        _contractURI = defaultContractURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseURIparam = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIparam;
    }

    function _mintNFT(address user) internal returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(user, newItemId);

        return newItemId;
    }
}
