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
import { List, Image } from 'semantic-ui-react';

/**
 * This object renders the results of the search query on the web page. 
 * Each result item, or 'match', will display a title, description, and
 * sentiment value.
 */
const Message = props => (
  <List.Item className={ props.className }>
    <Image avatar src={ props.image } />
    <List.Content className='message-text' >
      { props.text }
    </List.Content>
  </List.Item>
);

// type check to ensure we are called correctly
Message.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired
};

const Messages = props => (
  <div>
    <List relaxed='very'>
      {props.messages.map(item =>
        <Message
          key={ item.id }
          text={ item.text }
          className = { getClassName(item) }
          image = { getImage(item) }
        />)
      }
    </List>
  </div>
);

const getClassName = item => {
  if (item.owner === 'user') {
    return 'right-item-list';
  } else { 
    return 'left-item-list';
  }
};

const getImage = item => {
  if (item.owner === 'user') {
    return 'https://semantic-ui.com/images/avatar/small/stevie.jpg';
  } else if (item.owner === 'watson') { 
    return '/images/watson.png';
  } else {
    return '/images/separator.png';    
  }
};

// type check to ensure we are called correctly
Messages.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired
};

// export so we are visible to parent
module.exports = Messages;
