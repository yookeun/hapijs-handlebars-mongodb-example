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

server.route([
	{
		method: 'GET',
		path: '/allbooks',
		config: {
			handler: (request, reply) => {

				const db = request.server.plugins['hapi-mongodb'].db;
    			const pjdata = db.collection('businesses');
    			
				pjdata.find((err, docs) => {

			        if (err) {
			          return reply(Boom.badData('Internal MongoDB error', err));
			        }

			        reply.view('fortune', docs);
			        console.log("working");
			      });

			},
			cors: true
		},
		
	},
	{
		method: 'POST',
		path: '/addbook',
		config: {
			handler: (request, reply) => {
				var db = request.server.plugins['hapi-mongodb'].db;
				var dbDoc = {
					"title" : request.payload.title,
					"author": request.payload.author,
					"pages": request.payload.pages,
					"category": request.payload.category,
				};
				console.log(dbDoc);
				db.collection('books').updateOne({"title": request.payload.title}, dbDoc, {upsert: true}, (err, result) => {
					if(err) return reply(Boom.internal('Internal MongoDB error', err));
					return reply(result);
				});
			},
			validate: {
				payload: {
					title: Joi.string().required(),
					author: Joi.string().required(),
					pages: Joi.number().required(),
					category: Joi.string().required()
				}
			},
			cors: true
		}
		
	},
	{
		method: 'GET',
		path: '/bookdetails/{id}',
		config: {
			handler: (request, reply) => {
				var db = request.server.plugins['hapi-mongodb'].db;
				var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
				
				db.collection('books').findOne({"_id" : new ObjectID(request.params.id)}, (err, result) => {
					if(err) return reply(Boom.internal('Internal MongoDB error', err));
					return reply(result);
				})
			},
			cors: true
		}
		
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