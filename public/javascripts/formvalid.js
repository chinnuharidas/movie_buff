function validateOwnerSignUpForm(){
    const valid = $('#ownerSignUp').validate({
        rules: {
            name: {
                required : true,
                minlength : 5,
                lettersonly : true
            },
            owner_name: {
                required : true,
                minlength : 5,
                lettersonly : true
            },
            owner_email: {
                required: true,
                email: true,
            },
            password: {
                required: true,
                minlength: 8
            },
            district: {
                required : true
            },
            location: {
                required : true,
                minlength : 3
            },
            lat: {
                required : true,
                minlength : 3
            },
            lng: {
                required : true,
                minlength : 3
            },
            owner_mobile: {
                required : true,
                numbersonly : true,
                maxlength : 10,
                minlength : 10
            },
            confirmpassword: {
                required: true,
                minlength: 8,
                normalizer: function(value) {
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

function validateOwnerLoginForm(){
    const valid = $('#ownerLoginForm').validate({
        rules: {
            password: {
                required: true
            },
            owner_mobile: {
                required : true,
                numbersonly : true
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


function validateAdminLoginForm(){
    const valid = $('#adminLoginForm').validate({
        rules: {
            password: {
                required: true
            },
            email: {
                required : true,
                email : true
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


function validateRemarksForm(){
    const valid = $('#remarksForm').validate({
        rules: {
            status_update_remarks: {
                required : true,
                minlength : 3
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

function validateScreenForm(){
    const valid = $('#screenForm').validate({
        rules: {
            name:{
                required : true
            },
            rows:{
                required : true,
                numbersonly: true,
                min: 2,
                max: 26
            },
            columns:{
                required:true,
                numbersonly: true,
                min:2,
                max : 25
            },
            recliner:{
                required:true,
                numbersonly:true,
                min:0
            },
            prime:{
                required:true,
                numbersonly:true,
                min:0
            },
            classic_plus:{
                required:true,
                numbersonly:true,
                min:0
            },
            classic:{
                required:true,
                numbersonly:true,
                min:0
            },
            recliner_price:{
                required:true,
                numbersonly:true,
                min:100
            },
            prime_price:{
                required:true,
                numbersonly:true,
                min:100
            },
            classic_plus_price:{
                required:true,
                numbersonly:true,
                min:100
            },
            classic_price:{
                required:true,
                numbersonly:true,
                min:100
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
        },
        submitHandler: function(form){
            var rows = parseInt($("#rows").val());

            var total = parseInt($("#recliner").val()) + parseInt($("#prime").val())  + parseInt($("#classic_plus").val()) +  + parseInt($("#classic").val()); 
            if (total != rows) {
                $("#screenForm div.error").html("Screen splitted incorrectly.")
                return false;
            } else form.submit();
        }
    });
    return valid;
}

function validateMovieForm(){
    const valid = $('#movieForm').validate({
        rules: {
            api_movie_id:{
                required : true
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
        },
        submitHandler: function(form){
            var api_movie_id = parseInt($("#api_movie_id").val());
            
            if (!api_movie_id) {
                $("#movieForm div.error").html("Movie not selected.")
                return false;
            } else form.submit();
        }
    });
    return valid;
}

function validateMovieMapForm(){
    const valid = $('#movieMapForm').validate({
        rules: {
            movie:{
                required : true
            },
            screen: {
                required : true,
                remote: {
                    url: "/owner/map/check",
                    type: "POST",
                    data: {
                        start_date : function() { return $('#start_date').val() },
                        end_date : function() { return $('#end_date').val() },
                        start_time : function() { return $('#start_time').val() },
                        end_time : function() { return $('#end_time').val() },
                        screen : function() { return $('#screen').val() },
                        owner_id : function() { return $('#owner_id').val() },
                        map_id : function() { return $('#map_id').val() },
                    },
                }
            },
            start_time: {
                required : true,
                remote: {
                    url: "/owner/map/check",
                    type: "POST",
                    data: {
                        start_date : function() { return $('#start_date').val() },
                        end_date : function() { return $('#end_date').val() },
                        start_time : function() { return $('#start_time').val() },
                        end_time : function() { return $('#end_time').val() },
                        screen : function() { return $('#screen').val() },
                        owner_id : function() { return $('#owner_id').val() },
                        map_id : function() { return $('#map_id').val() },
                    },
                }
            },
            end_time:{
                required : true,
            },
            start_date: {
                required : true,
                dpDate: true,
                remote: {
                    url: "/owner/map/check",
                    type: "POST",
                    data: {
                        start_date : function() { return $('#start_date').val() },
                        end_date : function() { return $('#end_date').val() },
                        start_time : function() { return $('#start_time').val() },
                        end_time : function() { return $('#end_time').val() },
                        screen : function() { return $('#screen').val() },
                        owner_id : function() { return $('#owner_id').val() },
                        map_id : function() { return $('#map_id').val() },
                    },
                }
            },
            end_date:{
                required : true,
                dpDate: true,
                remote: {
                    url: "/owner/map/check",
                    type: "POST",
                    data: {
                        start_date : function() { return $('#start_date').val() },
                        end_date : function() { return $('#end_date').val() },
                        start_time : function() { return $('#start_time').val() },
                        end_time : function() { return $('#end_time').val() },
                        screen : function() { return $('#screen').val() },
                        owner_id : function() { return $('#owner_id').val() },
                        map_id : function() { return $('#map_id').val() },
                    },
                }
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
        },
        submitHandler: function(form){
            let start_date = $('#start_date').val();
            let end_date = $('#end_date').val();
            start_arr = start_date.split('/');
            end_arr = end_date.split('/');

            const start_date_int = parseInt( start_arr[2] + '' + start_arr[1] + '' + start_arr[0] );
            const end_date_int = parseInt( end_arr[2] + '' + end_arr[1] + '' + end_arr[0] );

            if (start_date_int > end_date_int) {
                $("#movieMapForm div.error").html("End date should be greater than or equal to start date.")
                return false;
            } else form.submit();


            let start_time = $('#start_time').val();
            let end_time = $('#end_time').val();
            start_time_arr = start_time.split(':');
            end_time_arr = end_time.split(':');

            const start_time_int = parseInt( start_time_arr[0] + '' + start_time_arr[1] + '' + start_time_arr[2] );
            const end_time_int = parseInt( end_time_arr[0] + '' + end_time_arr[1] + '' + end_time_arr[2] );

            if (start_time_int >= end_time_int) {
                $("#movieMapForm div.error").html("End time should be greater than start time.")
                return false;
            } else form.submit();
        }
    });
    return valid;
}

$(document).ready(function(){
    validateOwnerSignUpForm();
    validateRemarksForm();
    validateOwnerLoginForm();
    validateAdminLoginForm();
    validateScreenForm();
    validateMovieForm();
    validateMovieMapForm();
    validateOtpVerifyForm();
    startCountDown();
    validateOwnerOtpLoginForm();
    validateNewMovieAddForm();
})

$.validator.addMethod( "numbersonly", function( value, element ) {
	return this.optional( element ) || /^[0-9]+$/i.test( value );
}, "Digits only please" );

let timerValid = true;

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

function validateOtpVerifyForm() {
    if (!timerValid) {
        return false;
    }
    const valid = $('#ownerOtpVerify').validate({
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

function validateOwnerOtpLoginForm() {
    const valid = $('#ownerOtpLogin').validate({
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

$('.btn_otp_resend').click(function (e) {
    e.preventDefault();
    $.ajax({
        type: "POST",
        url: '/owner/resend_otp',
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

function getEndTime(){
    let duration = parseInt($("#movie").select2().find(":selected").data("duration"));
    let start_time = $('#start_time').val();
    let total_duration = ( duration + 30 ) * 60;

    total_duration_arr = start_time.split(':');

    total_duration_arr[2] = parseInt(total_duration_arr[2]) + total_duration;


    if (total_duration_arr[2] >= 60 ){
        let seconds = total_duration_arr[2];
        while(seconds >= 60){
            total_duration_arr[1] = parseInt(total_duration_arr[1]) + 1;
            seconds = seconds - 60;
        }
        total_duration_arr[2] = seconds;
    }
    total_duration_arr[1] = parseInt(total_duration_arr[1]);

    if (total_duration_arr[1] >= 60 ){
        let minutes = total_duration_arr[1];
        while(minutes >= 60){
            total_duration_arr[0] = parseInt(total_duration_arr[0]) + 1;
            minutes = minutes - 60;
        }
        total_duration_arr[1] = minutes;
    }

    if (!isNaN(total_duration_arr[0]) && !isNaN(total_duration_arr[1]) && !isNaN(total_duration_arr[2]) ){
        if (total_duration_arr[0] < 10){
            total_duration_arr[0] = '0' + total_duration_arr[0];
        }

        if (total_duration_arr[1] < 10){
            total_duration_arr[1] = '0' + total_duration_arr[1];
        }

        if (total_duration_arr[2] < 10){
            total_duration_arr[2] = '0' + total_duration_arr[2];
        }

        $('#end_time').val(total_duration_arr.join(':'));

        $('.movie_time_details').html(`
            <h3 class="pt-3"><u>Movie Time Details</u></h3>
            <p>Movie Start Time : ${start_time}</p>
            <p>Next Movie can start at : ${ total_duration_arr.join(':') }</p>
        `)
    }else{
        $('#end_time').val('');

        $('.movie_time_details').html('')
    }
}


function validateNewMovieAddForm(){
    const valid = $('#newMovieForm').validate({
        rules: {
            budget : {
                required : false,
                numbersonly : true
            },
            title : {
                required : true
            },
            genres : {
                required : true
            },
            homepage : {
                required : false
            },
            original_language : {
                required : true
            },
            popularity : {
                required : true,
                numbersonly : true
            },
            release_date : {
                required : true,
                dpDate: true
            },
            revenue : {
                required : false,
                numbersonly : true
            },
            runtime : {
                required : true,
                numbersonly : true
            },
            status : {
                required : true
            },
            tagline : {
                required : false
            },
            vote_average : {
                required : true,
                max : 10,
                min : 1
            },
            vote_count : {
                required : false,
                numbersonly : true
            },
            overview  : {
                required : true,
                minlength : 5
            },
            adult : {
                required : true
            },
            poster_path : {
                required : true
            },
            backdrop_path : {
                required : true
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
        },
        // submitHandler: function(form){
        //     // var api_movie_id = parseInt($("#api_movie_id").val());
            
        //     // if (!api_movie_id) {
        //     //     $("#movieForm div.error").html("Movie not selected.")
        //     //     return false;
        //     // } else form.submit();
        // }
    });
    return valid;
}