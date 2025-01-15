import React, { useEffect, useState } from "react";
import { Container, Grid, Typography, Box, Paper, Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import UserRegistryABI from "/Users/deeecaaa/blockchain-card-marketplace/src/src/abi/UserRegistry.json";
import CardMarketplaceABI from "/Users/deeecaaa/blockchain-card-marketplace/src/src/abi/CardMarketplace.json";

const ViewCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userWallets, setUserWallets] = useState([]);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("walletAddress");
  const walletAddress = localStorage.getItem("walletAddress");

  const web3 = new Web3(window.ethereum);
  const userRegistryAddress = "0x468Aea88DC5746f02812c0251C2C40f586A50A5B";
  const cardMarketplaceAddress = "0xBBaC9d3AdA7f199A4D7172B65fD5B91Ee1C9D500";
  const userRegistry = new web3.eth.Contract(UserRegistryABI.abi, userRegistryAddress);
  const cardMarketplace = new web3.eth.Contract(CardMarketplaceABI.abi, cardMarketplaceAddress);

  useEffect(() => {
    const fetchUserWallets = async () => {
      if (isLoggedIn && walletAddress) {
        try {
          const userDetails = await userRegistry.methods.getUser(walletAddress).call();
          const wallets = userDetails[1];
          setUserWallets(wallets.map((wallet) => wallet.toLowerCase()));
        } catch (err) {
          setUserWallets([]);
        }
      } else {
        setUserWallets([]);
      }
    };

    fetchUserWallets();
  }, [isLoggedIn, walletAddress]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const totalCards = await cardMarketplace.methods.getTotalCards().call();
        const fetchedCards = [];

        for (let i = 1; i <= totalCards; i++) {
          const card = await cardMarketplace.methods.getCard(i).call();

          if (!isLoggedIn || !userWallets.includes(card.owner.toLowerCase())) {
            fetchedCards.push({
              id: card.id,
              name: card.name,
              ipfsHash: card.ipfsHash,
              price: web3.utils.fromWei(card.price, "ether"),
              owner: card.owner,
              isListed: card.isListed,
            });
          }
        }

        const listedCards = fetchedCards.filter((card) => card.isListed);
        setCards(listedCards);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [isLoggedIn, userWallets]);

  const handlePurchase = (cardId) => {
    navigate(`/buy-card/${cardId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Available Cards
      </Typography>
      {cards.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4 }}>
          No listed cards available for purchase.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6">{card.name || "Unnamed Card"}</Typography>
                <Typography variant="body2">Price: {card.price} ETH</Typography>
                {card.ipfsHash ? (
                  <img
                    src={`http://127.0.0.1:8080/ipfs/${card.ipfsHash}`}
                    alt={card.name}
                    style={{ width: "100%", height: "auto", marginTop: "1rem" }}
                    loading="lazy"
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    No image available
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => handlePurchase(card.id)}
                >
                  Purchase Card
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ViewCards;