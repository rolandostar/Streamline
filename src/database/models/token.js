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
    },
    unlimited: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    paranoid: true,
    createdAt: 'issuedAt',
    updatedAt: 'renovatedAt',
    deletedAt: 'expiredAt'
  })

  return Token
}
