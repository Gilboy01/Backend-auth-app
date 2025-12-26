const jwt = require("jsonwebtoken");
//To protect routes that have to only be accessed after correct login

const authMiddleware = (req,res,next) => {
// headers contain different properties including authorization (Bearer Token-phrase)  
const authHeader = req.headers["authorization"];
console.log( authHeader);

// authHeader contains space between bearer and token itself
// the && is used to check if it exists
const token = authHeader && authHeader.split(" ")[1];
if(!token){
  return res.status(401).json({
    success: false,
    message: "Access denied. No token provided. Please login to continue"
    });
 }

    // decode token (get user info from token in auth controller accessed through header)
    try {
    const decodedTokenInfo = jwt.verify(token, process.env.JWT_SECRET_kEY);
    console.log(decodedTokenInfo);

    //this decoded info can be passed to other middleware
    //includes userId, username, role and expiry date  
    req.userInfo = decodedTokenInfo;

    next();
} catch (error) {
    return res.status(500).json({
    success: false,
    message: "Access denied. No token provided. Please login to continue"
    });
 }
    
};

module.exports = authMiddleware;