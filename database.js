import mysql from 'mysql2';
import dotenv from 'dotenv';


// -----------------------------------------          Config          ----------------------------------------------

dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()


// -----------------------------------------         Queries         ----------------------------------------------


export async function getUserByUsernameOrEmailAndPassword(usernameOrEmail, password) {
    //DEBUG
    console.log(`Database : get user with username/email : ${usernameOrEmail} and password : ${password}`)
    //
    const [users] = await pool.query(`SELECT * FROM users WHERE (username=? OR email=?) AND password=?;`,[usernameOrEmail,usernameOrEmail,password])
    
    
    return users[0];
} 

export async function getUserByUsernameAndPassword(username, password){
    //DEBUG
    console.log(`Database : get users with username: ${username} and password : ${password}`)
    //
    const [rows] = await pool.query(`SELECT * FROM users WHERE username=? and password=?`,[username,password])
    return rows[0]
}

getUserByUsernameOrEmail

export async function getUserByUsernameOrEmail(username, email){
    //DEBUG
    console.log(`Database : get users with username: ${username} OR email : ${email}`)
    //
    const [rows] = await pool.query(`SELECT * FROM users WHERE username=? OR email=?`,[username,email])
    return rows[0]
}
export async function createUser(email, username, password){
    //DEBUG
    console.log(`Database : creating user with email: ${email}, username: ${username} and password : ${password}`)
    //
    const querry = await pool.query(`INSERT INTO users (username,email,password) VALUES (?,?,?);`,[username,email,password])
    const [rows] = await pool.query(`SELECT id, username, email FROM users WHERE username=? and email=?`,[username,email])
    return rows[0]
}


// -----------------------------------------          Tests          ----------------------------------------------
//DEBUG
// const user = await createUser("drago123@gmail.com","Drago Malefoy", 'bully');
// console.log(user)