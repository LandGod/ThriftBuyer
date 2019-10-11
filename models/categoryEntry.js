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

    /* 
    The way that searches are currently being handled is to search for all possible query parameters and just set
     those parameters to wildcard if the user has not specified anything.
     Because of this, if a particular category had no tags at all, it would never show up in any search, because
     no tag is still not the same a any tag. The workaround for this is to simply add a default tag to each category
     as soon as its created. Then, we'll simply filter out that particular tag when showing tags to users.

     A more elegent solution would be to simply make the tag parameter not matter if it was undefined in the search query,
     but I can't figure out an easy way to do that right now and I only have just over 1 more week to finish thise whole
     project, so here we are. 
     
     TODO: In the far far distant future, if I'm still maintaining this project, I should install some sort of check that 
     makes sure no category ever has zero tags. Alternately, I could keep that possibility as a feature and use deleting 
     the default tag as a way to delist stores from the search results if that ever becomes a feautre we want.
    */
    CategoryEntry.addHook('afterCreate', (categoryEntry) => {
        return sequelize.models.Tag.create({
            CategoryEntryId: categoryEntry.id,
            tagText: 'DEAFULTTAG-DONOTDELET',
            ratingTotal: 999,
            ratingAvg: 999
        })
    });

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
