'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: Sequelize.STRING,
      },
      passwordResetToken: {
        type: Sequelize.STRING,
      },
      passwordResetExpires: {
        type: Sequelize.DATE,
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      twoFactorSecret: {
        type: Sequelize.STRING,
      },
      loginAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      lockUntil: {
        type: Sequelize.DATE,
      },
      lastLogin: {
        type: Sequelize.DATE,
      },
      provider: {
        type: Sequelize.ENUM('local', 'google', 'github'),
        defaultValue: 'local',
      },
      providerId: {
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['verificationToken']);
    await queryInterface.addIndex('Users', ['passwordResetToken']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  },
};

