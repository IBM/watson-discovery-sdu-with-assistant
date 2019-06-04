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
import queryString from 'query-string';
import Matches from './Matches';
import Messages from './Messages';
import { Grid, Header, Card, Input } from 'semantic-ui-react';

const utils = require('../lib/utils');
const util = require('util');  

/**
 * Main React object that contains all objects on the web page.
 * This object manages all interaction between child objects as
 * well as making search requests to the discovery service.
 */
class Main extends React.Component {
  constructor(...props) {
    super(...props);
    const { 
      // query data
      data,
      numMatches,
      error,
      // query params
      searchQuery,
      // assistant data
      context,
      userInput,
      conversation
    } = this.props;

    // change in state fires re-render of components
    this.state = {
      // query data
      data: data,   // data should already be formatted
      numMatches: numMatches || 0,
      loading: false,
      error: error,
      // query params
      searchQuery: searchQuery || '',
      // assistant data
      context: {},
      userInput: '',
      conversation: []
    };
  }

  /**
   * fetchData - build the query that will be passed to the 
   * discovery service.
   */
  fetchData(query) {
    const { conversation } = this.state;
    const searchQuery = query;

    // console.log("QUERY2 - selectedCategories: ");
    // for (let item of selectedCategories)
    //   console.log(util.inspect(item, false, null));
    // console.log("QUERY2 - searchQuery: " + searchQuery);
    
    this.setState({
      loading: true,
      searchQuery
    });

    scrollToMain();
    history.pushState({}, {}, `/${searchQuery.replace(/ /g, '+')}`);

    // build query string, with filters and optional params
    const qs = queryString.stringify({
      query: searchQuery,
      count: 4
    });

    // send request
    fetch(`/api/search?${qs}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then(json => {
        var passages = json.passages;
        passages = utils.formatData(passages);
        
        console.log('+++ DISCO RESULTS +++');
        const util = require('util');
        console.log(util.inspect(passages, false, null));
        console.log('numMatches: ' + passages.results.length);

        // add to message list
        passages.results.forEach(function(result) {
          conversation.push(
            { id: conversation.length,
              text: result.text,
              owner: 'watson'});
        });

        this.setState({
          data: passages,
          conversation: conversation,
          loading: false,
          numMatches: passages.length,
          error: null
        });
        scrollToMain();
      })
      .catch(response => {
        this.setState({
          error: (response.status === 429) ? 'Number of free queries per month exceeded' : 'Error fetching results',
          loading: false,
          data: null
        });
        // eslint-disable-next-line no-console
        console.error(response);
      });
  }
  
  /**
   * fetchData - build the query that will be passed to the 
   * discovery service.
   */
  sendMessage(text) {
    var { context, conversation } = this.state;

    // context.my_creds = {
    //   'user':'7a4d1a77-2429-43b1-b6ed-a2b438e15bea',
    //   'password':'RVVEdpPFLAuuTwFXjjKujPKY0hUOEzt6nQ6O7NwyonHeF7OdAm77Uc34GL2wQHDx'
    // };

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
        // console.log('+++ ASSISTANT RESULTS +++');
        // const util = require('util');
        // console.log(util.inspect(json, false, null));

        // console.log('json.output.text[0]: ' + json.output.text[0]);
        this.printContext(json.context);
        console.log('OUTPUT: ' + json.output.text[0]);

        // returned text from assistant will either put text string 
        // or Discovery data returned in the context
        if (json.context.webhook_result_1) {
          console.log('GOT DISCO OUTPUT!');
          var passages = json.context.webhook_result_1.response.result.passages;
          passages = utils.formatData(passages);
          
          console.log('+++ DISCO RESULTS +++');
          const util = require('util');
          console.log(util.inspect(passages, false, null));
          console.log('numMatches: ' + passages.results.length);
  
          // add to message list
          passages.results.forEach(function(result) {
            conversation.push(
              { id: conversation.length,
                text: result.text,
                owner: 'watson'});
          });
  
        } else {
          // add to message list
          conversation.push(
            { id: conversation.length,
              text: json.output.text[0],
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

  /* Log Watson Assistant context values, so we can follow along with its logic. */
  printContext(context) {
    if (context.system) {
      if (context.system.dialog_stack) {
        // console.log(
        //   '     dialog_stack: [' + util.inspect(context.system.dialog_stack, false, null) + ']');
        console.log('Dialog Stack:');
        console.log(util.inspect(context, false, null));
      }
    }
  }
  
  handleOnChange(event) {
    this.setState({userInput: event.target.value});
  }

  handleKeyPress(event) {
    const { userInput, conversation } = this.state;

    if (event.key === 'Enter') {
      conversation.push(
        { id: conversation.length,
          text: userInput,
          owner: 'user'
        }
      );

      // console.log('searchQuery [FROM SEARCH]: ' + searchValue);
      // this.fetchData(searchValue);
      this.sendMessage(userInput);

      this.setState({
        conversation: conversation,
        // clear out input field
        userInput: ''
      });

    }
  }

  /**
   * getMatches - return collection matches to be rendered.
   */
  getMatches() {
    const { data } = this.state;

    if (!data || data.results.length == 0) {
      return (
        <Header as='h3' textAlign='center'>
            No results found. Please enter new search query.
        </Header>
      );
    } else {
      return (
        <Matches 
          matches={ data.results }
        />
      );
    }
  }

  getListItems() {
    const { conversation } = this.state;

    return (
      <Messages
        messages={conversation}
      />
    );
  }

  /**
   * render - return all the home page object to be rendered.
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

//                 value={this.state.userInput}
//                onKeyPress={this.handleKeyPress.bind(this)}

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
  data: PropTypes.object,
  searchQuery: PropTypes.string,
  numMatches: PropTypes.number,
  context: PropTypes.object,
  userInput: PropTypes.string,
  conversation: PropTypes.array,
  error: PropTypes.object
};

module.exports = Main;
