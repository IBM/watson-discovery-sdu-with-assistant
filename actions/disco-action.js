/**
  *
  * @param {object} params
  * @param {string} params.iam_apikey
  * @param {string} params.url
  * @param {string} params.environment_id
  * @param {string} params.collection_id
  * @param {string} params.input
  *
  * @return {object}
  *
  */

 const assert = require('assert');
 const DiscoveryV1 = require('ibm-watson/discovery/v1');
 const { IamAuthenticator } = require('ibm-watson/auth');
 
 /**
   *
   * main() will be run when you invoke this action
   *
   * @param Cloud Functions actions accept a single parameter, which must be a JSON object.
   *
   * @return The output of this action, which must be a JSON object.
   *
   */
 function main(params) {
 
   return new Promise(function (resolve, reject) {
 
     const discovery = new DiscoveryV1({
       version: '2020-11-15',
       authenticator: new IamAuthenticator({
         apikey: params.iam_apikey,
       }),
       serviceUrl: params.url,
     });
     
     const queryParams = {
       environmentId: params.environment_id,
       collectionId: params.collection_id,
       naturalLanguageQuery: params.input,
       passages: true,
       count: 3,
       passagesCount: 3
     };
     
     discovery.query(queryParams)
       .then(queryResponse => {
         return resolve(queryResponse.result);
       })
       .catch(err => {
         return reject(err);
       });
     });
 }
 