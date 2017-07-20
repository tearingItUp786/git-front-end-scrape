import Nightmare from 'nightmare'
import fs from 'fs'
import path from 'path'
import request from 'request'
import 'babel-polyfill'
import co from 'co'
import {username, password} from '../auth.json'

const url = 'https://frontendmasters.com/login/'
const course = process.argv[2]
const idOfUserLogin = '#rcp_user_login'
const idOfUserPass = '#rcp_user_pass'
const userSubmitButton = '#rcp_login_submit'

if (!course) {
  // print the help if we fail
  printHelp()
  process.exit(1)
}

var userFolder = `${course}`

var match = userFolder.match(/courses\/(.*)/)
userFolder = userFolder.match(/^[a-zA-Z0-9._-]*\//) ? userFolder : `${match[1]}`

var directory = path.join(__dirname, userFolder)

function printHelp () {
  console.log('========================================================================')
  console.log('frontendmasters screen scraper   Taran Bains-2017')
  console.log('')
  console.log(`First argument must be the url of the course you are trying to download`)
  console.log('========================================================================')
}

function goToLink (vidLink, index, name) {
  console.log(`Fetching ${name}`)
  var nightmare = Nightmare({
    show: false
  })
  return nightmare
    .goto(url)
    .type(idOfUserLogin, username)
    .type(idOfUserPass, password)
    .click(userSubmitButton).wait(2000)
    .goto(vidLink).wait(8000)
    .evaluate((index, name) => {
      let url = document.getElementsByTagName('video')[0].src
      let fileName = `${index}-${name}.mp4`
      return {
        url,
        fileName
      }
    }, index, name)
    .end()
}

function getMainLinks (userFolder) {
  createDirectory(directory)
  console.log('Fetching the links to visit')
  var nightmare = Nightmare({
    show: false
  })
  return nightmare
    .goto(url)
    .type(idOfUserLogin, username)
    .type(idOfUserPass, password)
    .click(userSubmitButton)
    .wait(2000)
    .goto(course)
    .wait(6000)
    .evaluate((userFolder) => {
      var links = []
      var domLinks = document.querySelectorAll('.video-link')
      var regex = new RegExp('courses/' + userFolder + '(.*)')

      for (let i = 0; i < domLinks.length; ++i) {
        links.push({
          'firstLink': domLinks[i].href,
          'title': domLinks[i].href.match(regex)[1]
        })
      }

      return links
    }, userFolder)
    .end()
}

function createDirectory (dirName, callback) {
  if (!fs.existsSync(dirName)) {
    console.log('========================================================================')
    console.log(`Created directory ${dirName}`)
    console.log('========================================================================')
    return fs.mkdirSync(dirName)
  }
}

function createMP4 (url, fileName) {
  // console.log(directory + fileName)
  fileName = path.join(directory, fileName)
  const file = fs.createWriteStream(fileName)

  request(url).pipe(file).on('error', function (error) {
    console.error(error)
  })

  file.on('open', function () {
    console.log('========================================================================')
    console.log(`Opening file ${fileName}`)
    console.log('========================================================================')
  })

  file.on('close', function () {
    console.log('========================================================================')
    console.log(`Closing file ${fileName}`)
    console.log('========================================================================')
  })
}

co(function * main () {
  const failures = []
  // console.log(userFolder)

  var links = yield getMainLinks(userFolder)

  links = links.map((element) => {
    // console.log(element)
    if (element.firstLink.search('&') !== -1) {
      return {
        'firstLink': element.firstLink.replace(element.firstLink.substring(element.firstLink.search('&')), ''),
        'title': element.title
      }
    } else {
      return element
    }
  })

  console.log(`Number of files to download: ${links.length}`)

  for (let i = 0; i < links.length; ++i) {
    try {
      var urlObject = yield goToLink(links[i].firstLink, i, links[i].title)
      var {
        url,
        fileName
      } = urlObject
      createMP4(url, fileName)
    } catch (err) {
      console.log(`Encountered an error parsing the link for ${fileName}`)
      failures.push(fileName)
    }
  }

  console.log('Script has finished running')
  console.log(`${failures.length} videos failed to download`)
  console.log([...failures])
}).then(result => console.log(result), error => console.log(error)).catch(error => console.log(error))
