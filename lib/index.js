'use strict';

var _nightmare = require('nightmare');

var _nightmare2 = _interopRequireDefault(_nightmare);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

require('babel-polyfill');

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _auth = require('../auth.json');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = 'http://frontendmasters.com/login';
var course = process.argv[2];
var idOfUserLogin = '#rcp_user_login';
var idOfUserPass = '#rcp_user_pass';
var userSubmitButton = '#rcp_login_submit';

if (!course) {
  // print the help if we fail
  printHelp();
  process.exit(1);
}

var userFolder = '' + course;

var match = userFolder.match(/courses\/(.*)/);
userFolder = userFolder.match(/^[a-zA-Z0-9._-]*\//) ? userFolder : '' + match[1];

var directory = _path2.default.join(__dirname, userFolder);

function printHelp() {
  console.log('========================================================================');
  console.log('frontendmasters screen scraper   Taran Bains-2017');
  console.log('');
  console.log('First argument must be the url of the course you are trying to download');
  console.log('========================================================================');
}

function goToLink(vidLink, index, name) {
  console.log('Fetching ' + name);
  var nightmare = (0, _nightmare2.default)({
    show: false
  });
  return nightmare.goto(url).type(idOfUserLogin, _auth.username).type(idOfUserPass, _auth.password).click(userSubmitButton).wait(2000).goto(vidLink).wait(8000).evaluate(function (index, name) {
    var url = document.getElementsByTagName('video')[0].src;
    var fileName = index + '-' + name + '.mp4';
    return {
      url: url,
      fileName: fileName
    };
  }, index, name).end();
}

function getMainLinks(userFolder) {
  createDirectory(directory);
  console.log('Fetching the links to visit');
  var nightmare = (0, _nightmare2.default)({
    show: false
  });
  return nightmare.goto(url).type(idOfUserLogin, _auth.username).type(idOfUserPass, _auth.password).click(userSubmitButton).wait(2000).goto(course).wait(6000).evaluate(function (userFolder) {
    var links = [];
    var domLinks = document.querySelectorAll('.video-link');
    var regex = new RegExp('courses/' + userFolder + '(.*)');

    for (var i = 0; i < domLinks.length; ++i) {
      links.push({
        'firstLink': domLinks[i].href,
        'title': domLinks[i].href.match(regex)[1]
      });
    }

    return links;
  }, userFolder).end();
}

function createDirectory(dirName, callback) {
  if (!_fs2.default.existsSync(dirName)) {
    console.log('========================================================================');
    console.log('Created directory ' + dirName);
    console.log('========================================================================');
    return _fs2.default.mkdirSync(dirName);
  }
}

function createMP4(url, fileName) {
  // console.log(directory + fileName)
  fileName = _path2.default.join(directory, fileName);
  var file = _fs2.default.createWriteStream(fileName);

  (0, _request2.default)(url).pipe(file).on('error', function (error) {
    console.error(error);
  });

  file.on('open', function () {
    console.log('========================================================================');
    console.log('Opening file ' + fileName);
    console.log('========================================================================');
  });

  file.on('close', function () {
    console.log('========================================================================');
    console.log('Closing file ' + fileName);
    console.log('========================================================================');
  });
}

(0, _co2.default)(regeneratorRuntime.mark(function main() {
  var failures, links, i, urlObject, url, fileName;
  return regeneratorRuntime.wrap(function main$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          failures = [];
          // console.log(userFolder)

          _context.next = 3;
          return getMainLinks(userFolder);

        case 3:
          links = _context.sent;


          links = links.map(function (element) {
            // console.log(element)
            if (element.firstLink.search('&') !== -1) {
              return {
                'firstLink': element.firstLink.replace(element.firstLink.substring(element.firstLink.search('&')), ''),
                'title': element.title
              };
            } else {
              return element;
            }
          });

          console.log('Number of files to download: ' + links.length);

          i = 0;

        case 7:
          if (!(i < links.length)) {
            _context.next = 23;
            break;
          }

          _context.prev = 8;
          _context.next = 11;
          return goToLink(links[i].firstLink, i, links[i].title);

        case 11:
          urlObject = _context.sent;
          url = urlObject.url, fileName = urlObject.fileName;

          createMP4(url, fileName);
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context['catch'](8);

          console.log('Encountered an error parsing the link for ' + fileName);
          failures.push(fileName);

        case 20:
          ++i;
          _context.next = 7;
          break;

        case 23:

          console.log('Script has finished running');
          console.log(failures.length + ' videos failed to download');
          console.log([].concat(failures));

        case 26:
        case 'end':
          return _context.stop();
      }
    }
  }, main, this, [[8, 16]]);
})).then(function (result) {
  return console.log(result);
}, function (error) {
  return console.log(error);
}).catch(function (error) {
  return console.log(error);
});