// Home.js
import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import { useUserAuth } from "../context/UserAuthContext";
import Feedback from "./Feedback";
import { FaSignOutAlt } from 'react-icons/fa';
import { Typography } from '@mui/material';

const Home = () => {
  const { logOut, user } = useUserAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <>
    <div className="container-fluid">
  <div className="row align-items-center">
    <div className="col">
      <Typography variant="h4" style={{ paddingLeft: '10px', paddingTop: '20px', marginBottom: '0' }}>Feedback and Voting System</Typography>
    </div>
    <div className="col-auto ml-auto">
      <div className="d-flex align-items-center">
        <Typography variant="body1" style={{ marginRight: '10px' }}>
          Welcome,&nbsp;
          {user && user.email && <span>{user.email.split('@')[0]}</span>}
        </Typography>
        <Button variant="text" onClick={handleLogout} className="text-primary">
          <FaSignOutAlt size={24} />
        </Button>
      </div>
    </div>
  </div>
</div>

<hr></hr>
      
      {/* Display SuggestionsList component */}
      
        <Feedback />
      
    </>
  );
};

export default Home;