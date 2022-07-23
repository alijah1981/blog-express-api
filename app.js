const express = require('express')
const routes = require('./routes/routes')
const sequelize = require('./utils/database')
const cors = require("cors")
const config = require('config')

const app = express()

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

const corsOptions = {
  origin: config.get('cors_origin')
}

app.use(cors(corsOptions))

app.use(function(req, res, next) {
  try {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    )
  } catch (e) {
    console.log(e)
  }

  next()
})

app.use('/api/', routes)

const HOST = config.get('app_host')
const PORT = process.env.PORT || config.get('app_port')

async function start() {
  try {
    // await sequelize.sync({force: true}) // для очистки таблиц
    await sequelize.sync()
    app.listen(PORT, HOST, () => {
      console.log(`listening on ${HOST}:${PORT}`)
    })
  } catch (e) {
    console.log(e)
  }
}

start()
