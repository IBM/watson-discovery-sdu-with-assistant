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

const util = require('util');

module.exports = {
  setWorkspaceId(workspaceId) {
    this.workspace_id = workspaceId;
  },
  message(messageOpts) {
    const params = Object.assign({
      workspaceId: this.workspace_id
    }, messageOpts);

    console.log('Assistant Message Params: ');
    console.log(util.inspect(params, false, null));
    return params;
  }
};
