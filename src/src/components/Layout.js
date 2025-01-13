import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from "@mui/material";
import { Home, AddCircle, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const Layout = ({ children, isLoggedIn, onLogout }) => {
  const navigate = useNavigate();

  const handleAuthButtonClick = () => {
    if (isLoggedIn) {
      onLogout();
    } else {
      navigate("/");
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: "pointer" }}
            onClick={() => navigate("/view-cards")}
          >
            Card Marketplace
          </Typography>
          <Button color="inherit" startIcon={<Home />} onClick={() => navigate("/view-cards")}>
            Home
          </Button>
          <Button
            color="inherit"
            startIcon={<AddCircle />}
            onClick={() => (isLoggedIn ? navigate("/create-card") : navigate("/"))}
          >
            Create
          </Button>
          <Button
            color="inherit"
            startIcon={<Person />}
            onClick={() => (isLoggedIn ? navigate("/profile") : navigate("/"))}
          >
            Profile
          </Button>
          <Button color="inherit" onClick={handleAuthButtonClick}>
            {isLoggedIn ? "Logout" : "Accedi"}
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 2 }}>
        <Box>{children}</Box>
      </Container>
    </div>
  );
};

export default Layout;