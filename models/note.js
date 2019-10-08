module.exports = function (sequelize, DataTypes) {
    var Note = sequelize.define("Note", {

        quality: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        quantity: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        price: {
            type: DataTypes.TINYINT,
            allowNull: false,
            defaultValue: 0
        },
        textNote: {
            type: DataTypes.TEXT
        }

    });

    Note.associate = models => {

        Note.belongsTo(models.CategoryEntry);
        Note.belongsTo(models.User);
    };

    return Note;
};
