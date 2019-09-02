'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: Sequelize.INTEGER
      },
      username: {
        allowNull: false,
        type: Sequelize.STRING(50)
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING(100)
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('Jobs', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      source: {
        allowNull: false,
        type: Sequelize.STRING(2000)
      },
      startDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      endDate: {
        allowNull: false,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('Recordings', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: Sequelize.INTEGER
      },
      jobId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Job',
          key: 'id'
        }
      },
      mpdPath: {
        allowNull: true,
        type: Sequelize.STRING(100)
      },
      labels: {
        allowNull: true,
        type: Sequelize.STRING(100)
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING(50)
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('Tokens', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: Sequelize.INTEGER
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      token: {
        unique: true,
        allowNull: false,
        type: Sequelize.STRING(50)
      },
      timesUsed: {
        allowNull: true,
        type: Sequelize.INTEGER
      },
      unlimited: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      issuedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      renovatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      expiredAt: {
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface
      .dropTable('Recordings')
      .dropTable('Jobs')
      .dropTable('Tokens')
      .dropTable('Users')
  }
}
