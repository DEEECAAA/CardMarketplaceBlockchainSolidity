import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ViewCards from "./pages/ViewCards";
import CreateCard from "./pages/CreateCard";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";
import BuyCard from "./pages/BuyCard";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    const storedWalletAddress = localStorage.getItem("walletAddress");
    if (storedWalletAddress) {
      setIsLoggedIn(true);
      setWalletAddress(storedWalletAddress);
    }

    const handleAccountChange = (accounts) => {
      if (accounts.length === 0) {
        localStorage.removeItem("walletAddress");
        setIsLoggedIn(false);
        setWalletAddress(null);
        return;
      }

      if (isLoggedIn) {
        localStorage.setItem("walletAddress", accounts[0]);
        setWalletAddress(accounts[0]);
      } else {
      }
    };

    const handleNetworkChange = (chainId) => {
      setNetwork(chainId);
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChange);
      window.ethereum.on("chainChanged", handleNetworkChange);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountChange);
        window.ethereum.removeListener("chainChanged", handleNetworkChange);
      }
    };
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setWalletAddress(null);
    window.location.href = "/";
  };

  const handleLogin = () => {
    const walletAddress = localStorage.getItem("walletAddress");
    setIsLoggedIn(!!walletAddress);
    setWalletAddress(walletAddress);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <AuthPage onLogin={handleLogin} />
            </Layout>
          }
        />
        <Route
          path="/view-cards"
          element={
            <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <ViewCards />
            </Layout>
          }
        />
        <Route
          path="/create-card"
          element={
            isLoggedIn ? (
              <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <CreateCard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <ProfilePage />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/buy-card/:cardId"
          element={
            isLoggedIn ? (
              <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <BuyCard />
              </Layout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;