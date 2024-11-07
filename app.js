import express from 'express';
import {getUserByUsernameOrEmailAndPassword, createUser, getUserByUsernameOrEmail, getUserById, updateUserProfile, deleteUserById, getBlocks} from './database.js';
import jwt from 'jsonwebtoken';
import cors from 'cors'

const SECRET_KEY = 'your_secret_key'; // Use a strong secret key in production

const app = express();

// Use CORS middleware
app.use(cors());

app.use(express.json())

app.post("/users/signin", async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    console.log("Post : users/signin")

    // Check if username or email and password are provided
    if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: "Username or email and password are required." });
    }

    try {
        // Modify the user retrieval function to accept either username or email
        console.log(`End point request with user/email : ${usernameOrEmail} and pass : ${password}`)

        console.log(`hello`)

        const user = await getUserByUsernameOrEmailAndPassword(usernameOrEmail, password);
        console.log(`Found user : ${user}`)
        if (!user) {
            return res.status(401).json({ error: "Invalid username/email or password." });
        }
        const userId = user.id
        const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
        // Return user data (ensure sensitive data like password is not returned)
        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            token
            // Add any other fields you want to include in the response
        });
    } catch (error) {
        console.error('Error retrieving user: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.post("/users", async (req, res) => {
    const { username, password, email } = req.body;

    // Check for missing fields
    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password, and email are required." });
    }

    try {
        // Check if the username or email already exists
        const existingUser = await getUserByUsernameOrEmail(username, email);
        if (existingUser) {
            return res.status(409).json({ error: "Username or email already exists." });
        }

        // Proceed to create the user
        const newUser = await createUser( email, username, password );
        const token = jwt.sign({ userId:newUser.id }, SECRET_KEY, { expiresIn: '1h' });
        console.log(token)
        // Return the newly created user information
        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            token
            
        });
    } catch (error) {
        console.error('Error during signup: ', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});



app.get("/users/:id", async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(403).send('Forbidden');
        
        const userId = req.params.id; 

        // Check for missing fields
        if (!userId) {
            return res.status(400).json({ error: "Request missing parameters" });
        }

        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY); // Synchronous verification
        if (!decoded?.userId) {
            return res.status(401).json({ error: "Forbidden: badToken" });
        }
        
        if (decoded.userId != userId) {
            return res.status(409).json({ error: "Forbidden: you are not allowed to get this info" });
        }

        // get user data
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: `Aucun utilisateur pour l'id : ${id}`});
        }

        // Return the information
        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email,
            profilePic: user.profilePic
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).send('Invalid token'); // Handle JWT-specific errors
        }
        console.error('Error fetching profile Data: ', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


app.put("/users/:id", async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).send('Forbidden');
    const userId = req.params.id; 

    const userData  = req.body;

    if(!userData || userId != userData?.id){
        return res.status(409).json({ error: "Request missing userData" });

    }
    // Verify the token
    const decoded = jwt.verify(token, SECRET_KEY); // Synchronous verification
    if (!decoded?.userId) {
        return res.status(401).json({ error: "Forbidden: badToken" });
    }
    
    if (decoded.userId != userId) {
        return res.status(409).json({ error: "Forbidden: you are not allowed to get this info" });
    }
    try {
        // Check for missing fields
        if (!userData?.id || !userData?.username || !userData?.email || !userData?.profilePic) {
            return res.status(400).json({ error: "Request body missing parameters" });
        }

        // alter user data
        const user = await updateUserProfile(userData);
        if (!user) {
            return res.status(404).json({ error: `Error while updating data`});
        }

        // Return the information
        res.status(200).json({
            message:"Success"
        });
    } catch (error) {
        console.error('Error updating profile Data: ', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
app.delete("/users/:id", async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(403).send('Forbidden');
        
        const userId = req.params.id; 
        
        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY); // Synchronous verification
        if (!decoded?.userId) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
        
        if (decoded.userId != userId) {
            return res.status(403).json({ error: "Forbidden: you are not allowed to delete this user" });
        }

        const user = await deleteUserById(userId);
        if (!user) {
            return res.status(404).json({ error: `Aucun utilisateur pour l'id : ${id}`});
        }

        // Return the information
        res.status(200).json({
            message:"Success"
        });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).send('Invalid token'); // Handle JWT-specific errors
        }
        console.error('Error deleting user: ', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
app.post("/users/authenticate", async (req, res) => {
    
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(403).send('Forbidden');

        // Verify the token
        const decoded = jwt.verify(token, SECRET_KEY); // Synchronous verification
        if (!decoded?.userId) {
            return res.status(409).json({ error: "Forbidden: badToken" });
        }

    
        
        res.status(200).json({
            id: decoded.userId,
        });
    } catch (error) {
        console.error('Error during authenticate: ', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

