/* jshint node: true */
/* jshint esnext: true */
'use strict';

const router = require('express').Router();
const moment = require('moment');
const multiparty = require('multiparty');
const accesscontrol = require('../../acl/accesscontrol');
const isAuthenticated = require('../../acl/authentication');
const race = require('../../service/race');
//TODO Rename the whole file  -> Race? Results?
router.get('/', isAuthenticated, (req, res) => {
  race.hasStarted()
    .then((result) => {
      if (result === true) {
        race.startTime()
          .then((times) => {
            res.render('admin/after', {
              hours1: moment.duration(times.block1, 'seconds').hours(),  //TODO -> Extract to a proper object
              minutes1: moment.duration(times.block1, 'seconds').minutes(),
              seconds1: moment.duration(times.block1, 'seconds').seconds(),
              hours2: moment.duration(times.block2, 'seconds').hours(),
              minutes2: moment.duration(times.block2, 'seconds').minutes(),
              seconds2: moment.duration(times.block2, 'seconds').seconds(),
              isAdmin: true,
              csrf: req.csrfToken()
            });
          });
      } else {
        res.render('admin/after', {hours: '', minutes: '', seconds: '', isAdmin: true, csrf: req.csrfToken()});
      }
    });
});

function extractTimes(req) { //TODO pull into the 'proper' object
  let time1 = moment.duration({seconds: req.body.seconds1, minutes: req.body.minutes1, hours: req.body.hours1}).asSeconds();
  let time2 = moment.duration({seconds: req.body.seconds2, minutes: req.body.minutes2, hours: req.body.hours2}).asSeconds();
  return {block1: time1, block2: time2};
}

router.post('/', (req, res) => {
  race.setStartTime(extractTimes(req)); //todo why do we ignore the result?
  res.redirect('/admin/after');
});

router.post('/import', isAuthenticated, (req, res) => {
  const form = new multiparty.Form();
  form.parse(req);
  form.on('file', function (name, file) {
    race.import(file.path);
  });
  form.on('close', function () {
    res.redirect('/admin/after');
  });
  form.on('error', function (err) {
    console.log(err);
  });
});


module.exports = router;
