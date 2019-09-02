'use strict'

module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define('Job', {
    id: {
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      type: DataTypes.INTEGER
    },
    source: {
      allowNull: false,
      type: DataTypes.STRING(2000)
    },
    startDate: {
      allowNull: false,
      type: DataTypes.DATE
    },
    endDate: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    paranoid: true
  })

  Job.associate = function (models) {
    Job.belongsTo(models.User)
  }

  return Job
}
