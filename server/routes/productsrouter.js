const express = require('express');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root:@localhost:3306/delilahresto');
const router = express.Router();

const validations = require('./uservalidation');

router.get('/', validations.verifyToken, (req,res)=>{
    const SelectQuery = 'SELECT * FROM products';

    sequelize.query(SelectQuery, {type:sequelize.QueryTypes.SELECT})
        .then((response)=>{
            res.json(response);
        }).catch((e)=>console.log(e));
})

router.post('/',validations.verifyToken,validations.isAdmin,fullData,(req,res)=>{
    const InsertQuery = 'INSERT INTO products(product_name,product_price) VALUES (?,?)';
    const {product_name, product_price} = req.body;
    sequelize.query(InsertQuery,{replacements:[product_name,product_price]})
        .then((response)=>{
            res.status(201).json({status: 'Created', products:req.body})
        }).catch((e)=>console.error(e));
})

router.put('/:product_id',validations.verifyToken,validations.isAdmin,DoesProductExist,(req,res)=>{
    const id = req.params.product_id;
    const {product_name,product_price} = req.body;
    const UpdateQuery = `UPDATE products SET product_name= ?, product_price=? WHERE product_id = ${id}`

    sequelize.query(UpdateQuery, {replacements:[product_name,product_price]})
        .then((response)=>{
            res.json({status: 'Updated', products:req.body})
        }).catch((e)=>console.error(e))
})

router.delete('/:product_id', validations.verifyToken,validations.isAdmin, DoesProductExist,(req,res)=>{
    const product_id = req.params.product_id;
    const DeleteQuery = `DELETE FROM products WHERE product_id=${product_id}`

    sequelize.query(DeleteQuery)
    .then((response)=>{
        res.json({status:'Deleted',DeleteQuery})
    }).catch((e)=>console.error(e))
})

function fullData(req, res, next) {
    const {product_name, product_price} = req.body;

    if (!product_name || !product_price ) {
        res.status(400).send('Data are missing');
    } else {
        next();
    }
}

function DoesProductExist(req,res,next){
    const product_id = req.params.product_id;
    const SelectQuery = 'SELECT * FROM products'

    sequelize.query(SelectQuery,{type:sequelize.QueryTypes.SELECT})
        .then((response)=>{
            const products_list = response;
            const product = products_list.find( (element) => element.product_id === Number(product_id));

            if (!product){
                return res.status(404).send('Not found')
            }else{
                next();
            }
            
        }).catch((e)=>console.log(e));
}

module.exports = router
