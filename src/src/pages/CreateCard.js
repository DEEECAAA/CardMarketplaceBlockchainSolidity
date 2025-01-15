import React, { useState } from "react";
import { TextField, Button, Typography, Box, Snackbar, Alert, Paper } from "@mui/material";
import Web3 from "web3";
import { create } from "ipfs-http-client";
import cardMarketplaceABI from "/Users/deeecaaa/blockchain-card-marketplace/src/src/abi/CardMarketplace.json";

const CreateCard = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Default IPFS hash per il placeholder delle immagini
  const defaultIpfsHash = "QmWfCGa8fu1qYgkZDbVtr3Eye1wsPTmHSPkJChXB23khK6";

  const web3 = new Web3(window.ethereum);
  const cardMarketplaceAddress = "0x78aaC4675B43081dA3EF60BDc9D6d92145b54bc3";
  const cardMarketplace = new web3.eth.Contract(cardMarketplaceABI.abi, cardMarketplaceAddress);

  const ipfs = create({ url: "http://127.0.0.1:5001" });

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price || Number(price) <= 0) {
      setSnackbar({ open: true, message: "Please enter a valid name and price", severity: "error" });
      return;
    }

    try {
      setLoading(true);

      let ipfsHash = defaultIpfsHash;

      if (image) {
        const added = await ipfs.add(image);
        ipfsHash = added.cid.toString();
      }
      
      const accounts = await web3.eth.getAccounts();
      const userAddress = accounts[0];

      const priceInWei = web3.utils.toWei(price.toString(), "ether");

      const receipt = await cardMarketplace.methods
        .createCard(name, ipfsHash, priceInWei)
        .send({ from: userAddress, value: web3.utils.toWei("0.0003", "ether"), gas: 300000 });

      setSnackbar({ open: true, message: "Card created successfully", severity: "success" });

      setName("");
      setPrice("");
      setImage(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to create card: ${err.message}`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create Card
        </Typography>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          error={!name.trim() && loading}
          helperText={!name.trim() && loading ? "Name is required" : ""}
        />
        <TextField
          label="Price (ETH)"
          fullWidth
          margin="normal"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={loading}
          error={Number(price) <= 0 && loading}
          helperText={Number(price) <= 0 && loading ? "Price must be positive" : ""}
        />
        <Button
          variant="contained"
          component="label"
          fullWidth
          sx={{ mt: 2 }}
          disabled={loading}
        >
          Upload Image (Optional)
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateCard;