const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// register controller
const registerUser = async(req,res) => {
    try {
    //1. extract user information from our request body
        // content (req.body) should be as in schema
        const {username, email, password, role} = req.body;

     //2. Check if user already exists in the database
        const checkExistingUser = await User.findOne({$or: [{username}, {email}]});
        if(checkExistingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

    //3. Hash User Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
     
    //4. create a new user and save in database
        const newlyCreatedUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || "user"
        });

        await newlyCreatedUser.save();

        if(newlyCreatedUser){
            res.status(201).json({
                success:true,
                message: "User created successfully",
                data: newlyCreatedUser
            });
        } else{
             res.status(400).json({
                success: false,
                message: "Unable to register user, please try again",
                
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "something went wrong"
        });

    }
}

// login controller
const loginUser = async(req,res) => {
    try {
    //1. extract username and password from req.body
    if (!req.body) {
        return res.status(400).json({
            success: false,
            message: "Request body is missing"
        });
    }
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: "Username and password are required"
        });
    }

    // 2. check if user exists in db
    const user = await User.findOne({username});

    if(!user){
        return res.status(400).json({
            success: false,
            message: `User doesn't exist`
        });
    }
    // 3. check if password is correct or not
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if(!isPasswordMatch){
        return res.status(400).json({
            success: false,
            message: "Invalid credentials"
        });
    }

    // 4. create user token required after login
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username,
        role: user.role
    }, process.env.JWT_SECRET_kEY,{
        expiresIn: "15m"
    })

    res.status(200).json({
        success: true,
        message: "Logged in successfuly",
        accessToken
    })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "something went wrong"
        });

    }
}

// change password controller
const changePassword = async(req,res) => {
    try {
        // get userId of logged in user from middleware
        const userId = req.userInfo.userId;
        
        // extract old and new password
        const {oldPassword, newPassword} = req.body;

        // find the current logged in user
        const user = await User.findById(userId);

        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found"
            });
        }

        // check if the old password is correct
        const isPassword = await bcrypt.compare(oldPassword, user.password);
        if(!isPassword){
            return res.status(400).json({
                success: false,
                message: "old Password is not correct"
            });
        }

        // hash the new password here
        const salt = await bcrypt.genSalt(10)
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // update user password
        user.password = newHashedPassword;
        await user.save();

        res.status(201).json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "something went wrong"
        });
    }
}
module.exports = {registerUser, loginUser, changePassword};