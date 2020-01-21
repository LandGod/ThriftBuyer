# ThriftBuyer

ThriftBuyer is rating and note-taking application which allows users who frequently shop at thrift stores for work, to keep track of and share the best places to find certain items. Any user can search for stores near them and see what kinds of items can be found at that store, as well as what the community thinks of the quality, quantity, and price point, of those items. Not just that, but users can write their own notes about each store and item category, so that when they come back to store later, they can see their previous impressions about it.

Check it out right now at [thriftbuyer.net](http://thriftbuyer.net)!

### Technology

ThriftBuyer runs on a Node.js server, using Express and Handlebars to serve content to users dynamically. On the back end, content is stored in a mySQL database and the Sequelize Node package is used for database interfacing. The front end of the website relies on Bootstrap for styling. Address normalization is done using the Google Geocoding API. 

### About

This application was developed specifically to help properties shoppers in the theatre industry. It was developed and coded entirely by Daniel Gold. You can check out more from Daniel on [Github](https://github.com/landgod) or on his personal [website](http://dangold.me/). Feel free to connect via [LinkedIn](https://www.linkedin.com/in/danjasongold/) or email to DanielJasonGold@gmail.com.

### Current Developement

I am currently in the process of completely re-writing ThriftBuyer in order to use React (with Redux and TypeScript) instead of Handlebars. After the initial re-write is complete the website will be transfered over to the new front end. The back end should not change and therefore the database should be preserverded during this process. 

I plan to fix known issues in the process of the re-write. Plan features may or may not be added during this phase. Planned features not added in this phase will still be added at a later date.

#### Planned Next Features
* Allowing users to search for stores by name
* Google maps integration
* Further integration with google places API for store name, hours, etc
* User account settings
* Allow users to confine searches to stores they have notes on
* Many more to come...
#### Know Issues (Fixes currently in developement)
* Users should be able to begin typing in text to the new tag modal as soon as it appears, without having to click the text box
* Users should recieve feedback when entering an invalid username or password at login
