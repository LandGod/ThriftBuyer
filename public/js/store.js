$(document).ready(function () {  // $.ready not working for some reason. TODO: Figure out why (Low priority issue, since program works without it)

    // Create hooks for the two places we want to render content
    const ratingsArea = $('#ratingsColumn');
    const personalNotesArea = $('#personalNotesColumn');

    // We'll also grab some data that will be used througout 
    const storeId = $('#storeInfo').attr('storeId');
    const ratingTypes = ['quality', 'quantity', 'price'];
    let currentCategoryId;  // Must be updated each time we display a new category
    let currentCatgoryIndex;


    // Iterate through category buttons on page to build list of available categories
    const categoryList = [];
    $('.categoryTitleButton').each(function () {
        categoryList.push($(this).text().toLowerCase());
    })

    // Before setting up our on click event, we'll go ahead and render the first category we have available
    renderCategory(0);
    renderTags();

    // Attach click event to each category button
    $('body').on('click', '.categoryTitleButton', function () {

        // Since we used the button text as our array elements for categoryList, we can use findIndex with that same text to 
        // see which list element we've found and then call renderCategory on it

        let catName = $(this).text().toLowerCase();
        if (catName === 'homegoods') { catName = 'home goods' };
        let ind = categoryList.indexOf(catName);
        if (ind === -1) {
            console.log(categoryList)
            throw (new Error(`Bad Categoy Name ${catName}`))
        }

        renderCategory(ind);
    })

    // Attach click event for each personal rating button
    $('body').on('click', '.personalRatingButton', function () {
        let button = $(this);
        let ratingType = button.attr('ratingType');

        //If the rating clicked is already the current rating saved for this user, then do nothing
        if (button.attr('currentRating') === 'true') { return };

        let updatePackage = {};
        updatePackage['categoryId'] = currentCategoryId;

        updatePackage[`${ratingType}`] = button.val();

        $.ajax({
            dataType: "json",
            method: 'PUT',
            url: '/api/note',
            data: updatePackage
        })
            .done(() => {
                // On success, update the user ratings buttons to reflect new ratings
                renderUserRatings();
                renderCategory(currentCatgoryIndex);
            })
            .fail((err) => {
                console.log('Error:')
                console.log(err)
            })


    });

    // Sends whatever text is in the user notes area to the server to update the user note entry
    // If no user note entry exists, one is created with the supplied text
    // Either way, the page is refreshed when a response is recieved from the server
    $('#saveButton').click(function (event) {
        event.preventDefault(); // Stop page from reloading

        let noteText = $('#NoteTextArea').val();

        $.ajax({
            dataType: "json",
            method: 'PUT',
            url: '/api/note',
            data: {
                categoryId: currentCategoryId,
                note: noteText
            }
        })
            .done(() => {
                renderNote();
                $('#saveSuccessModal').modal('show');
            })
            .fail((err) => {
                console.log('ERROR:')
                console.log(err)
            })

    });

    // Generates a popover with a list of available categories to add
    // Upon clicking one, a modal will apear asking the user if they are sure
    // If the user clicks create, then the category entry is added to the database and the page refreshes. 
    // If the user clicks cancel, nothing happens
    $('#addCategoryButton').click(function (event) {

        event.preventDefault();

        $('#addCategoryButton').popover({
            html: true,
            content: function () {
                return $('#categoriesToAdd').html();
            }
        });

        $('#addCategoryButton').popover('show');

        $('.addCatButton').click(function (event) {

            // Add category name to modal text
            let catName = $(this).text();
            if (catName === 'HomeGoods') { catName = 'Home Goods' };
            $('#modalCategoryNameInsert').text($(this).text())
            $('#addCategoryConfirm').modal('show')

            // Remove any existing click handler from the confirm button of the modal
            $('#addCategoryConfirmConfirm').off();

            // Build new dynamic event listener which makes the appropriate ajax call based on the desired category

            $('#addCategoryConfirmConfirm').click((event) => {

                let catType = $(this).text().toLowerCase().trim();
                if (catType === 'homegoods') { catType = 'home goods' };

                $.ajax({
                    dataType: "json",
                    method: "POST",
                    url: '/api/category',
                    data: {
                        StoreId: $('#storeInfo').attr('storeId'),
                        type: catType
                    }
                })
                    .done((results) => {
                        location.reload();

                    })

                    .fail(function (err) {
                        console.log('*******ERROR********')
                        alert('Something went wrong');
                        console.log(err)

                    })

            });

        })

    });

    // Define function for rendering all information about one category onto a store page
    // Note that rather than supply a category by name, we'll simply reference its index within the list of available categories
    function renderCategory(index) {

        currentCatgoryIndex = index;

        // Before actually grabbing any data, we'll indicate to the user that we're selecting a new category by setting all buttons
        // to bootstrap gray (secondary)
        $('.categoryTitleButton').removeClass('btn-primary');
        $('.categoryTitleButton').addClass('btn-secondary')

        // I've gotten myself into a lot of hot water by having a category name with a space in it. In this instance, handlebars is rendering
        // my Home Goods button with the class 'Home GoodsButton' which is of course actually 1 class called 'Home' and one class
        // called 'GoodsButton'. I'm not going to sit here and say that that's okay, but due to the deadline on this project, 
        // my solution will simply be to detect instances where my program wants to call '.HomeGoodsButton' and manually change that query
        // to instead look for '.GoodsButton
        let buttonClassName = `.${capitalize(categoryList[index])}Button`;
        if (buttonClassName === '.HomeGoodsButton') { buttonClassName = '.GoodsButton' };

        // Then we'll change the selected to category button to blue (primary) to indicate it was selected
        $(buttonClassName).removeClass('btn-secondary');
        $(buttonClassName).addClass('btn-primary');

        // Then we'll clear out the existing data to make way for the new data
        ratingsArea.empty();

        $.ajax({
            dataType: "json",
            url: '/api/category',
            data: {
                storeId: storeId,
                type: categoryList[index]
            }
        })
            .done((results) => {
                // First we update our global current category variable, since we'll need this info to work with user specific notes
                currentCategoryId = results.id;

                // Then construct the rating rows and output it to the DOM
                for (let i = 0; i < ratingTypes.length; i++) {
                    let categoryRow = $('<div class="row">');
                    let categoryCol = $('<div class="col-md-6 col-12">');

                    categoryCol.append(`<span class="h5">${capitalize(ratingTypes[i])}: </span><span>${results[ratingTypes[i] + 'Avg']}</span>`);

                    categoryRow.append(categoryCol);

                    ratingsArea.append(categoryRow);
                }

                // After constructing the global elements of the category, we'll update  the user notes section if possible
                renderNote();
                renderUserRatings();
                renderTags();
            })

            .fail(function (err) {
                    console.log('querie failed');
                    console.log(err);
            })
    };

    // Definte function for rendering peronal ratings and text note for this specific user for this specific category
    function renderNote() {

        //Before doing anything else, we want to reset the note area so we don't carry over old data by accident
        $('#NoteTextArea').val('');

        // We'll start by checking the database to see if the user has any data to render
        $.ajax({
            dataType: "json",
            method: "GET",
            url: '/api/note',
            data: {
                categoryId: currentCategoryId
            }
        })
            .done((results) => {
                let noteText = results.textNote;
                $('#NoteTextArea').val(noteText);
                $('#saveButton').removeAttr('disabled');

            })

            .fail(function (err) {

                // If we recieve an error, we first want to check if its one of two expected errors
                // 401 simply means the user isn't logged in and 404 means they are but just don't have any saved info.
                // Neither of these are actually an error, per se, but nontheless should be dealt with

                if (err.status === 401) {
                    $('#NoteTextArea').val('You must be logged in to rate or take notes on this store.');
                    $('#NoteTextArea').attr('readonly', true);
                    $('.personalRatingButton').attr('disabled', true);
                }
                else if (err.status === 404) {
                    $('#saveButton').removeAttr('disabled');
                }
                else {
                    console.log('Something went wrong.')
                    console.log(err)
                }

            });

    };

    function renderUserRatings() {

        // First thing we'll reset the buttons to thier default settings so that we don't cary over old info
        $('.personalRatingButton').removeClass('btn-primary');
        $('.personalRatingButton').addClass('btn-light');
        $('.personalRatingButton').attr('currentRating', 'false');

        // We'll start by checking the database to see if the user has any data to render
        $.ajax({
            dataType: "json",
            method: "GET",
            url: '/api/note',
            data: {
                categoryId: currentCategoryId
            }
        })
            .done((results) => {
                let qualityRating = results.quality || 0;
                let quantityRating = results.quantity || 0;
                let priceRating = results.price || 0;

                let allThreeRatings = [qualityRating, quantityRating, priceRating];
                let allThreeTypes = ['quality', 'quantity', 'price'];

                // Scan through each possible rating (1 through 3), and then each button each category
                for (let i = 1; i < 4; i++) {
                    for (let j = 0; j < allThreeRatings.length; j++) {
                        if (parseInt(allThreeRatings[j]) >= parseInt(i)) {

                            // If the category rating is greater than or equal to the button value
                            // color in the button
                            $(`#${allThreeTypes[j]}Rate${i}`).removeClass('btn-light');
                            $(`#${allThreeTypes[j]}Rate${i}`).addClass('btn-primary');

                            // If the value is exactly equal, set the button's 'currentRating' value to 'true'
                            // This keeps us from updating the rating to a value it already is
                            if (parseInt(allThreeRatings[j]) === parseInt(i)) {
                                $(`#${allThreeTypes[j]}Rate${i}`).attr('currentRating', 'true');
                            }

                        }
                    }
                }

            })

            .fail(function (err) {

                // If we recieve an error, we first want to check if its one of two expected errors
                // 401 simply means the user isn't logged in and 404 means they are but just don't have any saved info.
                // Neither of these are actually an error, per se, but nontheless should be dealt with

                if (err.status === 401) {
                    $('.personalRatingButton').attr('diabled', 'true');
                }
                else if (err.status === 404) {
                    $('.personalRatingButton').removeAttr('diabled');
                }
                else {
                    console.log('Something went wrong.')
                    console.log(err)
                }

            });
    }

    function renderTags() {

        if (!currentCategoryId) {return}

        $.ajax({
            dataType: "json",
            method: "GET",
            url: '/api/tags',
            data: {
                categoryId: currentCategoryId
            }
        })
            .done((results) => {
                $('#tagsGoHere').empty()

                if (results.length === 0) {$('#tagsGoHere').text('This category does not have any tags on it yet.')}
                
                for (let i = 0; i < results.length; i++) {
                    let tagText = results[i].tagText;
                    if (i > 0) {tagText = ', ' + tagText}
                    $('#tagsGoHere').append(tagText)
                }
            })
            .catch((err) => {
                console.log('Error:')
                console.log(err)
            });
    };

    // Calls toUpperCase only on the first letter of each word in the string, then returns the entire modified string
    function capitalize(string) {

        let words = string.split(' ');
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        };

        return words.join('');
    };

});