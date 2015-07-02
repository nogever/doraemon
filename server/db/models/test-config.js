'use strict';
var mongoose = require('mongoose');
var imageCapture = mongoose.model('ImageCapture');
var imageDiff = mongoose.model('ImageDiff');
var utilities = require('../utilities');
var path = require('path');
var roboto = require('roboto');

var Q = require('q');
var chalk = require('chalk');

var schema = new mongoose.Schema({
    name: {
        type: String,
        index: true,
        require: true
    },
    URL: {
        type: String,
        index: true,
        require: true
    },
    devURL: {
        type: String
    },
    rootURL: {
        type: String
    },
    threshold: {
        type: Number,
        default: 10
    },
    viewport: {
        type: String,
        index: true,
        require: true
    },
    dayFrequency: [{
        type: Number
    }],
    hourFrequency: [{
        type: Number
    }],
    userID: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    teamID: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Team'
    },
    enabled: {
        type: Boolean,
        default: false
    }
});

schema.index({ userID: 1, name: 1, URL: 1, viewport: 1 }, { unique: true });


schema.statics.getViewportsForURL = function(userID, testName, URL) {
    var query = {
        name: testName,
        userID: userID,
        URL: URL 
    };
    return mongoose.model('TestConfig')
        .find(query)
        .distinct('viewport', function(err, results) {
            return results;
        })
        .exec();
};


schema.statics.getURLsForTest = function(userID, testName) {
    var query = {
        name: testName,
        userID: userID
    };
    return mongoose.model('TestConfig')
        .find(query)
        .distinct('URL', function(err, results) {
            return results;
        })
        .exec();
};

schema.statics.getTestNamesForUser = function(userID) {
    var query = {
        userID: userID
    };
    return mongoose.model('TestConfig')
        .find(query)
        .distinct('name', function(err, results) {
            return results;
        })
        .exec();
};

schema.statics.getTestNameRootURL = function(userID, testName) {
    var query = {
        userID: userID,
        name: testName
    };
    return mongoose.model('TestConfig')
        .findOne(query)
        .select({name: 1, rootURL: 1})
        .exec();
};

schema.statics.getSharedConfigs = function(userID, testName, URL) {
    var query = {
        name: testName,
        userID: userID,
        URL: URL 
    };
    return mongoose.model('TestConfig')
        .findOne(query)
        .select({threshold: 1, dayFrequency: 1, hourFrequency: 1, enabled: 1, _id: -1})
        .exec();
};

schema.methods.getDiffsByDate = function(date, name) {
    var query = {
        captureTime: date,
        userID: this.userID
    };

    if (name !== null) query.testName = name;
    
    return mongoose.model('ImageDiff')
            .find(query)
            .exec();
};

schema.statics.getDiffsByUrl = function(url, name, userID) {
    var query = {
        websiteUrl: url,
        userID: userID
    };

    if (name !== null) query.testName = name;

    console.log(query);

    return mongoose.model('ImageDiff')
            .find(query)
            .exec();
};

schema.methods.getDiffsByViewport = function(viewport, name, userID) {
    var query = {
        viewport: viewport,
        userID: userID
    };

    if (name !== null) query.testName = name;

    return mongoose.model('ImageDiff')
            .find(query)
            .exec();
};

// returns an array of all URLs that meet hour + day criteria
schema.statics.findAllScheduledTests = function(hour, day) {
    return this.find({
                dayFrequency: day,
                hourFrequency: hour
            }).exec();
};

schema.statics.crawlURL = function(config) {
     var crawlObj = {
         startUrls: [config.startURL],
         maxDepth: config.maxDepth,
         constrainToRootDomains: true
     };

     if (config.blacklist) {
         crawlObj.blacklist = [config.blacklist];
     };
     if (config.whitelist) {
         crawlObj.whitelist = [config.whitelist];
     };

     var crawler = new roboto.Crawler(crawlObj);

     crawler.parseField('url', function(response, $){
        return response.url;
     });

     crawler.on('item', function(item) {
        config.viewport.forEach(function(viewport) {
            mongoose.model('TestConfig')
                .create({
                    name: config.testName,
                    URL: item.url,
                    rootURL: config.startURL,
                    threshold: config.threshold,
                    viewport: viewport,
                    dayFrequency: config.dayFrequency,
                    hourFrequency: config.hourFrequency,
                    userID: config.userID
                });
        });      
    });

     crawler.crawl();    
}; 



schema.statics.runTestConfig = function(nightmare, date) {
    var deferred = Q.defer();
    var snapshotPath = utilities.createImageDir(this.userID, this.name, this.viewport, 'snapshots', date.getHours(), date.getDay(), date.getTime(), this._id);

    // use nightmare to take a screenshot
    nightmare
        .viewport(this.viewportWidth, this.viewportHeight)
        .goto(this.URL)   
        .wait() 
        .screenshot(snapshotPath)
        .use(processImages);

    return deferred.promise;
};

schema.statics.processImages = function() {
    console.log(chalk.cyan('Starting testConfig job - ' + this._id));

    utilities.saveToAWS(snapshotPath).then(function(output) {
        console.log(chalk.green('Screenshot saved to AWS...'));
        return imageCapture.saveImageCapture(this, snapshotPath);
    }).then(function(imageCaptures) {
        console.log(chalk.green('New imageCapture document saved...'));
        return imageDiff.createDiff(this, imageCaptures, date);
    }).then(function(output) {
        if (output) {
            console.log(chalk.green('Diff Screenshot created...'));
            return imageDiff.saveImageDiff(output);
        } else {
            console.log(chalk.yellow('No previous snapshot found'));
            return null;
        }
    }).then(function(newImageDiff) {
        if (newImageDiff) {
            console.log(chalk.green('New imageDiff document saved...'));
            return utilities.saveToAWS(newImageDiff.diffImgURL).then(function(){
                return utilities.saveToAWS(newImageDiff.diffImgThumbnail);
            }).then(function() {
                utilities.removeImg(newImageDiff.diffImgURL);
                return utilities.removeImg(newImageDiff.diffImgThumbnail);
            });
        }
        
        return null;
    }).then(function(output) {
        if (output) {
            console.log(chalk.green('Diff Screenshot saved to AWS...'));
        }

        console.log(chalk.cyan('Finished testConfig job - ' + this._id));
        return deferred.resolve(output);
    }).then(null, function(err) {
        deferred.reject(err);
    });
};


schema.virtual('viewportWidth').get(function () {
    return parseInt(this.viewport.split('x')[0]);
});

schema.virtual('viewportHeight').get(function () {
    return parseInt(this.viewport.split('x')[1]);
});

mongoose.model('TestConfig', schema);