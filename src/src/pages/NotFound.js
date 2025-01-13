import React from "react";
import { Typography, Container, Box } from "@mui/material";

const NotFound = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Typography variant="h1" color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" color="textSecondary">
          Page Not Found
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound;