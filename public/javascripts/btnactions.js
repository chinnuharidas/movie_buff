$('.get_image_form').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: ($(this).data('user') == 'owner') ? '/owner/theatre/imgform/' + $(this).data('id') : '/admin/theatre/imgform/' + $(this).data('id'),
        success: function (result) {
            $('.modal-content').html(result);
            $('#exampleModal').modal('show')
        },
        error: function (result) {
            alert('error');
        }
    });
});

var _URL = window.URL || window.webkitURL;

$(document).on('change', '#movie_image',function(e){
    var file, img;
    let width, height;
    if ((file = this.files[0])) {
        img = new Image();
        var objectUrl = _URL.createObjectURL(file);
        img.onload = function () {
            width = this.width;
            height = this.height;
            _URL.revokeObjectURL(objectUrl);

            if (parseInt(width) < 500 || parseInt(height) < 750){
                Swal.fire(
                    'Image Size',
                    'Image should be greater than 500 * 750',
                    'question'
                )
                $('#frmImageUpload')[0].reset();
            }

        };
        img.src = objectUrl;
    }
});

$(document).on('change', '#movie_backdrop_image',function(e){
    var file, img;
    let width, height;
    if ((file = this.files[0])) {
        img = new Image();
        var objectUrl = _URL.createObjectURL(file);
        img.onload = function () {
            width = this.width;
            height = this.height;
            _URL.revokeObjectURL(objectUrl);

            if (parseInt(width) < 500 || parseInt(height) < 281){
                Swal.fire(
                    'Image Size',
                    'Image should be greater than 500 * 281',
                    'question'
                )
                $('#frmBackdropUpload')[0].reset();
            }

        };
        img.src = objectUrl;
    }
});


$('.get_movie_image_form').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: $(this).data('actionpath'),
        success: function (result) {
            $('.modal-content').html(result);
            $('#exampleModal').modal('show')
        },
        error: function (result) {
            alert('error');
        }
    });
});

$('.btn_get_movie_info').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: $(this).data('actionpath'),
        success: function (result) {
            $('.big_modal').html(result);
            $('.bd-example-modal-lg').modal('show')
        },
        error: function (result) {
            alert('error');
        }
    });
});

$('.get_profile_pic_form').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: ($(this).data('user') == 'owner') ? '/owner/theatre/profilepicform/' + $(this).data('id') : '/admin/theatre/profilepicform/' + $(this).data('id'),
        success: function (result) {
            $('.modal-content').html(result);
            $('#exampleModal').modal('show')
        },
        error: function (result) {
            alert('error');
        }
    });
});

$('.get_status_upd_form').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: '/admin/theatre/statusUpdForm/' + $(this).data('status') + '/' + $(this).data('id'),
        success: function (result) {
            $('.modal-content').html(result);
            $('#exampleModal').modal('show')
        },
        error: function (result) {
            alert('error');
        }
    });
});


$('.get_user_block_form').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: '/admin/user/statusUpdForm/' + $(this).data('status') + '/' + $(this).data('id'),
        success: function (result) {
            $('.modal-content').html(result);
            $('#exampleModal').modal('show')
        },
        error: function (result) {
            alert('error');
        }
    });
});

$('.swal-confirm').click(function (e) {
    e.preventDefault();
    let message = $(this).data('message');
    if (!message){
        message = '';
    }
    Swal.fire({
        title: 'Are you sure?',
        text: "Are you sure to perform this step?" + message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: "POST",
                url: $(this).data('actionpath'),
                success: function (result) {
                    location.reload();
                },
                error: function (result) {
                    alert('error');
                }
            });
        }
    })
});

const alphabetArr = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z'
];

$('.row_colums_change').change(function(e){
    seatArrangement()
});

function seatArrangement(){
    const rows = parseInt($('#rows').val());
    const columns = parseInt($('#columns').val());

    const recliner_price = $('#recliner_price').val()
    const recliner = parseInt($('#recliner').val());
    let recliner_temp = recliner;

    const prime_price = $('#prime_price').val()
    const prime = parseInt($('#prime').val());
    let prime_temp = prime;

    const classic_plus_price = $('#classic_plus_price').val()
    const classic_plus = parseInt($('#classic_plus').val());
    let classic_plus_temp = classic_plus;

    const classic_price = $('#classic_price').val()
    const classic = parseInt($('#classic').val());
    let classic_temp = classic;

    let isSplit = false;

    if (rows == recliner + prime + classic_plus + classic || isNaN(rows)){
        isSplit = true;
        $("#screenForm div.error").html("");
    }else{
        $("#screenForm div.error").html("Screen splitted incorrectly.")
    }

    let tblHtml = '';
    const deletedValues = $.map($('input[name="deleted[]"]'), function(el) { return el.value; });
    if (rows > 0 && rows <= 26 && columns > 0 && columns <= 25){
        
        for (var i=0; i< rows; i++){
            if (isSplit){
                if (recliner_temp == recliner ){
                    tblHtml += `<tr>
                    <th class="text-center" colspan="${columns}">Recliner Rows - Rs. ${recliner_price} /- </th>
                    </tr>`;
                }

                if (recliner_temp == 0){
                    if (prime_temp == prime ){
                        tblHtml += `<tr>
                        <th class="text-center" colspan="${columns}">Prime Rows - Rs. ${prime_price} /- </th>
                        </tr>`;
                    }
                }

                if (recliner_temp == 0 && prime_temp == 0){
                    if (classic_plus_temp == classic_plus ){
                        tblHtml += `<tr>
                        <th class="text-center" colspan="${columns}">Classic Plus Rows - Rs. ${classic_plus_price} /- </th>
                        </tr>`;
                    }
                }

                if (recliner_temp == 0 && prime_temp == 0 && classic_plus_temp == 0){
                    if (classic_temp == classic ){
                        tblHtml += `<tr>
                        <th class="text-center" colspan="${columns}">Classic Plus Rows - Rs. ${classic_price} /- </th>
                        </tr>`;
                    }
                }
            }

            tblHtml += `<tr>`;
            
            for (var j=1; j <= columns; j++){
                if (deletedValues.includes(`${alphabetArr[i]}${j}`)){
                    tblHtml += `<td class="text-center td_${alphabetArr[i]}${j}">
                    <span class="p-2 btn-secondary">${alphabetArr[i]}${j}</span>
                    <button type="button" class="btn btn-success btn-xs" onclick="addScreen('${alphabetArr[i]}${j}')"><i class="fa fa-plus"></i></button>
                    </td>`
                }else{
                    tblHtml += `<td class="text-center td_${alphabetArr[i]}${j}">
                    <span class="p-2 btn-success">${alphabetArr[i]}${j}</span>
                    <button type="button" class="btn btn-danger btn-xs" onclick="deleteScreen('${alphabetArr[i]}${j}')"><i class="fa fa-trash"></i></button>
                    </td>`
                }  
            }

            tblHtml += '</tr>'
            
            if (isSplit){
                if (recliner_temp == 0 && prime_temp == 0 && classic_plus_temp == 0 && classic_temp > 0){
                    classic_temp = classic_temp - 1;
                }
                
                if (recliner_temp == 0 && prime_temp == 0 && classic_plus_temp > 0){
                    classic_plus_temp = classic_plus_temp - 1;
                }

                if (recliner_temp == 0 && prime_temp > 0){
                    prime_temp = prime_temp - 1;
                }

                if (recliner_temp > 0){
                    recliner_temp = recliner_temp - 1;
                }
            }
        }
    }
    $('.screen_seat_tbl').html(tblHtml);
}

function deleteScreen(seatno){
    Swal.fire({
        title: 'Are you sure?',
        text: `Are you sure to delete seat ${seatno}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
    }).then((result) => {
        if (result.isConfirmed) {
            $('.add_deleted_screens').append(
                `<input type="hidden" name="deleted[]" value="${seatno}" id="id_${seatno}" >`
            )
            $(`.td_${seatno}`).html(
                `<span class="p-2 btn-secondary">${seatno}</span>
                <button type="button" class="btn btn-success btn-xs" onclick="addScreen('${seatno}')"><i class="fa fa-plus"></i></button>
                `
            )
        }
    });
}

function addScreen(seatno){
    Swal.fire({
        title: 'Are you sure?',
        text: `Are you sure to add seat ${seatno}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
    }).then((result) => {
        if (result.isConfirmed) {
                $(`#id_${seatno}`).remove();
            $(`.td_${seatno}`).html(
                `<span class="p-2 btn-success">${seatno}</span>
                <button type="button" class="btn btn-danger btn-xs" onclick="deleteScreen('${seatno}')"><i class="fa fa-trash"></i></button>
                `
            )
        }
    });
}

$(document).ready(function(){
    seatArrangement();
})

$('.btn_owner_report').click(function(e){
    e.preventDefault();
    if ($('#report_movie').val() || $('#report_screen').val()){
        $.ajax({
            type: "POST",
            url: '/owner/report/get_report',
            data: {
                report_movie : $('#report_movie').val(),
                report_screen : $('#report_screen').val()
            },
            success: function (result) {
                let i = 1;
                let htmlStr = '';
                $('#example1').DataTable().clear().destroy();
                result.forEach(element => {
                    htmlStr += `<tr>
                        <td>${i}</td>
                        <td>${element.screenDetails.name}</td>
                        <td>${element.movieDetails.title}</td>
                        <td>${element.mappingDetails.start_time}</td>
                        <td>${element.date}</td>
                        <td>`
                    let j = 1;
                    element.display_seats.forEach(innerElem => {
                        if (j > 1) htmlStr += ',';
                        htmlStr += innerElem;
                        j++;
                    })
                    htmlStr += `</td>
                        <td>
                            ${element.totalAmount}
                        </td>
                    </tr>`;
                    i++;
                });
                $('.report_tbody').html(htmlStr);

                $("#example1").DataTable({
                    "responsive": true, "lengthChange": false, "autoWidth": false,
                    "buttons": ["copy", "csv", "excel", "pdf", "print", "colvis"]
                }).buttons().container().appendTo('#example1_wrapper .col-md-6:eq(0)');
                

            },
            error: function (result) {
                alert('error');
            }
        });
    }
})


$('.btn_admin_report').click(function(e){
    e.preventDefault();
    if ($('#report_movie').val() || $('#report_screen').val()){
        $.ajax({
            type: "POST",
            url: '/admin/report/get_report',
            data: {
                report_movie : $('#report_movie').val(),
                report_screen : $('#report_screen').val()
            },
            success: function (result) {
                let i = 1;
                let htmlStr = '';
                $('#example1').DataTable().clear().destroy();
                result.forEach(element => {
                    htmlStr += `<tr>
                        <td>${i}</td>
                        <td>${element.theatreDetails.name} - ${element.screenDetails.name}</td>
                        <td>${element.movieDetails.title}</td>
                        <td>${element.mappingDetails.start_time}</td>
                        <td>${element.date}</td>
                        <td>`
                    let j = 1;
                    element.display_seats.forEach(innerElem => {
                        if (j > 1) htmlStr += ',';
                        htmlStr += innerElem;
                        j++;
                    })
                    htmlStr += `</td>
                        <td>
                            ${element.totalAmount}
                        </td>
                    </tr>`;
                    i++;
                });
                $('.report_tbody').html(htmlStr);

                $("#example1").DataTable({
                    "responsive": true, "lengthChange": false, "autoWidth": false,
                    "buttons": ["copy", "csv", "excel", "pdf", "print", "colvis"]
                }).buttons().container().appendTo('#example1_wrapper .col-md-6:eq(0)');
                

            },
            error: function (result) {
                alert('error');
            }
        });
    }
})



$('.btn_admin_month_report').click(function(e){
    e.preventDefault();
    if ($('#report_movie').val()){
        $.ajax({
            type: "POST",
            url: '/admin/month/get_report',
            data: {
                report_movie : $('#report_movie').val()
            },
            success: function (result) {
                let i = 1;
                let htmlStr = '';
                $('#example1').DataTable().clear().destroy();
                result.forEach(element => {
                    let adminShare = parseInt(element.sum * 20 / 100)
                    let ownerShare = parseInt(element.sum * 80 / 100)
                    htmlStr += `<tr>
                        <td>${i}</td>
                        <td>${element._id.name}</td>
                        <td>${element._id.date}</td>
                        <td>${element.sum}</td>
                        <td>${adminShare}</td>
                        <td>${ownerShare}</td>`
                    htmlStr += `</tr>`;
                    i++;
                });
                $('.report_tbody').html(htmlStr);

                $("#example1").DataTable({
                    "responsive": true, 
                    "lengthChange": false, 
                    "autoWidth": false,
                    "buttons": ["copy", "csv", "excel", "pdf", "print", "colvis"]
                }).buttons().container().appendTo('#example1_wrapper .col-md-6:eq(0)');
                

            },
            error: function (result) {
                alert('error');
            }
        });
    }
})


$('.get_movie_details').click(function(e){
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: $(this).data('actionpath'),
        data: {
            movie_name : $('#movie_name').val(),
        },
        success: function (result) {
            if (result.status){
                $('.movies_list_from_api').html(result.view);
            }else{
                $('#api_movie_id').val('');
                $('.movies_list_from_api').html('<tr><td colspan="7">NO MOVIES FOUND....!</td>')
            }
        },
        error: function (result) {
            alert('error');
        }
    });
})

function movie_clicked(id){
    $('#api_movie_id').val(id);
    $('.all_btns').show();
    $('#btn_'+id).hide();
    $('tr').removeClass('bg-dark')
    $('#btn_'+id).parents('tr').addClass('bg-dark')
    $('.all_select_btns').hide();
    $('#selected_btn_'+id).show();
}

$('.time_format').timepicker({
    'timeFormat': 'H:i:s' ,
    'step': 15
});

$('.btn_show_modal').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: $(this).data('action'),
        success: function (result) {
            if (result.status){
                $('.modal-content').html(result.view);
                $('#exampleModal').modal('show')
            }
        },
        error: function (result) {
            alert('error');
        }
    });
});