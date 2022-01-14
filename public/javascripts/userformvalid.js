let timerValid = true;

$.validator.addMethod("numbersonly", function (value, element) {
    return this.optional(element) || /^[0-9]+$/i.test(value);
}, "Digits only please");

$(document).ready(function () {
    validateUserSignUpForm();
    validateOtpVerifyForm();
    validateUserLoginForm();
    startCountDown();
    validateUserOtpLoginForm();
    validateSeatCountSelectForm();
});

function validateUserSignUpForm() {
    const valid = $('#userSignUp').validate({
        rules: {
            name: {
                required: true,
                minlength: 5,
                lettersonly: true
            },
            email: {
                required: true,
                email: true,
            },
            password: {
                required: true,
                minlength: 8
            },
            mobile: {
                required: true,
                numbersonly: true,
                maxlength: 10,
                minlength: 10
            },
            confirmpassword: {
                required: true,
                minlength: 8,
                normalizer: function (value) {
                    return $.trim(value);
                },
                equalTo: "#password"
            }
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
    return valid;
}

function validateUserLoginForm() {
    const valid = $('#userLogin').validate({
        rules: {
            password: {
                required: true,
                minlength: 8
            },
            mobile: {
                required: true,
                numbersonly: true,
                maxlength: 10,
                minlength: 10
            }
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
    return valid;
}

function validateUserOtpLoginForm() {
    const valid = $('#userOtpLogin').validate({
        rules: {
            mobile: {
                required: true,
                numbersonly: true,
                maxlength: 10,
                minlength: 10
            }
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
    return valid;
}



function validateOtpVerifyForm() {
    if (!timerValid) {
        return false;
    }
    const valid = $('#userOtpVerify').validate({
        rules: {
            verificationCode: {
                required: true,
                numbersonly: true,
                maxlength: 6,
                minlength: 6
            }
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
    return valid;
}

function validateSeatCountSelectForm(){
    const valid = $('#seatCountSelectForm').validate({
        ignore: [],
        rules: {
            seat_count: {
                required : true,
                numbersonly : true,
                maxlength : 2,
                minlength : 1
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
    return valid;
}

function startCountDown(){
    timerValid = true;
    var d1 = new Date();
    var countDownDate = new Date(d1);
    countDownDate.setSeconds(d1.getSeconds() + 120);
    countDownDate.getTime()
    
    var x = setInterval(function () {
        var now = new Date().getTime();
        var distance = countDownDate - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        $("#otp_timer").html( minutes + "m " + seconds + "s ");
        
        // If the count down is finished, write some text
        if (distance < 0) {
            clearInterval(x);
            $("#otp_timer").html(`EXPIRED`);
            $('.resend_div').show();
            $('.submit_div').hide();
            timerValid = false;
        }
    }, 1000);
}

$('.btn_otp_resend').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: '/resend_otp',
        success: function (result) {
            startCountDown();
            timerValid = true;
            $('.resend_div').hide();
            $('.submit_div').show();
        },
        error: function (result) {
            alert('error');
        }
    });
});