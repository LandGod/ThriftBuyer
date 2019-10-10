module.exports = function (sequelize, DataTypes) {
    var Tag = sequelize.define("Tag", {

        tagText: {
            type: DataTypes.TEXT
        },
        ratingTotal: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        ratingAvg : {
            type: DataTypes.FLOAT,
            defaultValue: 0
        }
    });

    Tag.associate = models => {

        Tag.belongsTo(models.CategoryEntry);
        Tag.belongsTo(models.User);
    };



    return Tag;
};
