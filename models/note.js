module.exports = function (sequelize, DataTypes) {
    var Note = sequelize.define("Note", {

        quality: {
            type: DataTypes.TINYINT,
        },
        quantity: {
            type: DataTypes.TINYINT,
        },
        price: {
            type: DataTypes.TINYINT,
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
