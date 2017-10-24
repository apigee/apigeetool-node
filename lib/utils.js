/* jshint node: true  */
'use strict';

module.exports.cleanResults = function(results) {
    var tempResults = [];
    
    for(var i = 0; i < results.length; i++) {
        if (results[i] !== null && results[i] !== undefined) {
            tempResults.push(results[i])
        }
    }

    return tempResults
}