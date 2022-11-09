/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

let { Contract } = require('fabric-contract-api');
let { ClientIdentity } = require('fabric-shim');
// let { TokenERC20Contract } = require('./token-erc-20/chaincode-javascript/lib/tokenERC20.js')
let productionStock = 'stock'
let orderNumber = 'orderNumber'
let Status = ['order-placed', 'in-transit', 'delivered', 'payout-claimed', 'cancelled']
let manufacturerFunds = 'MANUFACTURER_BALANCE'
let producerFunds = 'PRODUCER_BALANCE'
let pricePerKg = 100 // 100$ for 1 kg coffee

class PmCc extends Contract {

    // initializes the stock of the producer to a set amount and also initializes the erc20 token contract
    async init(ctx, initialStock) {
        await ctx.stub.putState(manufacturerFunds, Buffer.from('1000000'));
        console.log('Balance of tataMSP initialized to 1000000 $');

        console.log('Balance of teafarmMSP initialized to 0 $');
        await ctx.stub.putState(producerFunds, Buffer.from('1000000'));

        await ctx.stub.putState(productionStock, Buffer.from(initialStock));
        console.log("Production Stock Initailized to "+initialStock);
    }

    // this function updates the stock in production.
    async updateProductionStock(ctx, amtInKg, flag) {
        // let clientMSPID = await ctx.clientIdentity.getMSPID();
        // if (clientMSPID !== 'teafarmMSP') {
        //     throw new Error('only producer can update stock')
        // }

        // Fetching current stock
        let currentStockBytes = await ctx.stub.getState(productionStock);
        let updatedStock = 0;
        let currentStock = parseInt(currentStockBytes.toString()) //get current stock in production
        
        // if (flag == 0 && currentStock < amtInKg) { //check for outstanding amt  
        //     throw new Error("Current Stock Is Less Than The Asked Amount");
        // }
        
        if (flag == 0) { 
            //flag == 0 is for deduction of stock in production
            updatedStock = currentStock - amtInKg;
        } else {
            //flag == 1 is for addition of stock in production
            // new stock added here
            updatedStock = currentStock + amtInKg;
        }
        await ctx.stub.putState(productionStock, Buffer.from(updatedStock.toString()))
        console.log("Stock is updated to %s", updatedStock);
        let stock = await ctx.stub.getState(productionStock)
        return parseInt(stock.toString());
    }

    // Queries available stock of the producer using the productionStock
    async availableStock(ctx) {
        let ASBytes = await ctx.stub.getState(productionStock);
        let availableStock = parseInt(ASBytes.toString())
        console.log("Available Stock is %s kg", availableStock);
        return availableStock;
    }

    async placeOrder(ctx, qty, country, state) {
        // let clientMSPID = await ctx.clientIdentity.getMSPID();
        // if (clientMSPID !== 'tataMSP') {
        //     throw new Error('only manufacturer can place an order')
        // }
        console.log(ctx);
        console.log(qty);
        console.log(country);
        console.log(state);
        let time = await ctx.stub.getDateTimestamp();
        
        // Updating the balances of the manufacturer
        let manufacturerBalance = await this.getManufacturerFunds(ctx);
        let prdBalance = await this.getProducerFunds(ctx);
        
        // Check for insufficient funds
        let amt = qty * pricePerKg // calculate price to be paid
        if (manufacturerBalance < amt) {
            throw new Error('Manufacturer Has Insufficient Funds');
        }
        let prodStock = await this.availableStock(ctx);
        // check for sufficient stock
        if(prodStock < qty){
            throw new Error("Sufficient Stock Is Not There")
        }

        // update stock
        try {
            let stock = await this.updateProductionStock(ctx, qty, 0);
        } catch (err) { 
            throw err;
        }
        
        prdBalance+=amt;
        manufacturerBalance -= amt;
        await ctx.stub.putState(manufacturerFunds,Buffer.from(manufacturerBalance.toString()))
        await ctx.stub.putState(producerFunds, Buffer.from(prdBalance.toString()));
        console.log("106 -> Check Point Reached");
        let order = {
            "time": time,
            "amount": amt,
            "quantity": qty,  
            "status": Status[0],
            "deliveryLocation": {
                "country": country,
                "state": state
            }
        }
        console.log(order);
        // creating new order no.
         let orderNoBytes = await ctx.stub.getState(orderNumber);
         let orderNo = parseInt(orderNoBytes.toString());
         if (!orderNoBytes || orderNoBytes.length === 0) {
            //  await ctx.stub.putState(orderNumber, Buffer.from('1'));
            orderNo = 1;
         } else {
             orderNo += 1;
            //  await ctx.stub.putState(orderNumber, Buffer.from(orderNo.toString()));
         }
         console.log("OrderNo", orderNo);
        // store the order details in the blockchain with the orderNo as key
        await ctx.stub.putState(orderNo, Buffer.from(JSON.stringify(order)));
    }

    // updates the status of the order to in-transit
    async updateStatusToInTransit(ctx, orderNo) {
        let clientMSP = await ctx.clientIdentity.getMSPID()
        if (clientMSP !== 'teafarmMSP') {
            throw new Error('Only teafarm can upadte the status of shipment');
        }

        // fetching order details
        let orderObjBytes = await ctx.stub.getState(orderNo);
        let orderObj = parse(JSON.stringify(orderObjBytes));
        let status = orderObj.Status;
        if (status !== Status[0]) {
            throw new Error('cannot change status to in-transit as order is not even placed');
        }

        // updating the status
        orderObj.Status = Status[1]
        //storing the new order details object with the orderNo key
        await ctx.stub.putState(orderNo, Buffer.from(JSON.stringify(orderObj)));
    }

    // updates the status of the order to delivered
    async updateStatusToDelivered(ctx, orderNo) {
        let clientMSP = await ctx.clientIdentity.getMSPID()
        if (clientMSP !== 'tataMSP') {
            throw new Error('only Producer has permission to this update status');
        }

        // fetching order details
        let orderObjBytes = await ctx.stub.getState(orderNo);
        let orderObj = parse(JSON.stringify(orderObjBytes));
        let status = orderObj.Status;
        if (status !== Status[1]) {
            throw new Error('cannot change status to delivered as package is not even shipped');
        }

        // updating the status to delivered
        orderObj.Status = Status[2]
        //storing the new order details object with the orderNo key
        await ctx.stub.putState(orderNo, Buffer.from(JSON.stringify(orderObj)));
    }

    // async claimPayout(ctx, orderNo) {
    //     let clientMSP = await ctx.clientIdentity.getMSPID()
    //     if (clientMSP !== 'teafarmMSP') {
    //         throw new Error('only Producer has permission to claim payout');
    //     }

    //     // fetching order details object with orderNo
    //     let orderObjBytes = await ctx.stub.getState(orderNo);
    //     let orderObj = parse(JSON.stringify(orderObjBytes));
    //     let status = orderObj.Status;
    //     let amt;

    //     // check whether status is 'delivered' else throws error
    //     if (status === Status[2]) {
    //         amt = orderObj.Amount;
    //         // transferring amount to producer
    //         let newBalance = balance + amt;
    //         await ctx.stub.putState(producerFunds, Buffer.from(newBalance.toString()));
    //         // await TokenERC20Contract.transferFrom(ctx, this.toString(), clientMSP, amt)

    //         // updating the status of the order to payout-claimed
    //         orderObj.Status = Status[3];

    //         //storing the new order details object with the orderNo key
    //         await ctx.stub.putState(orderNo, Buffer.from(JSON.stringify(orderObj)));
    //         console.log('====== Payout of %s $ has been claimed ======', amt);
    //         return amt;
    //     } else {
    //         throw new Error('shipment must be delivered in order to collect payout');
    //     }
    // }

    // Queries the order details object with orderNo as key
    async getOrderDetails(ctx, orderNo) {
        //fetching order details
        let orderObjBytes = await ctx.stub.getState(orderNo);
        let orderObj = parse(JSON.stringify(orderObjBytes));
        console.log("Order must be delivered to %s, %s", orderObj.DeliveryLocation.Country, orderObj.DeliveryLocation.State);
        console.log("Order amount is %s", orderObj.Amount);
        console.log("Order quantity is %s Kg", orderObj.Quantity);
        console.log("Current status of order is %s", Status);
        return orderObj;
    }

    // function to check account balances in $ of the user
    async getManufacturerFunds(ctx) {
            let balanceBytes = await ctx.stub.getState(producerFunds);
            let balance = parseInt(balanceBytes.toString());
            console.log('Balance for %s is %s $', balance);
            return balance;
    }

    async getProducerFunds(ctx){
        let balanceBytes = await ctx.stub.getState(manufacturerFunds);
        let balance = parseInt(balanceBytes.toString());
        console.log('Balance for %s is %s $', balance);
        return balance;
    }
}

module.exports = PmCc;