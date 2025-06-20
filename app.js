const express = require('express');
const app = express();
const cors = require('cors');

const server = require('http').createServer(app);

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const api_version = '/api/v1';

app.use(`${api_version}/users`, require('./routes/user.routes'));
app.use(`${api_version}/location-reports`, require('./routes/location_report.routes'));
app.use(`${api_version}/aws`, require('./routes/aws.routes'));

module.exports = server;