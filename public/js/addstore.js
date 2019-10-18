$('#newStoreSubmit').click(function(event) {
    
    // Make sure page doesn't reload itself
    event.preventDefault();

    // Check that at least one category was selected
    let checked = $("input[type=checkbox]:checked").length;

      if(!checked) {
        $('#noCategoryAlert').removeAttr('hidden');
        return false;
      }

    // Gather info from DOM and store in an object which we can pass directly to our AJAX call
    let storeInfo = {};
    let anyCategory = false;
    $('.categoryInput').each(function(){

        if($(this).prop("checked")) {
            
            storeInfo[$(this).val()] = true;
            anyCategory = true;
        }
    })

    storeInfo['name'] = $("#storeName").val();
    storeInfo['address'] = $('#storeAddress').val();

    // We're already doing form validation, but let's validate again for safety
    if (!anyCategory) {
        alert('Something went wrong!')
        throw(new Error('No category was selected!'))
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
            $('#successModal').on('hidden.bs.modal', function(){
                location.replace(`stores/${info.newStoreId}`)
            });
        })
        .fail((err) => {
            console.log('failed')
            console.log(err)
        })

});