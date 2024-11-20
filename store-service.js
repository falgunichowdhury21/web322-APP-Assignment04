const fs = require('fs').promises;
const path = require('path');
const dataFilePath = path.join(__dirname, 'data', 'items.json'); 

let items = [];
let categories = [];


async function initialize() {
    try {
        const itemsData = await fs.readFile('./data/items.json', 'utf8');
        items = JSON.parse(itemsData);
        const categoriesData = await fs.readFile('./data/categories.json', 'utf8');
        categories = JSON.parse(categoriesData);
    } catch (err) {
        throw new Error("Unable to read files");
    }
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            return reject("No items found");
        }
        resolve(items);
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            return reject("No categories found");
        }
        resolve(categories);
    });
}


function getItemById(id) {
    return new Promise((resolve, reject) => {
        const foundItem = items.find(item => item.id === id);
        if (!foundItem) {
            return reject("No item found with the given ID");
        }
        resolve(foundItem);
    });
}

function addItem(itemData) {
    return new Promise((resolve) => {
        
        itemData.id = items.length + 1;
        const currentDate = new Date();
        itemData.postDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;

        items.push(itemData);

        resolve(itemData);
    });
}


const getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        getAllItems()
            .then(items => {
            
                const publishedItems = items.filter(item => item.published === true);
                resolve(publishedItems);
            })
            .catch(err => reject(err));
    });
};

const getPublishedItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        getAllItems()
            .then(items => {
                
                const filteredItems = items.filter(item => item.published === true && item.category === category);
                resolve(filteredItems);
            })
            .catch(err => reject(err));
    });
};


module.exports = {
    initialize,
    getAllItems,
    getCategories,
    getItemById,
    addItem,
    getPublishedItems,
    getPublishedItemsByCategory,
};
