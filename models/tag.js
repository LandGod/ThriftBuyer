module.exports = function (sequelize, DataTypes) {
    var Tag = sequelize.define("Tag", {

        tagText: {
            type: DataTypes.TEXT
        }
    });

    Tag.belongsTo(CategoryEntry);

    return Tag;
};
