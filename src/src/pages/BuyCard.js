import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography, Button, Box, Paper, Snackbar, Alert } from "@mui/material";
import Web3 from "web3";
import CardMarketplaceABI from "../abi/CardMarketplace.json";

const BuyCard = () => {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [walletAddress, setWalletAddress] = useState(localStorage.getItem("walletAddress"));
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const web3 = new Web3(window.ethereum);
  const cardMarketplace = new web3.eth.Contract(
    CardMarketplaceABI.abi,
    "0xBBaC9d3AdA7f199A4D7172B65fD5B91Ee1C9D500"
  );

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        if (!walletAddress) {
          throw new Error("Wallet not connected");
        }

        const cardDetails = await cardMarketplace.methods.getCard(cardId).call();
        setCard({
          id: cardDetails.id,
          name: cardDetails.name,
          ipfsHash: cardDetails.ipfsHash,
          price: web3.utils.fromWei(cardDetails.price, "ether"),
          owner: cardDetails.owner,
          isListed: cardDetails.isListed,
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Failed to fetch card details. Please try again later.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId, walletAddress]);

  const handlePurchase = async () => {
    try {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      await cardMarketplace.methods.buyCard(card.id).send({
        from: walletAddress,
        value: web3.utils.toWei(card.price, "ether"),
      });

      setSnackbar({
        open: true,
        message: "Purchase successful!",
        severity: "success",
      });

      navigate("/view-cards");
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to purchase card: ${err.message}`,
        severity: "error",
      });
    }
  };

  if (loading) {
    return <Typography>Loading card details...</Typography>;
  }

  if (!card) {
    return (
      <Typography variant="h6" color="error">
        Card details could not be loaded. Please try again later.
      </Typography>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Purchase Card
        </Typography>
        <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6">Name: {card.name || "Unnamed Card"}</Typography>
          <Typography variant="body2">Price: {card.price} ETH</Typography>
          <Typography variant="body2">Owner: {card.owner}</Typography>
          {card.ipfsHash && (
            <img
              src={`http://127.0.0.1:8080/ipfs/${card.ipfsHash}`}
              alt={card.name}
              style={{ width: "100%", height: "auto", marginTop: "1rem" }}
              loading="lazy"
            />
          )}
        </Paper>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handlePurchase}
          disabled={!walletAddress}
        >
          Confirm Purchase
        </Button>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default BuyCard;