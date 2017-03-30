'use strict';
var amqp = require('amqplib/callback_api');

module.exports = function(Account){


    // Account.disableRemoteMethodByName('find');  // GET /Accounts
    Account.disableRemoteMethodByName('create');   // POST /Accounts  // implemented below as remote method to use rabbitmq
    Account.disableRemoteMethodByName('upsert');
    Account.disableRemoteMethodByName('exists');
    Account.disableRemoteMethodByName('findById');
    Account.disableRemoteMethodByName('findOne');
    Account.disableRemoteMethodByName('deleteById');
    Account.disableRemoteMethodByName('count');
    Account.disableRemoteMethodByName('prototype.updateAttributes');
    Account.disableRemoteMethodByName('createChangeStream');
    Account.disableRemoteMethodByName('updateAll');
    Account.disableRemoteMethodByName('replaceOrCreate');
    Account.disableRemoteMethodByName('replaceById');
    Account.disableRemoteMethodByName('upsertWithWhere'); 

   // exposing a static remote method to put a message
   // into 'account' queue in rabbitmq 
   Account.putMsg = function(msg, cb) {
        //-- rabbitmq integration - put message
        // connect to RabbitMQ server
        amqp.connect('amqp://rabbitmq:5672', function (err, conn) {
            console.log('### In ampq.connect');
            if (err) {
                console.log("### In ampq.connect - error: " + err);
                return;
            }
            // create a channel, which is where most of the API for getting things done resides:
            conn.createChannel(function (err, ch) {
                // declare a queue for us to send to; then we can publish a message to the queue:
                var q = 'account';
                ch.assertQueue(q, { durable: false });
                // Note: on Node 6 Buffer.from(msg) should be used
                // ch.sendToQueue(q, new Buffer('{"label": "streamline"}'));
                ch.sendToQueue(q, new Buffer(JSON.stringify(msg)));
                console.log('### Message delivered, msg: ' + JSON.stringify(msg));
            });
            // close the connection and exit;
            setTimeout(function () { conn.close(); process.exit(0) }, 500);
        });

        var response;
        response = {status: "delivered"};
        cb(null, response);
    };

    Account.remoteMethod(
        'putMsg', 
        { 
            http: { path: '/', verb: 'post' },
            accepts: { arg: 'data', type: 'object', http: { source: 'body' }},
            returns: { arg: 'acc', type: 'Object' }
        }
    );

/* The commented block below was a technology demonstration, but it doesn't 
   make much sense from a integration perspective (REST GET - AMQP)

    // exposing a static remote method to get a message
    // into 'account' queue in rabbitmq 
    Account.getMsg = function(cb) {

        // rabbitmq integration - get message
        var amqp = require('amqplib/callback_api');

        amqp.connect('amqp://rabbitmq:5672', function (err, conn) {
            conn.createChannel(function (err, ch) {
                var q = 'account';
                ch.assertQueue(q, { durable: false });
                console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q);
                ch.consume(q, function (msg) {
                    console.log(" [x] Received msg.content %s", msg.content);
                    console.log(" [x] Received msg.content.toString %s", msg.content.toString());

                    // send back the response to API call
                    // console.log(Buffer.from(msg.content.$data, 'base64')); 
                    var responseS = msg.content.toString();
                    var response = JSON.parse(responseS);
                    cb(null, response);

                }, { noAck: true });
            });
        });
    };

    Account.remoteMethod(
        'getMsg', 
            { 
                http: { path: '/', verb: 'get' },
                returns: { arg: 'acc', type: 'Object' }
            }
    );
 */   
};