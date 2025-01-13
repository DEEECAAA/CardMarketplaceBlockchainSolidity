// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUserRegistry {
    function getUser(address walletAddress) external view returns (string memory username, address[] memory walletAddresses);
    function getUsername(address walletAddress) external view returns (string memory);
    function getWallets(string memory username) external view returns (address[] memory);
}

contract CardMarketplace {
    struct Card {
        uint id;
        string name;
        string ipfsHash;
        uint price;
        address owner;
        bool isListed;
    }

    mapping(uint => Card) private cards;
    uint private totalCards;

    address public contractOwner;
    uint public constant FEE = 0.0003 ether;

    IUserRegistry private userRegistry;

    //Serie di eventi
    event CardCreated(uint cardId, string name, uint price, address owner);
    event CardListed(uint cardId, uint price);
    event CardBought(uint cardId, address newOwner, uint price);
    event CardDelisted(uint cardId);
    event CardPriceUpdated(uint cardId, uint oldPrice, uint newPrice);
    event FundsWithdrawn(address owner, uint amount);

    //Serie di modificatori, Access Restriction Pattern
    modifier onlyOwner(uint cardId) {
        require(cardId > 0 && cardId <= totalCards, "This card does not exist");

        (string memory cardOwnerUsername, ) = userRegistry.getUser(cards[cardId].owner);
        (string memory callerUsername, ) = userRegistry.getUser(msg.sender);

        require(
            //String Equality Comparison Pattern
            keccak256(abi.encodePacked(callerUsername)) == keccak256(abi.encodePacked(cardOwnerUsername)),
            "You are not the owner of this card"
        );

        _;
    }

    modifier cardExists(uint cardId) {
        require(cardId > 0 && cardId <= totalCards, "This card does not exist");
        _;
    }

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "You are not the contract owner");
        _;
    }

    //Design Pattern presenti, oltre quelli già citati:
    //Guard Check
    //Checks Effects Interaction
    //Secure Ether Transfer
    //Pull over Push (solo per l'owner)
    //Memory Array Building
    //
    constructor(address userRegistryAddress) {
        contractOwner = msg.sender;
        userRegistry = IUserRegistry(userRegistryAddress);
    }

    //Ritorna l'owner del contratto
    function getOwner() external view returns (address) {
        return contractOwner;
    }
    
    //Crea una nuova carta da aggiungere alla blockchain
    function createCard(string memory name, string memory ipfsHash, uint price) external payable {
        require(msg.value >= FEE, "Insufficient fee to create card");
        require(price >= 0.0001 ether, "Price must be at least 0.0001 ETH");
        require(bytes(name).length > 0, "Card name cannot be empty");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");

        totalCards++;
        cards[totalCards] = Card({
            id: totalCards,
            name: name,
            ipfsHash: ipfsHash,
            price: price,
            owner: msg.sender,
            isListed: true
        });

        emit CardCreated(totalCards, name, price, msg.sender);
    }

    //Setta una carta come listata
    function listCard(uint cardId, uint price) external onlyOwner(cardId) cardExists(cardId) {
        require(!cards[cardId].isListed, "Card is already listed");
        require(price > 0, "Price must be greater than zero");

        cards[cardId].isListed = true;
        cards[cardId].price = price;

        emit CardListed(cardId, price);
    }

    //Permette di comprare una carta
    function buyCard(uint cardId) external payable cardExists(cardId) {
        require(cards[cardId].isListed, "This card is not listed for sale");
        require(msg.value >= cards[cardId].price, "Insufficient funds to buy this card");
        require(cards[cardId].owner != msg.sender, "You cannot buy your own card");

        // Controlla se l'acquirente è associato allo stesso username del proprietario
        string memory sellerUsername = userRegistry.getUsername(cards[cardId].owner);
        address[] memory associatedWallets = userRegistry.getWallets(sellerUsername);

        for (uint i = 0; i < associatedWallets.length; i++) {
            require(associatedWallets[i] != msg.sender, "You cannot buy cards from your associated wallets");
        }

        address previousOwner = cards[cardId].owner;

        cards[cardId].owner = msg.sender;
        cards[cardId].isListed = false;
        (bool success, ) = previousOwner.call{value: msg.value}("");
        require(success, "Failed to transfer funds to the previous owner");

        emit CardBought(cardId, msg.sender, cards[cardId].price);
    }

    //Setta una carta come delistata
    function delistCard(uint cardId) external payable onlyOwner(cardId) cardExists(cardId) {
        require(msg.value >= FEE, "Insufficient fee to delist card");
        require(cards[cardId].isListed, "This card is not currently listed");

        cards[cardId].isListed = false;

        emit CardDelisted(cardId);
    }

    //Aggiorna il prezzo di una carta
    function updateCardPrice(uint cardId, uint newPrice) external onlyOwner(cardId) cardExists(cardId) {
        require(newPrice > 0, "New price must be greater than zero");
        uint oldPrice = cards[cardId].price;
        cards[cardId].price = newPrice;

        emit CardPriceUpdated(cardId, oldPrice, newPrice);
    }

    //Prende il totale delle carte presenti sulla blockchain
    function getTotalCards() external view returns (uint) {
        return totalCards;
    }

    //Prende le info di una specifica carta
    function getCard(uint cardId) external view cardExists(cardId) returns (
        uint id,
        string memory name,
        string memory ipfsHash,
        uint price,
        address owner,
        bool isListed
    ) {
        Card memory card = cards[cardId];
        return (card.id, card.name, card.ipfsHash, card.price, card.owner, card.isListed);
    }

    //Ritorna un valore booleano controllando se la carta è listata
    function isCardListed(uint cardId) external view cardExists(cardId) returns (bool) {
        return cards[cardId].isListed;
    }

    //Ritorna il portprietario della carta
    function getCardOwner(uint cardId) external view cardExists(cardId) returns (address) {
        return cards[cardId].owner;
    }

    //Ritorna le carte di un utente specifico
    function getCardsByUsername(string memory username) external view returns (Card[] memory) {
        address[] memory wallets = userRegistry.getWallets(username);
        uint count = 0;

        for (uint i = 1; i <= totalCards; i++) {
            for (uint j = 0; j < wallets.length; j++) {
                if (cards[i].owner == wallets[j]) {
                    count++;
                }
            }
        }

        Card[] memory userCards = new Card[](count);
        uint index = 0;

        for (uint i = 1; i <= totalCards; i++) {
            for (uint j = 0; j < wallets.length; j++) {
                if (cards[i].owner == wallets[j]) {
                    userCards[index] = cards[i];
                    index++;
                }
            }
        }

        return userCards;
    }

    //Permette di ritirare i fondi presenti nel contratto solo al proprietario di quest'ultimo
    function withdrawFunds() external onlyContractOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = contractOwner.call{value: balance}("");
        require(success, "Failed to withdraw funds");

        emit FundsWithdrawn(contractOwner, balance);
    }
}