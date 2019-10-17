$(document).ready(function () {  // $.ready not working for some reason. TODO: Figure out why (Low priority issue, since program works without it)

    // Create hooks for the two places we want to render content
    const ratingsArea = $('#ratingsColumn');
    const personalNotesArea = $('#personalNotesColumn');

    // We'll also grab some data that will be used througout 
    const storeId = $('#storeInfo').attr('storeId');
    const ratingTypes = ['quality', 'quantity', 'price'];
    let currentCategoryId;  // Must be updated each time we display a new category


    // Iterate through category buttons on page to build list of available categories
    const categoryList = [];
    $('.categoryTitleButton').each(function () {
        categoryList.push($(this).text().toLowerCase());
    })

    // Before setting up our on click event, we'll go ahead and render the first category we have available
    renderCategory(0);

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



    });

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
                console.log(err)
            })

    });

    // Define function for rendering all information about one category onto a store page
    // Note that rather than supply a category by name, we'll simply reference its index within the list of available categories
    function renderCategory(index) {

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

    // Calls toUpperCase only on the first letter of each word in the string, then returns the entire modified string
    function capitalize(string) {

        let words = string.split(' ');
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
        };

        return words.join('');
    };

});