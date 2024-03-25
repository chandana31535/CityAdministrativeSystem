import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; 
import { auth } from '../firebase'; 
import { Card, CardContent, Typography, TextField, Button, List, ListItem, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert } from '@mui/material';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt';
import {  InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';


function Feedback() {
  const [suggestions, setSuggestions] = useState([]);
  const [popularSuggestions, setPopularSuggestions] = useState([]);
  const [userVotes, setUserVotes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showComments, setShowComments] = useState(false);
  useEffect(() => {
    const fetchSuggestions = async () => {
      const suggestionsCollection = await firestore.collection('suggestions').get();
      const suggestionsData = suggestionsCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        comments: []
      }));
      setSuggestions(suggestionsData);
      // Update popular suggestions
      updatePopularSuggestions(suggestionsData);
     
    };
    fetchSuggestions();
  }, []);
  
  const updatePopularSuggestions = (suggestionsData) => {
    const sortedSuggestions = suggestionsData.slice().sort((a, b) => b.votes - a.votes);
    setPopularSuggestions(sortedSuggestions);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Fetch user's vote status
        fetchUserVotes(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserVotes = async (userId) => {
    const votesRef = await firestore.collection('votes').where('userId', '==', userId).get();
    const userVoteData = votesRef.docs.map(doc => doc.data().suggestionId);
    setUserVotes(userVoteData);
  };

  const hasVoted = (suggestionId) => {
    return userVotes.includes(suggestionId);
  };

  const handleVote = async (id, type) => {
    const userId = auth.currentUser.uid;

    // Check if the user has already voted for this suggestion
    if (hasVoted(id)) {
      setErrorMessage("You have already voted for this suggestion.");
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return;

    }

    const suggestionRef = firestore.collection('suggestions').doc(id);

    await firestore.runTransaction(async (transaction) => {
      const suggestionDoc = await transaction.get(suggestionRef);
      const votes = suggestionDoc.data().votes;

      // Update votes count in the suggestion document
      await transaction.update(suggestionRef, { votes: type === 'upvote' ? votes + 1 : votes - 1 });

      // Add a vote document to track the user's vote
      await firestore.collection('votes').add({ userId, suggestionId: id });
      
      // Update the local state to reflect the updated vote count
    setSuggestions(prevSuggestions => {
      return prevSuggestions.map(suggestion => {
        if (suggestion.id === id) {
          return {
            ...suggestion,
            votes: type === 'upvote' ? suggestion.votes + 1 : suggestion.votes - 1
          };
        }
        return suggestion;
      });
    });
    });
     // Update popular suggestions after voting
     updatePopularSuggestions(suggestions);
  };

  const handleDownvote = async (id) => {
    const userId = auth.currentUser.uid;

    // Check if the user has already voted for this suggestion
    if (hasVoted(id)) {
      console.log("You have already voted for this suggestion.");
      return;
    }

    const suggestionRef = firestore.collection('suggestions').doc(id);

    await firestore.runTransaction(async (transaction) => {
      const suggestionDoc = await transaction.get(suggestionRef);
      const votes = suggestionDoc.data().votes;
  
      // Update votes count in the suggestion document
      await transaction.update(suggestionRef, { votes: type === 'upvote' ? votes + 1 : votes - 1 });
  
      // Add a vote document to track the user's vote
      await firestore.collection('votes').add({ userId, suggestionId: id });
    });
  
    // Update userVotes state to reflect the user's vote immediately after the transaction completes
    setUserVotes(prevUserVotes => [...prevUserVotes, id]);
  };

  const handleAddComment = async (suggestionId, commentText) => {
    if (commentText.trim() !== '') {
      const commentRef = firestore.collection('suggestions').doc(suggestionId).collection('comments').doc();
      await commentRef.set({ text: commentText });
      fetchSuggestions();
    }
  };

  const handleShowComments = async (index) => {
    const suggestionId = suggestions[index].id;
    
    // Check if comments are already loaded
    if (suggestions[index].comments.length > 0) {
      // If comments are already loaded, clear them to hide them
      const updatedSuggestions = [...suggestions];
      updatedSuggestions[index].comments = [];
      setSuggestions(updatedSuggestions);
    } else {
      // If comments are not loaded, fetch and display them
      const commentsCollection = await firestore.collection('suggestions').doc(suggestionId).collection('comments').get();
      const commentsData = commentsCollection.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const updatedSuggestions = [...suggestions];
      updatedSuggestions[index].comments = commentsData;
      setSuggestions(updatedSuggestions);
    }
  };
  

  return (
    <>
    {errorMessage && (
        <Alert severity="error" sx={{ marginBottom: '20px' }}>
          {errorMessage}
        </Alert>
      )}
    <div>
    {/* <h2 style={{ textAlign: 'center' }}>Feedback and Voting System</h2> */}

      <div style={{ paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', margin: '0 auto', maxWidth: 'calc(100% - 40px)' }}>
      <Grid container spacing={3}>
        {suggestions.map((suggestion, index) => (
          <Grid item xs={12} sm={6} md={4} key={suggestion.id}>
            <Card style={{ marginBottom: '20px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {suggestion.text}
                </Typography>
                <Typography variant="body6" gutterBottom>
                  {suggestion.description}
                </Typography>
                <Typography variant="subtitle1">
                  Votes: {suggestion.votes}
                </Typography>
                <Button onClick={() => handleVote(suggestion.id, 'upvote')}><ThumbUpOffAltIcon style={{ color: 'green' }} /></Button>
              
                <TextField
                label="Add Comment"
                variant="outlined"
                value={suggestion.newComment || ''}
                onChange={(e) => {
                  const updatedSuggestions = [...suggestions];
                  updatedSuggestions[index].newComment = e.target.value;
                  setSuggestions(updatedSuggestions);
                }}
                fullWidth
                style={{ marginTop: '10px' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button onClick={() => {
                        handleAddComment(suggestion.id, suggestion.newComment);
                        // Reset the value of suggestion.newComment after adding the comment
                        const updatedSuggestions = [...suggestions];
                        updatedSuggestions[index].newComment = '';
                        setSuggestions(updatedSuggestions);
                      }}>
                        <SendIcon />
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
                {/* <Button onClick={() => handleAddComment(suggestion.id, suggestion.newComment)}>Add Comment</Button> */}
                 <Button onClick={() => handleShowComments(index)}> {showComments ? "Hide Comments" : "Show Comments"}</Button>
                {suggestion.comments.length > 0 && (
                  <List>
                    {suggestion.comments.map(comment => (
                      <ListItem key={comment.id}>{comment.text}</ListItem>
                    ))}
                  </List>
                )} 
              
              {/* <Button onClick={handleShowComments}>
                      {showComments ? "Hide Comments" : "Show Comments"}
                    </Button>
                    {showComments && (
                      <List>
                        {suggestion.comments.map(comment => (
                          <ListItem key={comment.id}>{comment.text}</ListItem>
                        ))}
                      </List>
                    )} */}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>

      <Typography variant="h4" gutterBottom  style={{ textAlign: 'center' }}>
        Popular Suggestions
      </Typography>
      <TableContainer component={Paper} style={{ width: '80%', margin: 'auto' }}>
        <Table>
          <TableHead>
          <TableRow>
          <TableCell>
          <Typography variant="subtitle1" fontWeight="bold" textTransform="uppercase">
                            Suggestion
          </Typography>
          </TableCell>
          <TableCell align="right">
          <Typography variant="subtitle1" fontWeight="bold" textTransform="uppercase">
                            Votes
          </Typography>
          </TableCell>
          </TableRow>
          </TableHead>
          <TableBody>
                      {popularSuggestions.map((suggestion, index) => (
          <TableRow key={suggestion.id}>
          <TableCell>{suggestion.text}</TableCell>
          <TableCell align="right">{suggestion.votes}</TableCell>
          </TableRow>
                      ))}
          </TableBody>
        </Table>
      </TableContainer>
</div>
</>
  );
}
 
export default Feedback;
