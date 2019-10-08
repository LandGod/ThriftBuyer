module.exports = function (sequelize, DataTypes) {
    var CategoryEntry = sequelize.define("CategoryEntry", {

        type: {
            type: DataTypes.ENUM('fashion', 'furniture', 'home goods', 'misc'),
            allowNull: false
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

    CategoryEntry.associate = models => {

        CategoryEntry.belongsTo(models.Store);
        CategoryEntry.hasMany(models.Tag);
    };



    return CategoryEntry;
};

// material.associate = models => {
//     // material.hasMany(models.parts, {
//     //     through: “”
//     // onDelete: “cascade”
//     // });
//     material.belongsTo(models.materialInventory, {
//         onDelete: “cascade”
//     });
//     material.belongsTo(models.materialType, {
//         onDelete: “cascade”
//     });
//     material.belongsTo(models.materialPurchased, {
//         onDelete: “cascade”
//     });
//     material.belongsTo(models.location, {
//         onDelete: “cascade”
//     });
// }
// return material;
//  };
