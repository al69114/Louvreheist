// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BraggingRightsNFT
 * @dev NFT contract for "Bragging Rights" - Digital deeds of destroyed stolen items
 * Each NFT represents a 3D scan of a destroyed crown jewel or artifact
 */
contract BraggingRightsNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // Mapping from token ID to item hash (proves original destruction)
    mapping(uint256 => bytes32) public itemDestructionProof;

    // Events
    event BraggingRightsMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string metadataURI,
        bytes32 destructionProof
    );

    constructor() ERC721("Shadow Mint Bragging Rights", "SMBR") Ownable(msg.sender) {
        _tokenIdCounter = 1;
    }

    /**
     * @dev Mint a new Bragging Rights NFT
     * @param to Address to mint to
     * @param metadataURI IPFS URI containing 3D scan and metadata
     * @param destructionProof Hash proving the original item was destroyed
     */
    function mintBraggingRights(
        address to,
        string memory metadataURI,
        bytes32 destructionProof
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        itemDestructionProof[tokenId] = destructionProof;

        emit BraggingRightsMinted(tokenId, to, metadataURI, destructionProof);

        return tokenId;
    }

    /**
     * @dev Verify destruction proof for a token
     */
    function verifyDestruction(uint256 tokenId) public view returns (bytes32) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return itemDestructionProof[tokenId];
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
