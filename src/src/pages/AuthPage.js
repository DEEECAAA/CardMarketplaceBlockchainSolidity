import React, { useState } from "react";
import { TextField, Button, Typography, Box, Tabs, Tab, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SnackbarNotification from "../components/SnackbarNotification";
import Web3 from "web3";
import UserRegistryABI from "/Users/deeecaaa/blockchain-card-marketplace/src/src/abi/UserRegistry.json";

const AuthPage = ({ onLogin }) => {
  const [tabIndex, setTabIndex] = useState(0); // 0 = Login, 1 = Register
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  const userRegistryAddress = "0xA48C9a8A06BfF754d1C2F6BA54Ce23Ee2160EcFd";
  const web3 = new Web3(window.ethereum);
  const userRegistry = new web3.eth.Contract(UserRegistryABI.abi, userRegistryAddress);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setSnackbar({
        open: true,
        message: "MetaMask is not installed. Please install it and try again.",
        severity: "error",
      });
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const connectedWallet = accounts[0];
      setWalletAddress(connectedWallet);

      setSnackbar({
        open: true,
        message: "Wallet connected successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to connect wallet. Please try again.",
        severity: "error",
      });
    }
  };

  const handleLogin = async () => {
    if (!walletAddress) {
      setSnackbar({ open: true, message: "Connect your wallet first.", severity: "warning" });
      return;
    }

    try {
      const isRegistered = await userRegistry.methods.isWalletRegistered(walletAddress).call();

      if (!isRegistered) {
        setSnackbar({
          open: true,
          message: "Wallet is not registered. Please register first.",
          severity: "warning",
        });
        return;
      }

      const userData = await userRegistry.methods.getUser(walletAddress).call();
      const username = userData[0];

      localStorage.setItem("walletAddress", walletAddress);
      localStorage.setItem("username", username);

      onLogin();
      navigate("/view-cards");
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Login failed. Please try again.",
        severity: "error",
      });
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setSnackbar({
        open: true,
        message: "Username cannot be empty.",
        severity: "warning",
      });
      return;
    }

    if (!walletAddress) {
      setSnackbar({
        open: true,
        message: "Connect your wallet first.",
        severity: "warning",
      });
      return;
    }

    try {
      const isUsernameTaken = await userRegistry.methods.isUsernameTaken(username).call();

      if (isUsernameTaken) {
        setSnackbar({
          open: true,
          message: "Username is already taken.",
          severity: "warning",
        });
        return;
      }

      const isWalletRegistered = await userRegistry.methods.isWalletRegistered(walletAddress).call();

      if (isWalletRegistered) {
        setSnackbar({
          open: true,
          message: "Wallet is already registered.",
          severity: "warning",
        });
        return;
      }

      await userRegistry.methods
        .registerUser(username)
        .send({ from: walletAddress, gas: 300000 });

      // Autenticazione automatica
      localStorage.setItem("walletAddress", walletAddress);
      localStorage.setItem("username", username);

      setSnackbar({
        open: true,
        message: "Registration successful! You are now logged in.",
        severity: "success",
      });

      onLogin();
      navigate("/view-cards");
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Registration failed. Please try again.",
        severity: "error",
      });
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper elevation={3} sx={{ padding: "2rem", width: "100%", maxWidth: 400 }}>
        <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} centered>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
        {tabIndex === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Welcome Back!
            </Typography>
            <Button variant="outlined" onClick={handleConnectWallet} fullWidth sx={{ mt: 2 }}>
              Connect Wallet
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleLogin}
              disabled={!walletAddress}
            >
              Login
            </Button>
          </Box>
        )}
        {tabIndex === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Create an Account
            </Typography>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <Button variant="outlined" onClick={handleConnectWallet} fullWidth sx={{ mt: 2 }}>
              Connect Wallet
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleRegister}
              disabled={!username || !walletAddress}
            >
              Register
            </Button>
          </Box>
        )}
      </Paper>
      <SnackbarNotification
        open={snackbar.open}
        handleClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default AuthPage;