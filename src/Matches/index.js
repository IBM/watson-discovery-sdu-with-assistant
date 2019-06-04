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

import React from 'react';
import PropTypes from 'prop-types';
import { Container, Card } from 'semantic-ui-react';

/**
 * This object renders the results of the search query on the web page. 
 * Each result item, or 'match', will display a title, description, and
 * sentiment value.
 */
const Match = props => (
  <Card fluid color='green'>
    <Card.Content description={props.text } />
    <Card.Content extra>
      Score: { props.score }
    </Card.Content>
  </Card>
);

// type check to ensure we are called correctly
Match.propTypes = {
  text: PropTypes.string.isRequired,
  score: PropTypes.string.isRequired
};

const Matches = props => (
  <div>
    <Container textAlign='left'>
      <div className="matches--list">
        <Card.Group>
          {props.matches.map(item =>
            <Match
              key={ item.id }
              text={ getText(item) }
              score={ getScore(item) }
            />)
          }
        </Card.Group>
      </div>
    </Container>
  </div>
);

// type check to ensure we are called correctly
Matches.propTypes = {
  matches: PropTypes.arrayOf(PropTypes.object).isRequired
};

// format text, setting background color for all highlighted words
const getText = (item) => {
  return item.text ? item.text : 'No Description';
};

/**
 * getScore - round up to 4 decimal places.
 */
const getScore = item => {
  var score = 0.0;

  if (item.score) {
    score = (item.score).toFixed(4);
  }
  return score;
};

// export so we are visible to parent
module.exports = Matches;
