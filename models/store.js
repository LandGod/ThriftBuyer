module.exports = function (sequelize, DataTypes) {
    var Store = sequelize.define("Store", {

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        address: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
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

    // Hooks that automatically add applicable CategoryEntrys on store create
    Store.addHook('afterCreate', (store) => {

        if (store.hasFurniture) {
            return sequelize.models.CategoryEntry.create({
                StoreId: store.id,
                type: 'furniture'
            })
        }
    })

    Store.addHook('afterCreate', (store) => {
        if (store.hasFashion) {
            return sequelize.models.CategoryEntry.create({
                StoreId: store.id,
                type: 'fashion'
            })
        }
    })

    Store.addHook('afterCreate', (store) => {
        if (store.hasMisc) {
            return sequelize.models.CategoryEntry.create({
                StoreId: store.id,
                type: 'misc'
            })
        }
    })

    Store.addHook('afterCreate', (store) => {
        if (store.hasHomeGoods) {
            return sequelize.models.CategoryEntry.create({
                StoreId: store.id,
                type: 'home goods'
            })
        }
    })

    return Store;
};
