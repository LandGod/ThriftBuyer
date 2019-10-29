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

    // Add tag button handler. Not able to be triggerd unless the user is logged in, since
    // otherwise the button with have 'disabled' on it
    $('#addTagButon').click(function (event) {

        // Make sure the bad intput alert is hidden and reset to default text
        $('#tagAlert').attr('hidden', 'true');
        $('#tagAlert').text('Sorry, something went wrong.')

        // Remove any existing text previously entered by user
        $('#addTagField').val('');

        // Show modal
        $('#addTag').modal('show');

        // Clear out any existing click handlers for the submit button
        $('#addTagConfirm').off();

        // Set new click handler for accept button
        $('#addTagConfirm').click(function (event) {

            // Check for valid input. If input is not valid, show boostrap alert w/ error message
            if ($('#addTagField').val().length < 2) {
                $('#tagAlert').text('Tag too short. Must be at least 2 letters long.');
                $('#tagAlert').removeAttr('hidden');

            } else {
                $.ajax({
                    dataType: "json",
                    method: 'POST',
                    url: '/api/tag',
                    data: {
                        CategoryEntryId: currentCategoryId,
                        tagText: $('#addTagField').val()
                    }
                })
                    .done(() => {
                        $('#addTagField').val('')
                        renderTags();
                        $('#addTag').modal('hide');

                    })
                    .fail((err) => {
                        $('#tagAlert').text('Sorry, something went wrong.');
                        console.log('Error:');
                        console.log(err);
                        $('#tagAlert').removeAttr('hidden');
                    });
            }
        });
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
        clearRatingsArea();

        // Retrieve information about the selected store category
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

                // Save ratings data
                const ratingsData = {};
                for (let i = 0; i < ratingTypes.length; i++) {
                    ratingsData[ratingTypes[i]] = results[`${ratingTypes[i]}Avg`];
                };

                // Render stars based on rating percentage
                for (const key in ratingsData) {
                    const starPercentage = (ratingsData[key] / 3) * 100;
                    const starPercentageRounded = `${(Math.round(starPercentage / 10) * 10)}%`;
                    $(`.${key}RatingStars .stars-inner`).css('width', starPercentageRounded);
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
                $('#addTagButon').removeAttr('disabled');

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
                    $('#addTagButon').removeAttr('disabled');

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

        // Because this function doesn't interact with user login status, and others already do,
        // we'll call the function to enable the add tag button in renderNote()'s ajax .done clause
        // since that can only execute when a user is logged in

        if (!currentCategoryId) { return }

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

                if (results.length === 0) { $('#tagsGoHere').html('<span class="text-secondary">This category does not have any tags on it yet.</span>') }

                for (let i = 0; i < results.length; i++) {
                    let tagText = results[i].tagText;
                    if (i > 0) { tagText = ', ' + tagText }
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

    // Reverts most dynamic page data (ie: ratings) to defaults prior so that they can be updated
    function clearRatingsArea() {

    };

});