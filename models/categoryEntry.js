module.exports = function (sequelize, DataTypes) {
    var CategoryEntry = sequelize.define("CategoryEntry", {

        type: {
            type: DataTypes.ENUM('Fashion', 'Furniture', 'Home Goods', 'Misc'),
            allowNull: false
        },

        storeID: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Stores',
                key: 'id'
            }
        },

        qualityTotal: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        qualityAvg: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },

        quantityTotal: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        quantityAvg: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        },

        priceTotal: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },

        priceAvg: {
            type: DataTypes.FLOAT,
            defaultValue: 0
        }

    });

    CategoryEntry.belongsTo(Store);
    CategoryEntry.hasMany(Tag);

    return CategoryEntry;
};
