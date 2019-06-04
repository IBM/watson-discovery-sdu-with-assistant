/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';

require('dotenv').config({
  silent: true
});

require('isomorphic-fetch');
const Promise = require('bluebird');
const queryString = require('query-string');
const queryBuilder = require('./query-builder');
const messageBuilder = require('./message-builder');
const discovery = require('./watson-discovery-service');
const assistant = require('./watson-assistant-service');
const utils = require('../lib/utils');

/**
 * Back end server which handles initializing the Watson Discovery
 * service, and setting up route methods to handle client requests.
 */

const WatsonDiscoveryService = new Promise((resolve, reject) => {
  // listEnvironments as sanity check to ensure creds are valid
  discovery.listEnvironments({})
    .then(() => {
      // environment and collection ids are always the same for Watson News
      const environmentId = discovery.environmentId;
      const collectionId = discovery.collectionId;
      queryBuilder.setEnvironmentId(environmentId);
      queryBuilder.setCollectionId(collectionId);
      resolve(createServer());
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
      reject(error);
    });
});

const WatsonAssistantService = new Promise((resolve, reject) => {
  // listEnvironments as sanity check to ensure creds are valid
  assistant.listWorkspaces({})
    .then(() => {
      // environment and collection ids are always the same for Watson News
      const workspaceId = assistant.workspaceId;
      messageBuilder.setWorkspaceId(workspaceId);
    })
    .catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
      reject(error);
    });
});

/**
 * createServer - create express server and handle requests
 * from client.
 */
function createServer() {
  const server = require('./express');

  // handles search request from search bar
  server.get('/api/search', (req, res) => {
    const { query, count } = req.query;
    var params = {};

    console.log('In /api/search: query = ' + query);

    // add query
    params.natural_language_query = query;
    
    params.count = count;
    params.passages_count = count;
    params.passages = true;
    
    var searchParams = queryBuilder.search(params);
    discovery.query(searchParams)
      .then(response => res.json(response))
      .catch(error => {
        if (error.message === 'Number of free queries per month exceeded') {
          res.status(429).json(error);
        } else {
          res.status(error.code).json(error);
        }
      });
  });

  // handles search string appened to url
  server.get('/:searchQuery', function(req, res){
    var searchQuery = req.params.searchQuery.replace(/\+/g, ' ');
    const qs = queryString.stringify({ 
      query: searchQuery,
      count: 4,
      returnPassages: true,
      queryType: 'natural_language_query'
    });
    const fullUrl = req.protocol + '://' + req.get('host');

    console.log('In /:searchQuery: query = ' + qs);

    fetch(fullUrl + `/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {

        // get all the results data in right format
        var passages = json.passages;
        // const util = require('util');
        console.log('++++++++++++ DISCO RESULTS ++++++++++++++++++++');
        // console.log(util.inspect(passages, false, null));
        console.log('length: ' + passages.length);
        passages = utils.formatData(passages);

        res.render('index',
          {
            data: passages,
            searchQuery,
            numMatches: passages.length,
            error: null
          }
        );
      })
      .catch(response => {
        res.status(response.status).render('index', {
          error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching data'
        });
      });
  });

  // Endpoint for Watson Assistant requests
  server.post('/api/message', function(req, res) {
    // build message
    var params = {};
    params.context = req.body.context;
    params.input = {'text': req.body.message};
    var messagesParams = messageBuilder.message(params);
    
    // Send the input to the conversation service
    assistant.message(messagesParams, function(err, data) {
      if (err) {
        return res.status(err.code || 500).json(err);
      }
      return res.json(updateMessage(messagesParams, data));
    });
  });
  
  /**
   * Updates the response text using the intent confidence
   * @param  {Object} input The request to the Assistant service
   * @param  {Object} response The response from the Assistant service
   * @return {Object}          The response with the updated message
   */
  function updateMessage(input, response) {
    var responseText = null;
    if (!response.output) {
      response.output = {};
    } else {
      return response;
    }
    if (response.intents && response.intents[0]) {
      var intent = response.intents[0];
      // Depending on the confidence of the response the app can return different messages.
      // The confidence will vary depending on how well the system is trained. The service will always try to assign
      // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
      // user's intent . In these cases it is usually best to return a disambiguation message
      // ('I did not understand your intent, please rephrase your question', etc..)
      if (intent.confidence >= 0.75) {
        responseText = 'I understood your intent was ' + intent.intent;
      } else if (intent.confidence >= 0.5) {
        responseText = 'I think your intent was ' + intent.intent;
      } else {
        responseText = 'I did not understand your intent';
      }
    }
    response.output.text = responseText;
    return response;
  }

  // initial start-up request
  server.get('/*', function(req, res) {
    console.log('In /*');

    // this is the inital query to the discovery service
    console.log('Initial Search Query at start-up');
    const params = queryBuilder.search({ 
      natural_language_query: '',
      count: 4,
      highlight: false,
      passages: true
    });
    return new Promise((resolve, reject) => {
      discovery.query(params)
        .then(results =>  {

          // const util = require('util');
          // console.log('++++++++++++ DISCO RESULTS ++++++++++++++++++++');
          // console.log(util.inspect(results, false, null));
      
          // get all the results data in right format
          var passages = results.passages;
          passages = utils.formatData(passages);

          res.render('index', { 
            data: passages, 
            numMatches: passages.results.length
          });
    
          resolve(passages);
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
  });

  return server;
}

module.exports = 
WatsonDiscoveryService,
WatsonAssistantService;
