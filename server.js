require('dotenv').config({
    path: './configs/.env'
});

const server = require('./app');
const connectDB = require('./configs/db');

connectDB()

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});