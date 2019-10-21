# PropShopper

PropShopper is rating and note-taking application which allows users who frequently shop at thrift stores for work, to keep track of and share the best places to find certain items. Any user can search for stores near them and see what kinds of items can be found at that store, as well as what the community thinks of the quality, quantity, and price point, of those items. Not just that, but users can write their own notes about each store and item category, so that when they come back to store later, they can see their previous impressions about it.

### Technology

PropShopper runs on a Node.js server, using Express and Handlebars to serve content to users dynamically. On the back end, content is stored in a mySQL database and the Sequelize Node package is used for database interfacing. The front end of the website relies on Bootstrap for styling. Address normalization is done using the Google Geocoding API. 

### About

This application was developed specifically to help properties shoppers in the theatre industry. It was developed and coded entirely by Daniel Gold. You can check out more from Daniel on [Github](https://github.com/landgod) or on his personal [website](http://dangold.me/). Feel free to connect via [LinkedIn](https://www.linkedin.com/in/danjasongold/) or email to DanielJasonGold@gmail.com.

### Current Developement

PropShopper is currently still in early development and certain features, like tagging, are still in developement. Current planned features include:
* Allowing users to add tags to stores
* Allowing users to search for stores by name
* Google maps integration
* User account settings
* Allow users to confine searches to stores they have notes on