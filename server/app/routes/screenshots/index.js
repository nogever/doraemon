'use strict';
process.env.AWS_ACCESS_KEY_ID='AKIAI3KBBFBL6XN3VMJA';
process.env.AWS_SECRET_ACCESS_KEY='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';

var router = require('express').Router();
module.exports = router;
var	AWS = require('aws-sdk'),
	s3 = new AWS.S3({params: {Bucket: 'capstone-doraemon'}}),
    fs = require('fs');
AWS.config.region = 'us-standard';
var mongoose = require('mongoose');
var User = mongoose.model('User');
var TestConfig = mongoose.model('TestConfig');

router.get('/:userId', function (req, res, next) {

	// var params = {Bucket: 'capstone-doraemon', Key: req.params.id};
	// var imgStream = s3.getObject(params).createReadStream();
	// imgStream.pipe(res);
	TestConfig.find({user: req.params.userId})
			.exec()
			.then(function(tests) {
				res.json(tests);
			});

});

router.get('/search', function (req, res, next) {
	console.log('query object ', req.query);
});


















