var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { create } = require('express-handlebars');
var dateFormat = require('handlebars-dateformat');
var session = require('express-session')
var db = require('./config/connection')

var adminRouter = require('./routes/admin');
var adminUserRouter = require('./routes/adminuser');
var adminReviewRouter = require('./routes/admin_review');
var ownerMovieRouter = require('./routes/owner_movie')
var ownerMapRouter = require('./routes/owner_map')
var ownerReportRouter = require('./routes/owner_report')
var adminReportRouter = require('./routes/admin_report')
var adminMonthRouter = require('./routes/admin_month')
var ownerChartRouter = require('./routes/owner_chart');
var adminChartRouter = require('./routes/admin_chart');
var ownerRouter = require('./routes/owner');
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var userMovieRouter = require('./routes/user_movies');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const hbs = create({
	layoutsDir: `${__dirname}/views/layouts`,
	extname: 'hbs',
	defaultLayout: 'layout',
	partialsDir: `${__dirname}/views/partials`,
	helpers: {
		'dateFormat': dateFormat
	}
});
app.engine('hbs', hbs.engine);

// register new function


hbs.handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

	switch (operator) {
		case '==':
			return (v1 == v2) ? options.fn(this) : options.inverse(this);
		case '===':
			return (v1 === v2) ? options.fn(this) : options.inverse(this);
		case '!=':
			return (v1 != v2) ? options.fn(this) : options.inverse(this);
		case '!==':
			return (v1 !== v2) ? options.fn(this) : options.inverse(this);
		case '<':
			return (v1 < v2) ? options.fn(this) : options.inverse(this);
		case '<=':
			return (v1 <= v2) ? options.fn(this) : options.inverse(this);
		case '>':
			return (v1 > v2) ? options.fn(this) : options.inverse(this);
		case '>=':
			return (v1 >= v2) ? options.fn(this) : options.inverse(this);
		case '&&':
			return (v1 && v2) ? options.fn(this) : options.inverse(this);
		case '||':
			return (v1 || v2) ? options.fn(this) : options.inverse(this);
		default:
			return options.inverse(this);
	}
});

hbs.handlebars.registerHelper("inc", function (value, options) {
	return parseInt(value) + 1;
});

hbs.handlebars.registerHelper("roundtwo", function (value, options) {
	return value.toFixed(2);
});

hbs.handlebars.registerHelper('times', function (n, block) {
	var accum = '';
	for (var i = 0; i < n; ++i)
		accum += block.fn(i);
	return accum;
});

hbs.handlebars.registerHelper('splitTime', function (time) {
	var timeSplitted = time.split(':')
	let amOrPm = '';
	if (parseInt(timeSplitted[0]) > 12) {
		timeSplitted[0] = timeSplitted[0] - 12
		amOrPm = 'PM'
	} else if (parseInt(timeSplitted[0]) < 12) {
		amOrPm = 'AM';
	}

	if (parseInt(timeSplitted[0]) == 0) {
		timeSplitted[0] = 12;
	}
	return timeSplitted[0] + ':' + timeSplitted[1] + ' ' + amOrPm;
});


const monthNames = ['', "January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December"
];

const monthShortNames = ['', "Jan", "Feb", "March", "April", "May", "June",
	"July", "August", "Sept", "Oct", "Nov", "Dec"
];

hbs.handlebars.registerHelper('splitDate', function (date) {
	var dateSplitted = date.split('-');
	dateSplitted[1] = monthNames[parseInt(dateSplitted[1])];

	return dateSplitted[0] + ' ' + dateSplitted[1] + ' ' + dateSplitted[2] 
});

hbs.handlebars.registerHelper('splitShortDate', function (date) {
	var dateSplitted = date.split('-');
	dateSplitted[1] = monthShortNames[parseInt(dateSplitted[1])];

	return dateSplitted[0] + ' ' + dateSplitted[1] + ' ' + dateSplitted[2] 
});


hbs.handlebars.registerHelper('getMonthName', function (monthNum) {
	return monthNames[monthNum];
});

hbs.handlebars.registerHelper('adminShare', function (amount) {
	return parseInt(amount * 20 / 100);
});

hbs.handlebars.registerHelper('ownerShare', function (amount) {
	return parseInt(amount * 80 / 100);
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: "Key", cookie: { maxAge: 6000000 } }))

app.use(function (req, res, next) {
	res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
	next();
});


db.connect((err) => {
	if (err) {
		console.log('Connection Error : ' + err)
	} else {
		console.log('Database Connected to PORT 27017')
	}
})


app.use('/admin', adminRouter);
app.use('/admin/user', adminUserRouter);
app.use('/admin/review', adminReviewRouter);
app.use('/admin/chart', adminChartRouter);
app.use('/admin/month', adminMonthRouter);
app.use('/owner', ownerRouter);
app.use('/owner/movie', ownerMovieRouter);
app.use('/owner/chart', ownerChartRouter);
app.use('/owner/map', ownerMapRouter);
app.use('/owner/report', ownerReportRouter);
app.use('/admin/report', adminReportRouter);
app.use('/', userMovieRouter);
app.use('/', indexRouter);
app.use('/', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
