import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, Grid, Modal, TextField, CircularProgress } from "@mui/material";
import SnackbarNotification from "../components/SnackbarNotification";
import Web3 from "web3";
import UserRegistryABI from "/Users/deeecaaa/blockchain-card-marketplace/src/src/abi/UserRegistry.json";
import CardMarketplaceABI from "/Users/deeecaaa/blockchain-card-marketplace/src/src/abi/CardMarketplace.json";

const ProfilePage = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newWallet, setNewWallet] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [editCard, setEditCard] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [confirmDelistCard, setConfirmDelistCard] = useState(null);
  const [confirmListCard, setConfirmListCard] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const web3 = new Web3(window.ethereum);
  const userRegistry = new web3.eth.Contract(
    UserRegistryABI.abi,
    "0x7A153D52C33e1dF47eBda0B3D2a0e4976224200C"
  );
  const cardMarketplace = new web3.eth.Contract(
    CardMarketplaceABI.abi,
    "0xB245960C53B68B6D45CBc1A4Dc4d87b3f456552d"
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const walletAddress = localStorage.getItem("walletAddress");
      if (!walletAddress) throw new Error("No wallet connected");

      const user = await userRegistry.methods.getUser(walletAddress).call();
      const username = user[0];
      const walletAddresses = user[1];

      const totalCards = await cardMarketplace.methods.getTotalCards().call();
      const ownedCards = [];

      for (let i = 1; i <= totalCards; i++) {
        const card = await cardMarketplace.methods.getCard(i).call();
        if (walletAddresses.some((addr) => addr.toLowerCase() === card.owner.toLowerCase())) {
          ownedCards.push({
            id: card.id,
            name: card.name,
            ipfsHash: card.ipfsHash,
            price: web3.utils.fromWei(card.price, "ether"),
            isListed: card.isListed,
          });
        }
      }

      setUserProfile({ username, walletAddresses, ownedCards });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to load profile. Please try again later.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
      setSnackbar({
        open: true,
        message: "Please enter a valid price greater than 0.",
        severity: "warning",
      });
      return;
    }
    try {
      await cardMarketplace.methods
        .updateCardPrice(editCard.id, web3.utils.toWei(newPrice, "ether"))
        .send({ from: localStorage.getItem("walletAddress") });
      setSnackbar({ open: true, message: "Card price updated successfully!", severity: "success" });
      setEditCard(null);
      setNewPrice("");
      await fetchProfile();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to update card price.", severity: "error" });
    }
  };

  const handleConfirmDelistCard = async () => {
    try {
      await cardMarketplace.methods.delistCard(confirmDelistCard.id).send({
        from: localStorage.getItem("walletAddress"),
        value: web3.utils.toWei("0.0003", "ether"),
      });
      setSnackbar({ open: true, message: "Card delisted successfully!", severity: "success" });
      setConfirmDelistCard(null);
      await fetchProfile();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delist card.", severity: "error" });
    }
  };

  const handleConfirmListCard = async (price) => {
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      setSnackbar({
        open: true,
        message: "Please enter a valid price greater than 0.",
        severity: "warning",
      });
      return;
    }
    try {
      await cardMarketplace.methods
        .listCard(confirmListCard.id, web3.utils.toWei(price, "ether"))
        .send({ from: localStorage.getItem("walletAddress") });
      setSnackbar({ open: true, message: "Card listed successfully!", severity: "success" });
      setConfirmListCard(null);
      await fetchProfile();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to list card.", severity: "error" });
    }
  };

  const handleRegisterWallet = async () => {
    if (!newWallet.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter a valid wallet address",
        severity: "warning",
      });
      return;
    }
  
    try {
      const web3 = new Web3(window.ethereum);
      const walletAddress = localStorage.getItem("walletAddress");
  
      if (!walletAddress) {
        setSnackbar({
          open: true,
          message: "No wallet connected. Please connect MetaMask.",
          severity: "warning",
        });
        return;
      }
  
      const message = `I confirm ownership of the address: ${newWallet}`;

      const signature = await web3.eth.personal.sign(message, newWallet, "");

      const recoveredAddress = web3.eth.accounts.recover(message, signature);

      if (recoveredAddress.toLowerCase() !== newWallet.toLowerCase()) {
        setSnackbar({
          open: true,
          message: "Address verification failed. Please try again.",
          severity: "error",
        });
        return;
      }
  
      await userRegistry.methods.addWalletToUser(newWallet).send({ from: walletAddress });
  
      setSnackbar({
        open: true,
        message: "Wallet registered successfully!",
        severity: "success",
      });
      setNewWallet("");
      await fetchProfile();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to register wallet: wallet doesn't exists or wallet is missing.`,
        severity: "error",
      });
    }
  };

  const checkIfOwner = async () => {
    try {
      const walletAddress = localStorage.getItem("walletAddress");
  
      if (!walletAddress) throw new Error("No wallet connected");

      const owner = await cardMarketplace.methods.getOwner().call();
  
      setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase());
    } catch (err) {
    }
  };

const handleWithdrawFunds = async () => {
  try {
    const walletAddress = localStorage.getItem("walletAddress");
    if (!walletAddress) throw new Error("No wallet connected");

    await cardMarketplace.methods.withdrawFunds().send({ from: walletAddress });
    setSnackbar({
      open: true,
      message: "Funds withdrawn successfully!",
      severity: "success",
    });
  } catch (err) {
    setSnackbar({
      open: true,
      message: `Failed to withdraw funds: No funds to withdraw`,
      severity: "error",
    });
  }
};

useEffect(() => {
  checkIfOwner();
}, []);
  
if (loading) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <CircularProgress />
    </Box>
  );
}

if (!userProfile) {
  return (
    <Typography sx={{ textAlign: "center", mt: 4 }} color="error">
      Failed to load profile. Please try again later.
    </Typography>
  );
}

return (
  <Box sx={{ maxWidth: 800, mx: "auto", mt: 4 }}>
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Typography variant="h6">Username:</Typography>
      <Typography variant="body1" gutterBottom>
        {userProfile.username || "N/A"}
      </Typography>
      <Typography variant="h6">Wallet Addresses:</Typography>
      {userProfile.walletAddresses && userProfile.walletAddresses.length > 0 ? (
        userProfile.walletAddresses.map((address, index) => (
          <Typography key={index} variant="body1" gutterBottom>
            {address}
          </Typography>
        ))
      ) : (
        <Typography variant="body1" gutterBottom>
          N/A
        </Typography>
      )}
      <Box sx={{ mt: 4 }}>
        <TextField
          label="New Wallet Address"
          fullWidth
          margin="normal"
          value={newWallet}
          onChange={(e) => setNewWallet(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleRegisterWallet}
        >
          Register Wallet
        </Button>
      </Box>
      
      {isOwner && (
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={handleWithdrawFunds}
          >
            Withdraw Funds
          </Button>
        </Box>
      )}

      <Typography variant="h6" sx={{ mt: 4 }}>
        Owned Cards:
      </Typography>
      <Grid container spacing={3}>
        {userProfile.ownedCards?.length > 0 ? (
          userProfile.ownedCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6">{card.name || "Unnamed Card"}</Typography>
                <Typography variant="body2">Price: {card.price} ETH</Typography>
                {card.ipfsHash && (
                  <img
                    src={`http://127.0.0.1:8080/ipfs/${card.ipfsHash}`}
                    alt={card.name}
                    style={{ width: "100%", height: "auto", marginTop: "1rem" }}
                    loading="lazy"
                  />
                )}
                {card.isListed ? (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={() => setEditCard(card)}
                    >
                      Modify
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      sx={{ mt: 2, ml: 1 }}
                      onClick={() => setConfirmDelistCard(card)}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    color="success"
                    sx={{ mt: 2 }}
                    onClick={() => setConfirmListCard(card)}
                  >
                    List Card
                  </Button>
                )}
              </Paper>
            </Grid>
          ))
        ) : (
          <Box sx={{ textAlign: "center", mt: 4, width: "100%" }}>
            <Typography variant="body1" color="textSecondary">
              No cards owned.
            </Typography>
          </Box>
        )}
      </Grid>
    </Paper>

    {editCard && (
      <Modal open={Boolean(editCard)} onClose={() => setEditCard(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Modify Price for {editCard.name}
          </Typography>
          <TextField
            label="New Price (ETH)"
            fullWidth
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleUpdatePrice}
          >
            Update Price
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setEditCard(null)}
          >
            Cancel
          </Button>
        </Box>
      </Modal>
    )}

    {confirmDelistCard && (
      <Modal open={Boolean(confirmDelistCard)} onClose={() => setConfirmDelistCard(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Confirm Delist Card
          </Typography>
          <Typography>
            Are you sure you want to delist the card "{confirmDelistCard.name}"?
          </Typography>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleConfirmDelistCard}
          >
            Confirm
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setConfirmDelistCard(null)}
          >
            Cancel
          </Button>
        </Box>
      </Modal>
    )}

    {confirmListCard && (
      <Modal open={Boolean(confirmListCard)} onClose={() => setConfirmListCard(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            p: 4,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Confirm List Card
          </Typography>
          <Typography>
            Set the price to list the card "{confirmListCard.name}".
          </Typography>
          <TextField
            label="Price (ETH)"
            fullWidth
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => handleConfirmListCard(newPrice)}
          >
            Confirm
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setConfirmListCard(null)}
          >
            Cancel
          </Button>
        </Box>
      </Modal>
    )}

    <SnackbarNotification
      open={snackbar.open}
      handleClose={() => setSnackbar({ ...snackbar, open: false })}
      message={snackbar.message}
      severity={snackbar.severity}
    />
  </Box>
);
};

export default ProfilePage;