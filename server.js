const express = require('express');
const ejsLayouts = require('express-ejs-layouts');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'Public')));
app.use(express.urlencoded({ extended: true }));
app.use(ejsLayouts);

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dcewrum1y', 
    api_key: '347466237954442', 
    api_secret: 'rFlJrt5USFJ3ALSL7JLGq9e-7LQ', 
    secure: true,
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

app.use(ejsLayouts);


app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = '/' + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, '') : route.replace(/\/(.*)/, ''));
    app.locals.viewingCategory = req.query.category || null;
    next();
});

app.get('/', (req, res) => {
    res.redirect('/shop');
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us' });
});

app.get('/items/add', (req, res) => {
    res.render('addPost', { title: 'Add Item' });
});

app.get("/items", async (req, res) => {
    let viewData = {};

    try {
        let items = await storeService.getAllItems();  

        if (items && items.length > 0) {
            viewData.items = items;  
            res.render("items", viewData);  
        } else {
            viewData.message = "No results";  
            res.render("items", viewData);  
        }

    } catch (err) {
        viewData.message = "No results";  
        res.render("items", viewData);  
    }

    app.get('/shop', (req, res) => {
        res.render("shop", { 
            post: viewData.post, 
            items: viewData.posts 
        });
        });

});

app.get("/shop", async (req, res) => {
    // Declare an object to store properties for the view
    let viewData = {};
  
    try {
      // declare empty array to hold "item" objects
      let items = [];
  
      // if there's a "category" query, filter the returned items by category
      if (req.query.category) {
        // Obtain the published "item" by category
        items = await itemData.getPublishedItemsByCategory(req.query.category);
      } else {
        // Obtain the published "items"
        items = await itemData.getPublishedItems();
      }
  
      // sort the published items by itemDate
      items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
  
      // get the latest item from the front of the list (element 0)
      let item = items[0];
  
      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;
      viewData.item = item;
    } catch (err) {
      viewData.message = "no results";
    }
  
    try {
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();
  
      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
    } catch (err) {
      viewData.categoriesMessage = "no results";
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", { data: viewData });
  });


app.get('/shop/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
  
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned items by category
        if(req.query.category){
            // Obtain the published "items" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "items"
            items = await itemData.getPublishedItems();
        }
  
        // sort the published items by itemDate
        items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
  });

app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then(data => res.render('items', { title: 'Items', items: data }))
        .catch(err => res.status(500).render('404', { title: '404 Not Found' }));
});

app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then(data => res.render('categories', { title: 'Categories', categories: data }))
        .catch(err => res.status(500).render('404', { title: '404 Not Found' }));
});


const upload = multer(); 

app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) { 
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(stream); 
            });
        };

        async function upload(req) {
            let result = await streamUpload(req); 
            req.body.featureImage = result.url; 

            
            storeService.addItem(req.body)
                .then(() => {
                    res.redirect('/items'); 
                })
                .catch(err => {
                    console.error(err.message);
                    res.status(500).send("Item Processing Failed");
                });
        }
     
        upload(req); 
    } else {
        
        storeService.addItem(req.body)
            .then(() => {
                res.redirect('/items'); 
            })
            .catch(err => {
                console.error(err.message);
                res.status(500).send("Item Processing Failed");
            });
    }
});



app.get('/shop/:id', (req, res) => {
    storeService.getItemById(parseInt(req.params.id))
        .then(data => res.render('shop', { title: data.title, data: { post: data } }))
        .catch(err => res.status(404).render('404', { title: '404 Not Found' }));
});

// Handle unmatched routes (404)
app.use((req, res) => {
    res.status(404).render('404', { title: '404 Not Found' });
});

// Initialize the service and start the server
storeService.initialize()
       .then(() => {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error(err.message);
    });
