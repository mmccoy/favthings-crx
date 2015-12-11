/*global $:false */
/*global _:false */
/*global Handlebars:false */
/*global moment:false */

'use strict';

Handlebars.logger.level = 0;

var FavoriteThings = {
  // Static Vars
  version: '0.1',
  history: [],
  hosts: [],
  excludeHosts: [
    'localhost',
    '192.168.1.1',
    ''
  ],

  // Methods
  extractHost: function (url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser.hostname;
  },

  populateHosts: function(results, url) {
    var typed = _.filter(results, function(item){
      return item.transition === 'typed';
    });

    var linked = _.filter(results, function(item){
      return item.transition === 'link';
    });

    var bookmarked = _.filter(results, function(item){
      return item.transition === 'auto_bookmark';
    });

    var record = {
      'hostname': this.extractHost(url),
      'visits': results.length,
      'sessions': 1,
      'typedTransitions': typed.length,
      'linkedTransitions': linked.length,
      'bookmarkedTransitions': bookmarked.length
    };
    var existingRecord = _.findWhere(this.hosts, {hostname: record.hostname});
    if (existingRecord) {
      existingRecord.visits += results.length;
      existingRecord.typedTransitions += typed.length;
      existingRecord.linkedTransitions += linked.length;
      existingRecord.bookmarkedTransitions += bookmarked.length;
      existingRecord.sessions++;
    } else {
      if (!_.contains(this.excludeHosts, record.hostname)) {
        this.hosts.push(record);
      }
    }
  },

  renderTemplate: function() {
    var context = {'items': this.hosts};
    var source = $('#itemTemplate').html();
    var template = Handlebars.compile(source);
    $('.stream').html(template(context));
  }
};

$(document).ready(function() {
  var firstOfYear = moment('2015-01-01T00:00:00.000Z').unix() * 1000;
  chrome.history.search({text: '', maxResults: 10000, startTime: firstOfYear}, function(data) {
    for (var i = data.length - 1; i >= 0; i--) {
      FavoriteThings.history.push({'url': data[i].url});
    }

    for (var j = FavoriteThings.history.length - 1; j >= 0; j--) {
      chrome.history.getVisits({'url': FavoriteThings.history[j].url}, function(results) { // eslint-disable-line no-loop-func
        FavoriteThings.populateHosts(results, this.args[0].url);
      });
    }

    setTimeout(function() {
      FavoriteThings.renderTemplate();
      $('table').tablesorter({
        sortList: [[1, 1]],
        sortInitialOrder: 'desc'
      });
    }, 200);
  });
});