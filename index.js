const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();

// Configure MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ecom'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to the database.');
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('layout/main');
});

app.get('/categories/create', (req, res) => {
    res.render('category/create');
});

app.post('/categories/create', (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO categories (name) VALUES (?)';

    connection.query(sql, [name], (err, result) => {
        if (err) {
            return res.status(500).send('Error creating category');
        }
        res.redirect('/categories');
    });
});

app.post('/categories/edit/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const query = 'UPDATE categories SET name = ? WHERE id = ?';
    connection.query(query, [name, id], (err, results) => {
        if (err) {
            return res.status(500).send('Error updating category');
        }
        res.redirect('/categories');
    });
});

app.get('/categories', (req, res) => {
    connection.query('SELECT * FROM categories', (err, results) => {
        const data = JSON.parse(JSON.stringify(results));
        if (err) {
            return res.status(404).send('Error Getting Category.');
        }
        res.render('category/index', { cat: data });
    });
});

app.get('/categories/edit/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM categories WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).send('Error retrieving category');
        }
        if (results.length === 0) {
            return res.status(404).send('Category not found');
        }
        const data = JSON.parse(JSON.stringify(results));
        res.render('category/edit', { cat: data[0] });
    });
});

app.get('/categories/delete/:id', (req, res) => {
    const categoryId = req.params.id;
    const sql = 'DELETE FROM categories WHERE id = ?';
    connection.query(sql, [categoryId], (err, result) => {
        if (err) {
            return res.status(500).send('Error deleting category');
        }
        res.redirect('/categories');
    });
});

app.post('/products/create', (req, res) => {
    const { productName } = req.body;
    const { category } = req.body;
    const sql = 'INSERT INTO product (productname, category_id) VALUES (?, ?)';

    connection.query(sql, [productName, category], (err, result) => {
        if (err) {
            return res.status(500).send('Error creating category');
        }
        res.redirect('/products');
    });
});

app.get('/products/create', (req, res) => {
    connection.query('SELECT * FROM categories', (err, results) => {
        const data = JSON.parse(JSON.stringify(results));
        if (err) {
            return res.status(404).send('Error Getting Category.');
        }
        res.render('product/create', { cat: data });
    });
});

app.post('/products/edit/:id', (req, res) => {
    const { id } = req.params;
    const { productName, category } = req.body;

    const query = 'UPDATE product SET productname = ?, category_id = ? WHERE id = ?';
    connection.query(query, [productName, category, id], (err, results) => {
        if (err) {
            return res.status(500).send('Error updating category');
        }
        res.redirect('/products');
    });
});

app.get('/products/edit/:id', (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM product WHERE id = ?';

        connection.query(query, [id], (err, productResults) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error retrieving category');
            }
            if (productResults.length === 0) {
                return res.status(404).send('Product not found');
            }
            const pro = JSON.parse(JSON.stringify(productResults));
            connection.query('SELECT * FROM categories', (err, catResults) => {
                if (err) {
                    return res.status(404).send('Error Getting Category.');
                }
                const cat = JSON.parse(JSON.stringify(catResults));
                res.render('product/edit', { product: pro[0], category: cat });
            });

        });
    } catch (error) {
        console.log(error);
    }

});

app.get('/products/delete/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'DELETE FROM product WHERE id = ?';
    connection.query(sql, [productId], (err, result) => {
        if (err) {
            return res.status(500).send('Error deleting category');
        }
        res.redirect('/products');
    });
});

app.get('/products', (req, res) => {
    const page = parseInt(req.query.page) || 1; // Current page number
    const pageSize = parseInt(req.query.pageSize) || 10; // Number of records per page

    const offset = (page - 1) * pageSize; // Offset for SQL query

    // Query to retrieve a subset of products based on the page number and size
    const query = `
    SELECT product.id, product.productname, categories.name, categories.id FROM product LEFT JOIN categories on product.category_id = categories.id
      ORDER BY product.id
      LIMIT ? OFFSET ?
    `;

    connection.query(query, [pageSize, offset], (err, results) => {
        if (err) {
            console.error('Error fetching products: ', err);
            return;
        }

        // Get total number of products for pagination
        const countQuery = 'SELECT COUNT(*) AS total FROM product';
        connection.query(countQuery, (countErr, countResult) => {
            if (countErr) {
                console.error('Error fetching total product count: ', countErr);
                return;
            }

            const totalProducts = countResult[0].total;
            const totalPages = Math.ceil(totalProducts / pageSize);

            res.render('product/index', {
                products: results,
                currentPage: page,
                totalPages: totalPages,
                pageSize: pageSize
            });
        });
    });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
