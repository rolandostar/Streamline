'use strict'

module.exports = (sequelize, DataTypes) => {
  // FIXME Do not allow null for UserId
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
      type: DataTypes.DATE,
      allowNull: false
    },
    duration: {
      type: DataTypes.STRING(8),
      allowNull: true
    }
  }, {
    paranoid: true,
    updatedAt: false,
    deletedAt: 'executedAt'
  })

  Job.associate = function (models) {
    Job.belongsTo(models.User, { foreignKey: { allowNull: false } })
    Job.hasOne(models.Recording)
  }

  return Job
}
