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

// Variables and functions needed by both server and client code

/**
 * objectWithoutProperties - clear out unneeded properties from object.
 * object: object to scan
 * properties: items in object to remove
 */
const objectWithoutProperties = (object, properties) => {
  'use strict';

  var obj = {};
  var keys = Object.keys(object);
  keys.forEach(key => {
    if (properties.indexOf(key) < 0) {
      // keep this since it is not found in list of unneeded properties
      obj[key] = object[key];
    }
  });

  return obj;
};
  
/**
 * parseData - convert raw search results into collection of matching results.
 */
const parseData = data => ({
  rawResponse: Object.assign({}, data),
  // sentiment: data.aggregations[0].results.reduce((accumulator, result) =>
  //   Object.assign(accumulator, { [result.key]: result.matching_results }), {}),
  results: data.results
});

/**
 * formatData - format search results into items we can process easier. This includes
 * 1) only keeping fields we show in the UI
 * 2) highlight matching words in text
 * 3) if showing 'passages', ignore all other results
 */
function formatData(data) {
  var formattedData = {};
  var newPassages = [];

  var count = 0;
  data.forEach(function(dataItem) {
    // only keep the data we show in the UI.
    if (dataItem.field === 'text') {
      count = count + 1;
      var newPassage = {
        id: count,
        text: dataItem.passage_text,
        score: dataItem.passage_score,
      };
      newPassages.push(newPassage);
    }
  });

  formattedData.results = newPassages;
  console.log('Formatting Data: size = ' + newPassages.length);
  return formattedData;
}

module.exports = {
  objectWithoutProperties,
  parseData,
  formatData
};
