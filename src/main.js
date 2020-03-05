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

import 'isomorphic-fetch';
import React from 'react';
import PropTypes from 'prop-types';
import Messages from './Messages';
import { Grid, Card, Input } from 'semantic-ui-react';

const utils = require('../lib/utils');

var messageCounter = 1;

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as posting messages to the Watson Assistant service.
 */
class Main extends React.Component {
  constructor(...props) {
    super(...props);
    const { 
      error,
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      error: error,
      // assistant data
      context: {},
      userInput: '',
      conversation: [
        { id: 1,
          text: 'Welcome to the Ecobee support team chatbot!',
          owner: 'watson'
        }]
    };
  }
  
  /**
   * sendMessage - build the message that will be passed to the 
   * Assistant service.
   */
  sendMessage(text) {
    var { context, conversation } = this.state;

    this.setState({
      context: context
    });

    // send request
    fetch('/api/message', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        context: context,
        message: text
      })
    }).then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
      .then(json => {
        const result = json.result.output.generic[0];
        const context = json.result.context;

        // un-comment to show results in browser console
        // console.log('+++ ASSISTANT RESULTS +++');
        // console.log(JSON.stringify(json, null, 2));
        // console.log('CONTEXT: ' + JSON.stringify(context, null, 2));

        // returned text from assistant will either be a pre-canned 
        // dialog response, or Discovery data
        if ('webhook_result_1' in context) {
          console.log('Data from Discovery');
          var passages = context.webhook_result_1.passages;
          passages = utils.formatData(passages);

          // add a header to our message
          messageCounter += 1;
          conversation.push(
            { id: messageCounter,
              text: 'Here are some excerpts from the Users Guide:',
              owner: 'watson'});

          // add to message list
          passages.results.forEach(function(result) {
            messageCounter += 1;
            conversation.push(
              { id: messageCounter,
                text: result.text,
                owner: 'watson-cont'});
          });
        } else if (result.response_type === 'text') {
          // normal dialog response from Assistant
          // add to message list
          messageCounter += 1;
          conversation.push({
            id: messageCounter,
            text: result.text,
            owner: 'watson'
          });
        }

        this.setState({
          conversation: conversation,
          context: json.context,
          error: null,
          userInput: ''
        });
        scrollToMain();

      })
      .catch(response => {
        this.setState({
          error: 'Error in assistant'
        });
        // eslint-disable-next-line no-console
        console.error(response);
      });
  }

  /**
   * Log Watson Assistant context values, so we can follow along with its logic. 
   */
  printContext(context) {
    if (context.system) {
      if (context.system.dialog_stack) {
        console.log('Dialog Stack:');
        const util = require('util');
        console.log(util.inspect(context, false, null));
      }
    }
  }
  
  /**
   * Display each key stroke in the UI. 
   */
  handleOnChange(event) {
    this.setState({userInput: event.target.value});
  }

  /**
   * Send user message to Assistant. 
   */
  handleKeyPress(event) {
    const { userInput, conversation } = this.state;

    if (event.key === 'Enter') {
      messageCounter += 1;
      conversation.push(
        { id: messageCounter,
          text: userInput,
          owner: 'user'
        }
      );

      this.sendMessage(userInput);

      this.setState({
        conversation: conversation,
        // clear out input field
        userInput: ''
      });

    }
  }

  /**
   * Get list of conversation message to display. 
   */
  getListItems() {
    const { conversation } = this.state;

    return (
      <Messages
        messages={conversation}
      />
    );
  }

  /**
   * render - return all the home page objects to be rendered.
   */
  render() {
    const { userInput } = this.state;

    return (
      <Grid celled className='search-grid'>

        <Grid.Row className='matches-grid-row'>
          <Grid.Column width={16}>

            <Card className='chatbot-container'>
              <Card.Content className='dialog-header'>
                <Card.Header>Document Search ChatBot</Card.Header>
              </Card.Content>
              <Card.Content>
                {this.getListItems()}
              </Card.Content>
              <Input
                icon='compose'
                iconPosition='left'
                value={userInput}
                placeholder='Enter response......'
                onKeyPress={this.handleKeyPress.bind(this)}
                onChange={this.handleOnChange.bind(this)}
              />
            </Card>

          </Grid.Column>
        </Grid.Row>

      </Grid>
    );
  }
}

/**
 * scrollToMain - scroll window to show 'main' rendered object.
 */
function scrollToMain() {
  setTimeout(() => {
    const scrollY = document.querySelector('main').getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, scrollY);
  }, 0);
}

// type check to ensure we are called correctly
Main.propTypes = {
  context: PropTypes.object,
  userInput: PropTypes.string,
  conversation: PropTypes.array,
  error: PropTypes.object
};

module.exports = Main;
