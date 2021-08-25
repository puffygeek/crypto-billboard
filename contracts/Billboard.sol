//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Billboard is Ownable, ReentrancyGuard, ERC721URIStorage {
  event NewMessage(string message, uint price, address publisher);
  
  using Counters for Counters.Counter;

  string public message;
  uint public price;
  address public publisher;
  uint public totalPaid;
  uint public totalMessages;
  string public contractURI;

  Counters.Counter private _tokenIds;
  string private _baseURIparam;

  constructor(uint _price, string memory _message, string memory baseURI, string memory _contractURI) ERC721("Billboard", "BLBD") {
    price = _price;
    message = _message;
    publisher = msg.sender;
    setBaseURI(baseURI);
    contractURI = _contractURI;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseURIparam;
  }

  function setBaseURI(string memory baseURI) public onlyOwner {
    _baseURIparam = baseURI;
  }

  function _mintNFT(address user, string memory tokenURI) internal returns (uint256) {
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    _mint(user, newItemId);
    _setTokenURI(newItemId, tokenURI);

    return newItemId;
  }

  function setMessage(string memory _message) public payable nonReentrant {
    require(msg.value > price, "Payment needs to be above the current price");

    price = msg.value;
    totalPaid += msg.value;
    totalMessages += 1;
    publisher = msg.sender;
    _mintNFT(msg.sender, "1.json");
    message = _message;
    emit NewMessage(message, price, publisher);
  }

  function getInfo() public view returns (string memory, uint, address) {
      return (message, price, publisher);
  }

  function withdrawAll() public payable onlyOwner {
    require(payable(msg.sender).send(address(this).balance));
  }

  function grantNewNFT(address to, string memory tokenURI) public onlyOwner returns (uint256) {
    return _mintNFT(to, tokenURI);
  }

  function setContractURI(string memory _contractURI) public onlyOwner {
    contractURI = _contractURI;
  }

}
