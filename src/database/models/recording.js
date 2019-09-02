'use strict'

module.exports = (sequelize, DataTypes) => {
  const Recording = sequelize.define('Recording', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
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
    }
  }, {
    paranoid: true
  })

  Recording.associate = function (models) {
    Recording.belongsTo(models.Job)
  }

  return Recording
}
