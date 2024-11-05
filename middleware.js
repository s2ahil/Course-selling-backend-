const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

//authentication middleware
function authenticateJwt(secret) {

   

    return (req, res, next) => {
       
        const token = req.headers.authorization?.split(" ")[1];
    
        if (token) {
            jwt.verify(token, secret, (err, user) => {
                if (err) {
                    console.log(err)
                    return res.status(403).json({ message: "Forbidden hai" });
                }
                req.user = user;
                next();
            });
        } else {
            res.status(401).json({ message: "Unauthorized" });
        }
    }

}


module.exports = { authenticateJwt };
