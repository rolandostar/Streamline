'use strict'

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
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
    paranoid: true
  })

  User.associate = function (models) {
    User.hasMany(models.Token)
  }

  return User
}
