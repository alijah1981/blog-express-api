const Sequelize = require('sequelize')
const sequelize = require('../utils/database')

const Post = sequelize.define('Post', {
  id: {
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    type: Sequelize.INTEGER
  },
  postType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  userId: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = Post
