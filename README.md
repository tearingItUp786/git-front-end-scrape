# git-front-end-scrape
This is a little script I wrote up using what I learned on [frontendmasters.com](www.frontendmasters.com). Its purpose is to download video lectures for offline viewing (as far as I know, this is not offered yet by frontendmasters).  

When the script is run, it saves the video series into the lib directory. There is a known bug where if the video link in the table of contents of the course is incorrect, the said video for the course will not be downloaded. 

## How to get started
`yarn install`  
Update `auth.json` to have your username and password 

## How to use
`node ./lib/index.js url-of-course-you-want-to-download`  

On windows you might have to do:  
`node .\lib\index.js url-of-course-you-want-to-download`

## Real World Example
`node .\lib\index.js https://frontendmasters.com/courses/react/`

## Test that everything is working
`npm run test` and this will download the data-structures-and-algorithims to the lib directory