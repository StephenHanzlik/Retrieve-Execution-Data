//This script is used to retrieve execution data in bulk for each formula instance
//Note that executions are only kepts for three days
//The command line will prompt you for the information required to retrieve the execution data

const requestPromise = require('request-promise-native');
const prompt = require('prompt');

const envs = {
  "us-production": 'https://api.cloud-elements.com/elements/api-v2',
  "uk-production": 'https://api.cloud-elements.co.uk/elements/api-v2/',
  "staging": 'https://staging.cloud-elements.com/elements/api-v2'
}

const isValidDate = function(dateString) {
  return dateString instanceof Date && dateString != 'Invalid Date';
}
console.log("IMPORTANT: Customer data is sensitive.  Delete this data after you are finished debugging your issue.");
console.log("Please provide the following information to retrieve execution data:");

prompt.start();
prompt.get(['Environment (staging, us-production, uk-production?)','Formula Instance ID', 'User Token', 'Organization Token', 'Start Time UTC(i.e. 2018/01/01 00:00:00)', 'End Time UTC(i.e. 2018/01/01 00:00:00)','What is the name of the step you are looking for?', 'What is the key of the value you are looking for?'], function (err, result) {

  const apiUrl = envs[result['Environment (staging, us-production, uk-production?)']] || envs['us-production'];
  const authHeader = `User ${result['User Token']}, Organization ${result['Organization Token']}`
  const formulaInstanceId = `${result['Formula Instance ID']}`;
  const startTime = new Date(result['Start Time UTC(i.e. 2018/01/01 00:00:00)']+'Z');
  const endTime = new Date(result['End Time UTC(i.e. 2018/01/01 00:00:00)']+'Z');
  const stepName = result['What is the name of the step you are looking for?'];
  const key = result['What is the key of the value you are looking for?'];

  if(!isValidDate(startTime) || !isValidDate(endTime)) return console.log('Invalid Date Entered. Aborting...');
  if(startTime >= endTime) return console.log('Start time must be before end time.')

  prompt.get([`Retrieving executions of formula instance ID #${formulaInstanceId} from ${startTime} to ${endTime} on ${apiUrl} using Authorization: ${authHeader}. Enter 'yes' to proceed.`], function(err, result) {
    if(result[`Retrieving executions of formula instance ID #${formulaInstanceId} from ${startTime} to ${endTime} on ${apiUrl} using Authorization: ${authHeader}. Enter 'yes' to proceed.`].toLowerCase() !== 'yes') return console.log('Aborting...');

    const getExecutions = function(){
      const options =  {
        'method': 'GET',
        'headers': {
          'Authorization': authHeader
        },
        'json': true,
        'url': `${apiUrl}/formulas/instances/${formulaInstanceId}/executions?objectId=&nextPage=`
      };

      return requestPromise(options);
    }

    const getSteps = function(id){
      const options =  {
        'method': 'GET',
        'headers': {
          'Authorization': authHeader
        },
        'json': true,
        'url': `${apiUrl}/formulas/instances/executions/${id}/steps`
      };

      return requestPromise(options)
    }

    const getStepValues = function(step, key){
      const options =  {
        'method': 'GET',
        'headers': {
          'Authorization': authHeader
        },
        'json': true,
        'url': `${apiUrl}/formulas/instances/executions/steps/${step.id}/values`
      };

      return requestPromise(options)
    }

    getExecutions().then(function (response) {
            return response.forEach((execution) => {
              getSteps(execution.id).then(function(response){
                response.forEach((step)=>{
                  if(step.stepName === stepName){
                    getStepValues(step, key).then(function(response){
                      response.forEach((stepObj)=>{
                        //// TODO: we need to unest the value here.
                        if(stepObj.key === `${stepName}.response.body`){
                          //console.log("stepObj: " + stepObj);
                          //console.
                            //stepObj.value.result.forEach((obj)=>{
                              //  if(obj.new[key]){
                                //  return obj.new[key];
                              //  }
                          //  })
                          //// TODO: remind users again to delete customer data
                        //  console.log("IMPORTANT: Customer data is sensitive.  Delete this data after you are finished debugging your issue.")
                        //TODO: export these to logs in some readable way
                        //// TODO: add some sort of search functionality
                        }
                      })
                    })
                  }
                })
              });
            });
      })
      .catch(function (err) {
        console.log(`Error fetching executions: ${err}`)
      })
  })

});
