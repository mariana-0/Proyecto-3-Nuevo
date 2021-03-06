const express = require('express');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://root:@localhost:3306/delilahresto');
const router = express.Router();
const validations = require('./uservalidation');
const ordervalidations = require('./ordersvalidation');

router.get('/',validations.verifyToken,validations.isAdmin,(req,res)=>{
    const SelectJoinQuery = 'SELECT orders.*, users.user_name, users.user_lastname, users.user_address FROM orders JOIN users ON orders.id_user = users.user_id';

    sequelize.query(SelectJoinQuery, {type:sequelize.QueryTypes.SELECT})
        .then((response)=>{
            res.json(response);
        }).catch((e)=>console.log(e));
})

router.get('/:order_id',validations.verifyToken,validations.isAdminOrder,ordervalidations.DoesOrderExist,(req,res)=>{
    const id = req.params.order_id;
    const SelectJoinQuery =  `SELECT orders.order_total_paid, orders.order_status, orders.order_payment_method, users.user_address, users.user_name, users.user_lastname, users.user_user, users.user_email, users.user_phone_number FROM orders
    INNER JOIN users ON orders.id_user = users.user_id WHERE order_id = ${id}`;

    sequelize.query(SelectJoinQuery, {type:sequelize.QueryTypes.SELECT})
        .then((response)=>{
            const [OrderDetails] = response
            const Select2JoinQuery = `SELECT products.product_name, products.product_price, order_products.quantity_product 
            FROM order_products
            INNER JOIN products ON products.product_id = order_products.id_product WHERE id_order = ${id} `
            sequelize.query(Select2JoinQuery,{type:sequelize.QueryTypes.SELECT})
                .then((respo)=>{
                    OrderDetails[0] = respo;
                    res.json(OrderDetails)
                })
            
        }).catch((e)=>console.log(e));
})

router.post('/',validations.verifyToken,ordervalidations.VerifyUser,ordervalidations.VerifyProducts,(req,res)=>{
    const InsertQuery = 'INSERT INTO orders (order_status,order_time,order_description,order_payment_method,order_total_paid,id_user) VALUES (?,?,?,?,?,?)'
    const {order_payment_method,items,id_user} = req.body
    const{order_total_paid} = req
    const {order_description} = req
    const time = new Date ();
    const order_time = time.getHours()+':'+time.getMinutes()+':'+time.getSeconds();
    const order_status = 'New';

    sequelize.query(InsertQuery,{replacements:[order_status, order_time, order_description, order_payment_method, order_total_paid, id_user]})
        .then((response)=>{
            const [order_id]=response
            const InsertQueryP = 'INSERT INTO order_products (id_order, id_product, quantity_product) VALUES (?,?,?)'
            items.forEach(element => {
                sequelize.query(InsertQueryP,{replacements:[order_id,element.id_product,element.quantity_product]})
            });
            res.status(201).send('Order added')
        }).catch((e)=>{console.error(e)})

});

router.put('/:order_id',validations.verifyToken,validations.isAdmin,ordervalidations.DoesOrderExist,(req,res)=>{
    const id = req.params.order_id;
    const {order_status}=req.body;

    const UpdateQuery = `UPDATE orders SET order_status= ? WHERE order_id = ${id}`

    sequelize.query(UpdateQuery, {replacements:[order_status]})
        .then((response)=>{
            res.status(201).send('Updated')
        }).catch((e)=>console.error(e))
})

router.delete('/:order_id', validations.verifyToken,validations.isAdmin, ordervalidations.DoesOrderExist,(req,res)=>{
    const order_id = req.params.order_id;
    const DeleteQuery = `DELETE FROM order_products WHERE id_order=${order_id}`

    sequelize.query(DeleteQuery)
    .then((response)=>{
        const DeleteQueryO = `DELETE FROM orders WHERE order_id=${order_id}`
        sequelize.query(DeleteQueryO)
        res.status(200).send('Deleted')
    }).catch((e)=>console.error(e))
})


module.exports = router
