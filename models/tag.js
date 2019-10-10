module.exports = function (sequelize, DataTypes) {
    var Tag = sequelize.define("Tag", {

        tagText: {
            type: DataTypes.TEXT
        }
    });

    Tag.associate = models => {

        Tag.belongsTo(models.CategoryEntry);
        Tag.belongsTo(models.User);
    };



    return Tag;
};
