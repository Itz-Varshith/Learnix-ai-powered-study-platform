export const loginUser = (req, res) => {
  // If request reaches here, middleware has already verified the user
  const { uid, email } = req.user;
  
  console.log(`User logged in: ${email}`);
  return res.status(200).json({ 
    message: "User is authenticated", 
    uid,
    email 
  });
};