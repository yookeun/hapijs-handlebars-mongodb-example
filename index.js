'use strict';

const Hapi = require('hapi');
const MongoDB = require('hapi-mongodb');
const Boom = require('boom');
const Joi = require('joi');
const DBConfig = require('./config/DBConfig');
const Path = require('path');
const Inert = require('inert');
const Vision = require('vision');
const Handlebars = require('handlebars');

let server = new Hapi.Server();
server.connection({port: 3000});

server.register(require('vision'), (err) => {

    if (err) {
        console.log("Failed to load vision.");
    }
    
});

server.views({
	engines: {
	html: {

		module: require('handlebars'),
		compileMode:'sync' // engine specific

	}
	},
	// compileMode: 'async', // global setting
	path: './views',
	layoutPath: './views/layout',
	layout: 'default',
	helpersPath: './views/helpers',
	partialsPath: './views/partials'
});

server.route({
	method: 'GET',
	path: '/',
	handler: function (request, reply) {
	var templateData = {
	  title: 'Rendering Handlebars in Hapijs from a mongoDB response',
	  message: 'mondoDB with and without handlebars template'
	};

	return reply.view('index', templateData);
	}
});

server.route([
	{
		method: 'GET',
		path: '/allitems',
		config: {
				handler: (request, reply) => {

				const db = request.server.plugins['hapi-mongodb'].db;
				const testData = db.collection('restaurants');

				reply(testData.find({}, {name:1}).toArray());	//filter only with ID + TITLE
			},

			cors: true
		},
		
	}
]);

server.route([
	{
		method: 'GET',
		path: '/allitems2',
		config: {
				handler: (request, reply) => {

				const db = request.server.plugins['hapi-mongodb'].db;
				const testData = db.collection('restaurants');
    			
				testData.find((err, docs) => {
				// testData.find({}, {name:1}).toArray()((err, docs) => {

			        if (err) {
			          return reply(Boom.badData('Internal MongoDB error', err));
			        }
			        // reply(docs);
			        reply.view('listings', docs);
			        console.log("working");
			      });

			},
			cors: true
		},
		
	}
]);
server.register({
    register: MongoDB,
    options: DBConfig.opts
}, (err) => {
    if (err) {
        console.error(err);
        throw err;
    }
	
	server.start((err) => console.log('Server started at:', server.info.uri));
});

