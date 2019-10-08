module.exports = function (sequelize, DataTypes) {
    var Store = sequelize.define("Store", {

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        address: {
            type: DataTypes.STRING,
            allowNull: false
        },

        hasFashion: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        hasFurniture: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        hasHomeGoods: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },

        hasMisc: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }

    });

    Store.associate = models => {

        Store.hasMany(models.CategoryEntry);
    };



    return Store;
};
