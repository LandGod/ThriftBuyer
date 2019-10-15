// Establish form field hooks:
const categoryField = $('#categorySelect');
const tagField = $('#tagField');
const resultsGoHere = $('#resultsContainer');

// For getting info from our radio buttons we'll use the following jquery pattern:
// $('input[name="elementNAME"]:checked')
const qualityName = 'minQualityOptions';
const quantityName = 'minQuantityOptions';
const priceName = 'minPriceOptions';

// When the user clicks the submit button, we should do an ajax query to our own backend api
// then display a list of formatted results below the form

$('#searchSubmit').click((event) => {

    // Stop page from refreshing
    event.preventDefault();

    // Create an object to construct our search query in
    let searchData = {};

    // Populate searchData object from DOM
    // To start with we need to reformat the category names to match the query inputs we want
    let parsedCategory = categoryField.val().split(' ');
    parsedCategory = [parsedCategory[0].toLowerCase(), parsedCategory[1] || ''];
    parsedCategory = parsedCategory.join('');
    if (parsedCategory === '(any)') {parsedCategory = undefined};
    // Then load up our query object
    searchData['type'] = parsedCategory;
    searchData['tag'] = tagField.val();
    searchData['minimumQuality'] = $(`input[name="${qualityName}"]:checked`).val();
    searchData['minimumQuantity'] = $(`input[name="${quantityName}"]:checked`).val();
    searchData['minimumPrice'] = $(`input[name="${priceName}"]:checked`).val();

    // Query DB with user info
    $.ajax({
        dataType: "json",
        url: '/api/category',
        data: searchData
    })
        .done(displaySearchResults)  // Definied later

        .fail(function (err) {
            console.log('querie failed');
            console.log(err);
        })
})

function displaySearchResults(results) {

    // First thing's first, we need to delete any existing results every time the user clicks search, so they're always getting
    // fresh data
    resultsGoHere.empty();

    // After we get results, the first thing we'll add is a page break just for visual effect
    resultsGoHere.append('<hr>');

    // First we'll see if any results at all were returned, if not inform user
    if (!results.length) {
        resultsGoHere.append(
            `<div class="row"><h3>No stores were found matching the specified criteria</h3></div>`
        )
    }

    // If we do have results, however, we need to format each once nicely, then append it to the results area
    for (let i = 0; i < results.length; i++) {

        // Set up some containers for our data
        let newRow = $('<div class="row my-3">');
        let newCol1 = $('<div class="col-md-5 col-12">');

        // Add in our data
        newCol1.append(`
        <h5><a href="/stores/${results[i].id}">${results[i].name}</a></h5> 
        <h6><a class="addressLink" target="_blank" href="https://www.google.com/maps/place/${results[i].address.split(' ').join('+')}">${results[i].address}</a></h6> 
        `)

        // Append applicable categories to newCol1
        let categoryList = $('<p>Categories: </p>');
        let categoryListString = '';
        if (results[i].hasFashion) { categoryListString += ' Fashion,' }
        if (results[i].hasFurniture) { categoryListString += ' Furniture,' }
        if (results[i].hasHomeGoods) { categoryListString += ' Home Goods,' }
        if (results[i].hasMisc) { categoryListString += ' Miscelaneous,' }

        categoryList.append(categoryListString.slice(0, -1))

        // Then throw the column into the row and append the row to the page
        newCol1.append(categoryList);
        newRow.append(newCol1);
        resultsGoHere.append(newRow);

    }
};