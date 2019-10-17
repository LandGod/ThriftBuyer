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
        .done(() => {
            $('#successModal').modal('show');
        })
        .fail((err) => {
            console.log('failed')
            console.log(err)
        })

});