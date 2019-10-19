var testGeoCode;

let userConfirmed = false; // Used to keep track of whether the confirm address modal closing is due to a cancel of confirm

$(document).ready(function () {
    var Geocoder = new google.maps.Geocoder();

    $('#newStoreSubmit').click(function (event) {

        // Make sure page doesn't reload itself
        event.preventDefault();

        // Check that at least one category was selected
        let checked = $("input[type=checkbox]:checked").length;

        if (!checked) {
            $('#noCategoryAlert').removeAttr('hidden');
            return false;
        }

        // Validate address
        let address = $('#storeAddress').val();
        getGeocode({ address: address })
            .then((results) => {

                let formattedAddress = results[0].formatted_address
                let latitude = results[0].geometry.location.lat();
                let longitude = results[0].geometry.location.lng();

                // If the geocode result is the same as the current address (ie: if the user has already accepted a change, then just proceed)
                // If not, we need to pop up a modal asking the user if we can change the address for them
                if (formattedAddress.trim().toLowerCase() == address.trim().toLowerCase()) { 
                    $('#confirmAddressBody').text(`Are you sure you want to create a new store with the address: ${formattedAddress}`)
                 }
                else {
                    $('#correctedAddressText').text(formattedAddress);
                }
                $('#confirmAddress').modal('show');

                $('#confirmAddressConfirm').off(); // Remove old event listenders so we aren't also submitting old data

                $('#confirmAddressConfirm').click(function () {

                    userConfirmed = true;
                    $('#confirmAddress').modal('hide');

                    // Gather info from DOM and store in an object which we can pass directly to our AJAX call
                    let storeInfo = {};
                    let anyCategory = false;
                    $('.categoryInput').each(function () {

                        if ($(this).prop("checked")) {

                            storeInfo[$(this).val()] = true;
                            anyCategory = true;
                        }
                    })

                    storeInfo['name'] = $("#storeName").val();
                    storeInfo['address'] = formattedAddress;
                    storeInfo['latitude'] = latitude;
                    storeInfo['longitude'] = longitude;

                    // We're already doing form validation, but let's validate again for safety
                    if (!anyCategory) {
                        alert('Something went wrong!')
                        throw (new Error('No category was selected!'))
                        return;
                    }

                    $.ajax({
                        dataType: "json",
                        method: 'POST',
                        url: '/api/stores',
                        data: storeInfo
                    })
                        .done((info) => {
                            // On success, inform the user with a modal, then redirect them to the new store page as soon as the modal is dismissed
                            $('#successModal').modal('show');
                            $('#successModal').on('hidden.bs.modal', function () {
                                location.replace(`stores/${info.newStoreId}`)
                            });
                        })
                        .fail((err) => {
                            if (err.responseJSON.original.code === 'ER_DUP_ENTRY') {

                                $('#addressErrorModalMessage').text(`A store with that address already exists in the database. You may not create duplicate store entries.`);
                                $('#addressErrorModal').modal('show');
                            }
                            else {
                            console.log('failed')
                            console.log(err)
                            }
                        })

                })


            })

            // Catch block for geocode request
            .catch((status) => {

                if (status == 'ZERO_RESULTS') {
                    $('#addressErrorModalMessage').text(`No locations matching that address could be found. Please try another address.`);
                } else if (status == 'OVER_QUERY_LIMIT') {
                    $('#addressErrorModalMessage').text(`Too many request to address checking service. Please try again later.`);
                } else {
                    $('#addressErrorModalMessage').text(`The address could not be checked due to an unknown error.`);
                }

                $('#addressErrorModal').modal('show');

                console.log(status);
            });

    });

    function getGeocode(addressLitteral) {
        return new Promise(function (res, reject) {
            Geocoder.geocode(addressLitteral, function (results, status) {
                if (status == 'OK') {
                    res(results)
                } else {
                    reject(status)
                }
            })
        })
    }

    // testGeoCode = function (address) {
    //     getGeocode({ address: address })
    //             .then((results) => {
    //                 console.log(results)

    //                 console.log('location:')
    //                 console.log(results[0].geometry.location)
    //                 console.log(results[0].geometry.location.lat())
    //                 console.log(results[0].geometry.location.lng())
    //             })
    //             .catch((status) => {
    //                 console.log('Error:')
    //                 console.log(status)
    //             })
    // }

})

// Deleting this function breaks google maps api integration even though it doesn't "do" anything
function initMap() {
    // Do nothing, but stop the google api complaining that this function doesn't exist
}