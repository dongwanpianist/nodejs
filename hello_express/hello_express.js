const port = process.env.SERVER_PORT;
const basepath = '/hello_express'

const express = require('express')
const bodyParser = require('body-parser')
const router = require('./routes')
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(basepath, router)

app.listen(port)