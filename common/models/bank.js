'use strict';

var amqp = require('amqplib/callback_api');

module.exports = function(Bank) {

    // Bank.disableRemoteMethodByName('find');  // GET /banks
    Bank.disableRemoteMethodByName('create');   // POST /banks  // implemented below as remote method to use rabbitmq
    Bank.disableRemoteMethodByName('upsert');
    Bank.disableRemoteMethodByName('exists');
    Bank.disableRemoteMethodByName('findById');
    Bank.disableRemoteMethodByName('findOne');
    Bank.disableRemoteMethodByName('deleteById');
    Bank.disableRemoteMethodByName('count');
    Bank.disableRemoteMethodByName('prototype.updateAttributes');
    Bank.disableRemoteMethodByName('createChangeStream');
    Bank.disableRemoteMethodByName('updateAll');
    Bank.disableRemoteMethodByName('replaceOrCreate');
    Bank.disableRemoteMethodByName('replaceById');
    Bank.disableRemoteMethodByName('upsertWithWhere');

       // exposing a static remote method to put a message
   // into 'account' queue in rabbitmq 
   Bank.putMsg = function(msg, cb) {
        //-- rabbitmq integration - put message
        // connect to RabbitMQ server
        amqp.connect('amqp://rabbitmq:5672', function (err, conn) {
            console.log('### Bank - In ampq.connect');
            if (err) {
                console.log("### Bank - In ampq.connect - error: " + err);
                return;
            }
            // create a channel, which is where most of the API for getting things done resides:
            conn.createChannel(function (err, ch) {
                // declare a queue for us to send to; then we can publish a message to the queue:
                var q = 'bank';
                ch.assertQueue(q, { durable: false });
                // Note: on Node 6 Buffer.from(msg) should be used
                // ch.sendToQueue(q, new Buffer('{"label": "streamline"}'));
                ch.sendToQueue(q, new Buffer(JSON.stringify(msg)));
                console.log('### Bank - Message delivered, msg: ' + JSON.stringify(msg));
            });
            // close the connection and exit;
            setTimeout(function () { conn.close(); process.exit(0) }, 500);
        });

        var response;
        response = {status: "delivered"};
        cb(null, response);
    };

    Bank.remoteMethod(
        'putMsg', 
        { 
            http: { path: '/', verb: 'post' },
            accepts: { arg: 'data', type: 'object', http: { source: 'body' }},
            returns: { arg: 'bank', type: 'Object' }
        }
    );

};
