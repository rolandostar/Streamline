'use strict'

module.exports = (sequelize, DataTypes) => {
  const Recording = sequelize.define('Recording', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
    },
    title: {
      allowNull: false,
      type: DataTypes.STRING(100)
    },
    mpdPath: {
      allowNull: true,
      type: DataTypes.STRING(100)
    },
    labels: {
      allowNull: true,
      type: DataTypes.STRING(100)
    },
    status: {
      allowNull: false,
      type: DataTypes.STRING(50)
    },
    dirName: {
      allowNull: true,
      type: DataTypes.STRING(100)
    }
  }, {
    paranoid: true,
    updatedAt: false
  })

  Recording.associate = function (models) {
    Recording.belongsTo(models.Job, { foreignKey: { allowNull: false } })
    Recording.belongsTo(models.User, { foreignKey: { allowNull: false } })
  }

  return Recording
}
