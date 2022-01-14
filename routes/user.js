var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers');
require('dotenv').config();
var hb = require('express-handlebars').create();
var handlebars = require('express-handlebars');

var pdf = require('html-pdf');
var nodemailer = require('nodemailer');
var mailerhbs = require('nodemailer-express-handlebars');
var path = require('path');

var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.TICKET_GMAIL,
        pass: process.env.TICKET_GMAIL_PASSWORD
    }
});

mail.use('compile', mailerhbs({
    viewEngine: handlebars.create({ defaultLayout: false }),
    viewPath: path.resolve(__dirname, '../views/default/' ),
    extName: '.hbs'
}));


const userTitle = "MovieBuff"
const isUser = true

const paypal = require('paypal-rest-sdk');
const masterHelpers = require('../helpers/master-helpers');

paypal.configure({
    'mode': process.env.PAYPAL_MODE, //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

router.use((req, res, next) => {
    if (req.session.isUserLoggedIn) {
        next();
    } else {
        req.session.errorMsg = "Please login to continue";
        res.redirect('/login')
    }
});

router.post('/submit-review', (req, res, next) => {
    userHelpers.submitReview(req.body, req.session.userId).then((response) => {
        res.send({ status : response.status })
    })
})

router.get('/user-tickets', (req, res, next) => {
    const userId = req.session.userId;

    let dateObj = new Date();
    let month = parseInt(dateObj.getUTCMonth()) + 1;
    let day = parseInt(dateObj.getUTCDate());
    let year = parseInt(dateObj.getUTCFullYear());

    if (day < 10) {
        day = '0' + day;
    }

    if (month < 10) {
        month = '0' + month
    }

    const currentDate = parseInt(year + '' + month + '' + day);

    userHelpers.getUsertickets(userId).then((response) => {
        res.render('user/user_tickets', {
            title: userTitle,
            section: "tickets",
            isUser,
            user_name: req.session.user_name,
            isUserLoggedIn: req.session.isUserLoggedIn,
            tickets: response.tickets,
            currentDate
        })
    })
})

router.post('/submit_seats/:movieId/:mappingId/:date', function (req, res, next) {
    const seat_count = parseInt(req.body.seat_count);
    if (isNaN(seat_count) || seat_count == 0 || seat_count == undefined) {
        res.redirect('/seat_layout/' + req.params.movieId + '/' + req.params.mappingId + '/' + req.params.date);
    } else {
        req.session.seat_count = seat_count;
        res.redirect('/seat_layout/' + req.params.movieId + '/' + req.params.mappingId + '/' + req.params.date);
    }
});

router.post('/booking/:movieId/:mappingId/:date', async (req, res, next) => {
    if (!req.body.remaining_minutes && !req.body.remaining_seconds) {
        res.redirect('/seat_layout/' + req.params.movieId + '/' + req.params.mappingId + '/' + req.params.date);
    } else {
        userHelpers.doTicketBooking(req.params.movieId, req.params.mappingId, req.params.date, req.session.userId, req.body, req.body.remaining_minutes, req.body.remaining_seconds).then((response) => {
            if (!response.status) {
                req.session.errorMsg = response.errorMsg;
                res.redirect('/');
            } else {
                res.redirect('/booking_details/' + response.bookingId);
            }
        })
    }
});

router.get('/booking_details/:id', (req, res, next) => {
    userHelpers.getBookingDetails(req.params.id).then(async (response) => {
        if (response.status) {
            let languageName = '';
            if (response.bookingData.movie_details.api_movie_id == '0') {
                languageName = response.bookingData.movie_details.original_language;
            } else {
                languageName = await masterHelpers.getLanguageNameByCode(response.bookingData.movie_details.original_language);
            }

            res.render('user/payment_details', {
                title: userTitle,
                section: "home",
                isUser,
                user_name: req.session.user_name,
                isUserLoggedIn: req.session.isUserLoggedIn,
                bookingData: response.bookingData,
                languageName
            })
        } else {
            req.session.errorMsg = response.errorMsg;
            res.redirect('/')
        }
    })
})

router.post('/confirm/:id', (req, res, next) => {
    userHelpers.doConfirmBooking(req.params.id).then((response) => {
        res.send(response);
    })
})

router.post('/verify-payment', (req, res) => {
    const baseurl = req.protocol + '://' + req.headers.host + '/';

    req.session.seat_count = null;
    userHelpers.verifyPayment(req.body).then(() => {
        userHelpers.changePaymentStatus(req.body['order[receipt]'], baseurl).then(async () => {
            let bookingId = req.body['order[receipt]'];
            await userHelpers.getTicketDetails(bookingId).then(async (booking) => {
                await userHelpers.getUserEmail(req.session.userId).then(async (userEmail) => {
                    let pdfBufer = null;
                    let basePath = req.protocol + '://' + req.get('host')
                    await getTicketContentBuffer(bookingId, basePath).then((pdfBufer2) => {
                        pdfBufer = pdfBufer2
                    })


                    var mailOptions = {
                        from: process.env.TICKET_GMAIL,
                        to: userEmail,
                        subject: 'MovieBuff - Your Tickets',
                        template: 'ticket',
                        context: {
                            booking: booking.bookingData,
                            totalSeats: booking.bookingData.reclinerSeats + booking.bookingData.primeSeats +
                                booking.bookingData.classic_plusSeats + booking.bookingData.classicSeats,
                            bookingId: bookingId.slice(bookingId.length - 7),
                            basePath : req.protocol + '://' + req.get('host')
                        },
                        attachments: [
                            { 
                                filename: "MovieBuff-"+ bookingId.slice(bookingId.length - 7) + ".pdf",
                                content : Buffer.from(pdfBufer, 'utf-8'),
                                contentType: 'application/pdf'
                            }
                        ]
                    };

                    mail.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });

                    res.json({ status: true })
                });
            });
        })
    }).catch(() => {
        res.json({ status: false })
    })
})


router.get('/payment-success', (req, res) => {
    res.render('user/payment-success', {
        title: userTitle,
        section: "home",
        isUser,
        user_name: req.session.user_name,
        isUserLoggedIn: req.session.isUserLoggedIn
    });
})


router.get('/payment-fail', (req, res) => {
    res.render('user/payment-fail', {
        title: userTitle,
        section: "home",
        isUser,
        user_name: req.session.user_name,
        isUserLoggedIn: req.session.isUserLoggedIn
    });
})

function getTicketContentBuffer(bookingId, basePath){
    return new Promise(async (resolve, reject) => {
        await userHelpers.getTicketDetails(bookingId).then(async (booking) => {
            let renderedHtml = await hb.render('views/user/ticket_pdf.hbs', {
                booking: booking.bookingData,
                totalSeats: booking.bookingData.reclinerSeats + booking.bookingData.primeSeats +
                    booking.bookingData.classic_plusSeats + booking.bookingData.classicSeats,
                bookingId: bookingId.slice(bookingId.length - 7),
                basePath
            });
            
            var options = {
                format: 'Letter',
                "border": {
                    "top": "0.3in",            // default is 0, units: mm, cm, in, px
                    "right": "0.8in",
                    "bottom": "0.3in",
                    "left": "0.8in"
                },
    
                "header": {
                    "height": "1in",
                    "contents": ''
                },
            };
    
            var bufferReturn = null;
            await pdf.create(renderedHtml, options).toBuffer( async (err, buffer) => {
                if (err) {
                    return reject(err)
                };
                bufferReturn = buffer;
                return resolve(bufferReturn);
            })
    
        });
    })
}

router.get('/paypal-success/:bookingId', (req, res) => {
    const baseurl = req.protocol + '://' + req.headers.host + '/';

    req.session.seat_count = null;
    userHelpers.changePaymentStatus(req.params.bookingId, baseurl).then(async () => {

        await userHelpers.getTicketDetails(req.params.bookingId).then(async (booking) => {
            await userHelpers.getUserEmail(req.session.userId).then(async (userEmail) => {
                let pdfBufer = null;
                let basePath = req.protocol + '://' + req.get('host')
                await getTicketContentBuffer(req.params.bookingId, basePath).then((pdfBufer2) => {
                    pdfBufer = pdfBufer2
                })
                var mailOptions = {
                    from: process.env.TICKET_GMAIL,
                    to: userEmail,
                    subject: 'MovieBuff - Your Tickets',
                    template: 'ticket',
                    context: {
                        booking: booking.bookingData,
                        totalSeats: booking.bookingData.reclinerSeats + booking.bookingData.primeSeats +
                            booking.bookingData.classic_plusSeats + booking.bookingData.classicSeats,
                        bookingId: req.params.bookingId.slice(req.params.bookingId.length - 7)
                    },
                    attachments: [
                        { 
                            filename: "MovieBuff-"+ req.params.bookingId.slice(req.params.bookingId.length - 7) + ".pdf",
                            content : Buffer.from(pdfBufer, 'utf-8'),
                            contentType: 'application/pdf'
                        }
                    ]
                };
    
                mail.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });

                res.redirect('/payment-success')
            })
        });
    })
})


router.post('/paypal-payment/:id', async (req, res) => {
    const baseurl = req.protocol + '://' + req.headers.host + '/';

    let booking = {};
    await userHelpers.getTicketDetails(req.params.id).then((bookingResponse) => {
        booking = bookingResponse.bookingData;
    })

    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": baseurl + "paypal-success/" + req.params.id,
            "cancel_url": baseurl + "payment-fail"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": booking.totalAmount,
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": booking.totalAmount
            },
            "description": "Hat for the best team ever"
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});

router.post('/disable-seats', (req, res, next) => {
    let dateObj = new Date();
    let month = parseInt(dateObj.getUTCMonth()) + 1;
    let day = parseInt(dateObj.getUTCDate());
    let year = parseInt(dateObj.getUTCFullYear());

    if (day < 10) {
        day = '0' + day;
    }

    if (month < 10) {
        month = '0' + month
    }

    let currentHour = dateObj.getHours();
    let currentMinutes = dateObj.getMinutes();

    if (currentHour < 10) {
        currentHour = '0' + currentHour
    }

    if (currentMinutes < 10) {
        currentHour = '0' + currentHour
    }

    const currentTime = parseInt(year + '' + month + '' + day + '' + currentHour + '' + currentMinutes + '' + '00');

    const endTime = currentTime + 180;

    userHelpers.deleteExistingDisabled(currentTime).then((result) => {
        userHelpers.addDisabled(req.session.userId, req.body.showDate, req.body['originalSeatArr[]'], currentTime, endTime, req.body.mapping_id).then((response) => {
            res.send(response);
        })
    })
})

router.get('/ticket_download/:id', async (req, res, next) => {

    let dateObj = new Date();
    let month = dateObj.getUTCMonth() + 1;
    let day = dateObj.getUTCDate();
    let year = dateObj.getUTCFullYear();
    const currentDate = parseInt(year + '' + month + '' + day);

    await userHelpers.getTicketDetails(req.params.id).then(async (booking) => {
        let renderedHtml = await hb.render('views/user/ticket_pdf.hbs', {
            title: userTitle,
            section: "home",
            isUser,
            user_name: req.session.user_name,
            isUserLoggedIn: req.session.isUserLoggedIn,
            booking: booking.bookingData,
            totalSeats: booking.bookingData.reclinerSeats + booking.bookingData.primeSeats +
                booking.bookingData.classic_plusSeats + booking.bookingData.classicSeats,
            currentDate,
            bookingId: req.params.id.slice(req.params.id.length - 7),
            basePath : req.protocol + '://' + req.get('host')
        });

        var options = {
            format: 'Letter',
            "border": {
                "top": "0.3in",            // default is 0, units: mm, cm, in, px
                "right": "0.8in",
                "bottom": "0.3in",
                "left": "0.8in"
            },

            "header": {
                "height": "0.5in",
                "contents": ''
            },
        };

        pdf.create(renderedHtml, options).toBuffer(function (err, buffer) {
            if (err) return res.send(err);
            res.type('pdf');
            res.end(buffer, 'binary');
        });

    });
})


module.exports = router;