const Sequelize = require('sequelize')
const sequelize = require('../utils/database')

const User = sequelize.define('User', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    type: Sequelize.INTEGER
  },
  userId: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  loggedIn: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
},
{
  timestamps: false
}
)

module.exports = User
