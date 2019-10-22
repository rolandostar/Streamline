'use strict'

module.exports = (sequelize, DataTypes) => {
  const Token = sequelize.define('Token', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
    },
    timesUsed: {
      allowNull: true,
      type: DataTypes.INTEGER
    }
  }, {
    timestamps: true,
    createdAt: 'issuedAt',
    updatedAt: 'renovatedAt'
  })

  return Token
}
