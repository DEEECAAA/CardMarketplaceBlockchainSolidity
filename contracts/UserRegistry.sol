// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserRegistry {
    struct User {
        string username;
        address[] walletAddresses;
    }

    mapping(string => User) private users; // Mappa username agli utenti
    mapping(address => string) public walletToUsername; // Mappa portafogli al rispettivo username

    event UserRegistered(string indexed username, address indexed walletAddress);
    event WalletAdded(string indexed username, address indexed walletAddress);

    // Funzione per registrare un nuovo utente
    function registerUser(string memory username) public {
        require(bytes(username).length > 0 && bytes(username).length <= 20, "Invalid username");
        require(!isUsernameTaken(username), "Username already taken");
        require(bytes(walletToUsername[msg.sender]).length == 0, "Wallet already registered");

        users[username].username = username;
        users[username].walletAddresses.push(msg.sender);
        walletToUsername[msg.sender] = username;

        emit UserRegistered(username, msg.sender);
    }

    // Aggiunge un portafoglio a un utente esistente
    function addWalletToUser(address walletAddress) public {
        string memory username = walletToUsername[msg.sender];
        require(bytes(username).length > 0, "User not registered");
        require(bytes(walletToUsername[walletAddress]).length == 0, "Wallet already registered");

        users[username].walletAddresses.push(walletAddress);
        walletToUsername[walletAddress] = username;

        emit WalletAdded(username, walletAddress);
    }

    // Controlla se un portafoglio è registrato
    function isWalletRegistered(address walletAddress) public view returns (bool) {
        return bytes(walletToUsername[walletAddress]).length > 0;
    }

    // Verifica se uno username è già registrato
    function isUsernameTaken(string memory username) public view returns (bool) {
        return bytes(users[username].username).length > 0;
    }

    // Recuperare tutti i portafogli associati a un utente
    function getWallets(string memory username) public view returns (address[] memory) {
        require(bytes(users[username].username).length > 0, "User not registered");
        return users[username].walletAddresses;
    }

    // Recupera i dati di un utente tramite l'indirizzo del wallet
    function getUser(address walletAddress) public view returns (string memory username, address[] memory walletAddresses) {
        string memory user = walletToUsername[walletAddress];
        require(bytes(user).length > 0, "Wallet not registered");
        return (users[user].username, users[user].walletAddresses);
    }

    // Funzione per ottenere solo il nome utente tramite l'indirizzo del wallet
    function getUsername(address walletAddress) public view returns (string memory) {
        string memory username = walletToUsername[walletAddress];
        require(bytes(username).length > 0, "Wallet not registered");
        return username;
    }
}