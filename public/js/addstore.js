$('#newStoreSubmit').click(function(event) {
    event.preventDefault();

    let storeInfo = {};
    $('.categoryInput').each(function(){

        if($(this).prop("checked")) {
            
            storeInfo[$(this).val()] = true;
        }
    })

    storeInfo['name'] = $("#storeName").val();
    storeInfo['address'] = $('#storeAddress').val();

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