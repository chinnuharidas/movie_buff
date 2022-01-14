$(document).on('click', '.btn_seat_count_select', function () {
    $('.btn_seat_count_select').addClass('btn-secondary');
    $('.btn_seat_count_select').removeClass('btn-danger');
    $(this).removeClass('btn-secondary');
    $(this).addClass('btn-danger')
    $('#seat_count').val($(this).data('value'));
});

$(document).on('click', '.btn_available_seat', function () {
    const seatDisplay = $(this).data('display');
    const seatValue = $(this).data('value');
    const seat_count = $('#seat_count_in').val();
    const type = $(this).data('type');

    if (!$('.seat_' + seatValue).val()) {

        $('.actual_seat_div').append(
            `<input name="original_seats" class="original_class seat_${seatValue}" value="${seatValue}" >`
        );

        $('.display_seat_div').append(
            `<input name="display_seats" value="${seatDisplay}" >
            <input name="seat_type" value="${type}" >`
        );
    }

    const selected = $('.original_class').length;

    if (parseInt(selected) === parseInt(seat_count)) {
        $('.btn_go_pay').show();
        $(this).addClass('btn-success');
    } else if (parseInt(selected) > parseInt(seat_count)) {
        $('.btn_available_seat').removeClass('btn-success')

        if (parseInt(seat_count) > 1) {
            $('.btn_go_pay').hide();
        }

        $('.actual_seat_div').html(
            `<input name="original_seats" class="original_class" value="${seatValue}" >`
        )
        $('.display_seat_div').html(
            `<input name="display_seats" value="${seatDisplay}" >
            <input name="seat_type" value="${type}" >`
        );

        $(this).addClass('btn-success text-white');
    } else {
        $(this).addClass('btn-success text-white');
        $('.btn_go_pay').hide();
    }


    var originalSeatArr = new Array();
    $("input[name=original_seats]").each(function () {
        originalSeatArr.push($(this).val());
    });

    var displaySeatStr = '';

    $("input[name=display_seats]").each(function () {
        displaySeatStr += ' ' + $(this).val()
    });

    $('.selected_seat_display').html(displaySeatStr);

    $.ajax({
        type: "POST",
        url: '/disable-seats',
        data: {
            originalSeatArr: originalSeatArr,
            showDate: $('#show_date').val(),
            mapping_id: $('#mapping_id').val()
        },
        success: function (result) {
            console.log(result)
        },
        error: function (result) {
            alert('error');
        }
    });

});

let bookingTimerValid = true;
function bookingStartCountDown() {
    bookingTimerValid = true;
    var d1 = new Date();
    var countDownDate = new Date(d1);
    countDownDate.setSeconds(d1.getSeconds() + 180);
    countDownDate.getTime()

    var x = setInterval(function () {
        var now = new Date().getTime();
        var distance = countDownDate - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        $('#remaining_minutes').val(minutes);
        $('#remaining_seconds').val(seconds);
        $("#booking_timer").html(minutes + "m " + seconds + "s ");

        // If the count down is finished, write some text
        if (distance < 0) {
            $("#booking_timer").html(`EXPIRED`);
            console.log('in timer')
            clearInterval(x);
            bookingTimerValid = false;
            location.href = $('#seat_layout_path').val();
        }
    }, 1000);
}

let paymentTimerValid = true;
function paymentStartCountDown() {
    paymentTimerValid = true;
    var d1 = new Date();
    var countDownDate = new Date(d1);
    let startAt = (parseInt($('#remaining_minutes').val()) * 60) + parseInt($('#remaining_seconds').val())
    countDownDate.setSeconds(d1.getSeconds() + startAt);
    countDownDate.getTime()

    var x = setInterval(function () {
        var now = new Date().getTime();
        var distance = countDownDate - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        $('#py_remaining_minutes').val(minutes);
        $('#py_remaining_seconds').val(seconds);
        $("#booking_timer").html(minutes + "m " + seconds + "s ");

        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            $("#booking_timer").html(`EXPIRED`);
            location.href = $('#seat_layout_path').val();
            paymentTimerValid = false;
        }
    }, 1000);
}

$(document).ready(function () {
    if ($('#seat_count_in').val() && $('#booking_view').val()) {
        bookingStartCountDown();
    }

    if ($('#remaining_minutes').val() || $('#remaining_seconds').val()) {
        paymentStartCountDown();
    }
    getLocation();
})

$(document).on('click', '#paypal_booking_btn', function () {
    $.ajax({
        type: "POST",
        url: $(this).data('action'),
        success: function (result) {
            console.log(result)
        },
        error: function (result) {
            alert('error');
        }
    });
});

$(document).on('click', '#confirm_booking_btn', function () {
    $.ajax({
        type: "POST",
        url: $(this).data('action'),
        success: function (result) {
            if (result.status) {
                razorpayPaymentResponse(result.razorpay_response)
            } else {
                document.location.href = "/";
            }

        },
        error: function (result) {
            alert('error');
        }
    });
});

$(document).on('change', '.select_movie_date', function () {
    location.href = $(this).val()
});



function razorpayPaymentResponse(order) {
    var options = {
        "key": "rzp_test_eIOafJrfIzHrD6", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "MovieBuff",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            verifyPayment(response, order);
        },
        "prefill": {
            "name": "MovieBuff",
            "email": "info@moviebuff.com",
            "contact": "9899889989"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };

    var rzp1 = new Razorpay(options);
    rzp1.open();
}

function verifyPayment(payment, order) {
    $.ajax({
        url: '/verify-payment',
        data: {
            payment,
            order
        },
        method: 'POST',
        success: function (res) {
            if (res.status) {
                location.href = '/payment-success'
            } else {
                location.href = '/payment-fail'
            }
        }
    })
}

$('.language_chng').change(function () {
    updateMovieList();
});

$('.genre_chng').change(function () {
    updateMovieList();
});

$('.search_movie_inpt').keydown(function () {
    updateMovieList();
})


$('.filter_clear_check').click(function () {

    $('input[class="language_chng"]').each(function () {
        this.checked = false;
    });

    $('input[class="genre_chng"]').each(function () {
        this.checked = false;
    });

    $.ajax({
        url: '/movie_filter',
        data: {
            languageArr: [],
            genreArr: [],
            search_movie_input: ''
        },
        method: 'POST',
        success: function (res) {
            $('.movie_filter_list').html(res.list)
            $('.movie_filter_grid').html(res.grid)
            var img = $('.bg_img');
            img.css('background-image', function () {
                var bg = ('url(' + $(this).data('background') + ')');
                return bg;
            });
        }
    })
});
function updateMovieList() {
    var languageArr = new Array();

    $('.language_chng:checkbox:checked').each(function () {
        languageArr.push($(this).val())
    });

    var genreArr = new Array();

    $('.genre_chng:checkbox:checked').each(function () {
        genreArr.push($(this).val())
    });

    $.ajax({
        url: '/movie_filter',
        data: {
            languageArr: languageArr,
            genreArr: genreArr,
            search_movie_input: $('.search_movie_inpt').val()
        },
        method: 'POST',
        success: function (res) {
            $('.movie_filter_list').html(res.list)
            $('.movie_filter_grid').html(res.grid)
            var img = $('.bg_img');
            img.css('background-image', function () {
                var bg = ('url(' + $(this).data('background') + ')');
                return bg;
            });
        }
    })
}


$('.like_review').click(function () {
    let id = $(this).data('id');
    $.ajax({
        url: $(this).data('action'),
        method: 'POST',
        success: function (res) {
            if (res.status) {
                $('#like' + id).html(res.likes)
                $('#dislike' + id).html(res.dislikes)
            } else {
                Swal.fire(
                    'LogIn',
                    res.errorMsg
                )
            }
        }
    })
});


$('.add_review').click(function () {
    $('#review-modal').modal('show')
    $('#hidden_movieId').val($(this).data('id'))
    unit = $('input[type="range"]').attr('unit');
    $('input[type="range"]').rangeslider({
        polyfill: false,
        onInit: function () {
            this.$range.append($(valueBubble));
            updateValueBubble(null, null, this);
        },
        onSlide: function (pos, value) {
            updateValueBubble(pos, value, this);
        }
    });
});

$('#review_sbmt_btn').on('click', function() {
    if ($("#reviewForm").valid()){
        $.ajax({
            type: "POST",
            url: $('#reviewForm').attr('action'),
            data: $("#reviewForm").serialize(),
            success: function (result) {
                location.reload();
            },
            error: function (result) {
                alert('error');
            }
        });
    }
    
});

const valid = $('#reviewForm').validate({
    rules: {
        title: {
            required: true,
            minlength: 5,
        },
        text: {
            required: true,
            minlength: 5,
        },
    },
    errorElement: 'span',
    errorPlacement: function (error, element) {
        error.addClass('invalid-feedback');
        element.closest('.form-group').append(error);
    },
    highlight: function (element, errorClass, validClass) {
        $(element).addClass('is-invalid');
    },
    unhighlight: function (element, errorClass, validClass) {
        $(element).removeClass('is-invalid');
    }
});

function updateValueBubble(pos, value, context) {
    pos = pos || context.position;
    value = value || context.value;
    var $valueBubble = $('.rangeslider__value-bubble', context.$range);
    var tempPosition = pos + context.grabPos;
    var position = (tempPosition <= context.handleDimension) ? context.handleDimension : (tempPosition >= context.maxHandlePos) ? context.maxHandlePos : tempPosition;

    if ($valueBubble.length) {
        $valueBubble[0].style.left = Math.ceil(position) + 'px';
        $valueBubble[0].innerHTML = value + " " + unit;
    }
}

var valueBubble = '<output class="rangeslider__value-bubble mt-4" />';

var unit = $('input[type="range"]').attr('unit');

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        Swal.fire(
            'Warning..!',
            'Geolocation is not supported by this browser.'
        )
    }
}

function showPosition(position) {
    $.ajax({
        url : `/set_location/${position.coords.latitude}/${position.coords.longitude}`,
        type : 'POST',
        success:function(res){
            console.log(res)
        },
        error: function (result) {
            alert('error');
        }
    })
}

