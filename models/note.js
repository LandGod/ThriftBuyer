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

    Note.belongsTo(CategoryEntry);
    Note.belongsTo(User);

    return Note;
};
