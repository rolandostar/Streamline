'use strict'

const chance = require('chance')()
const bcrypt = require('bcrypt')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      primaryKey: true,
      allowNull: false,
      type: DataTypes.UUID,
      defaultValue: chance.guid()
    },
    username: {
      allowNull: false,
      type: DataTypes.STRING(50)
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING(100)
    }
  }, {
    paranoid: true,
    updatedAt: false
  })

  User.associate = function (models) {
    User.hasMany(models.Token)
  }

  User.generateHash = (password) => bcrypt.hashSync(password, bcrypt.genSaltSync(8))
  User.prototype.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
  }

  return User
}
