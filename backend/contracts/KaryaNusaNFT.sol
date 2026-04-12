// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KaryaNusaNFT
 * @dev ERC-721 NFT contract for KaryaNusa marketplace products.
 * Each product listed on the marketplace is minted as an NFT.
 * On purchase, ownership transfers from seller to buyer.
 */
contract KaryaNusaNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Events
    event ProductMinted(uint256 indexed tokenId, address indexed seller, string tokenURI);
    event ProductTransferred(uint256 indexed tokenId, address indexed from, address indexed to);

    constructor() ERC721("KaryaNusa Product", "KNP") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    /**
     * @dev Mints a new product NFT. Only callable by contract owner (platform wallet).
     * @param to The seller's wallet address (initial owner)
     * @param uri The metadata URI (JSON with name, description, image, price)
     * @return tokenId The minted token ID
     */
    function mintProduct(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit ProductMinted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @dev Transfers a product NFT from seller to buyer. Only callable by contract owner.
     * Used when a purchase is completed on the marketplace.
     * @param from The seller's wallet address
     * @param to The buyer's wallet address
     * @param tokenId The token ID to transfer
     */
    function transferProduct(address from, address to, uint256 tokenId) public onlyOwner {
        _transfer(from, to, tokenId);
        emit ProductTransferred(tokenId, from, to);
    }

    /**
     * @dev Returns the current token counter (next token ID to be minted).
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
