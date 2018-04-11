
var mongoose = require('mongoose');
var dbURL = 'mongodb://localhost/CRM';
mongoose.connect(dbURL);

var tcardSchema = require('../models/timeCard.js');
var moment = require('../public/js/libs/moment/moment');
var async = require('async');

var timeCard = mongoose.model( 'timeCard', tcardSchema );

if(typeof require !== 'undefined') XLSX = require('xlsx');
var workbook = XLSX.readFile('attend_oct.xls');

// get all sheet names 
const sheetNames = workbook.SheetNames; // return ['sheet1', 'sheet2']
for (i=1; i<sheetNames.length; i++) {
// get worksheet
const worksheet = workbook.Sheets[sheetNames[i]];
range = worksheet['!range'];
// range = {s: {r: 1}, e: {r: 202}};
cnt=0;

//for(var R = range.s.r; R < range.e.r; ++R) {
for (var R=2; R<20; ++R) { // for testing
  var seq=worksheet['A'+(R+1).toString()].v;
  var name=worksheet[ 'C'+(R+1).toString()].v; // column c
  var empid=worksheet['D'+(R+1).toString()].v;
  var rawdt=worksheet['E'+(R+1).toString()];  // datetime
  var pdt= XLSX.SSF.parse_date_code(rawdt.v);
  var deptid=worksheet['F'+(R+1).toString()].v; // department id
  var machineid=worksheet['H'+(R+1).toString()].v; // machine id
  rectime = pdt.y+'/'+pdt.m+'/'+pdt.d+' '+pdt.H+':'+pdt.M+':'+pdt.S;
  
  var punchitem = {punchtime: pdt, empid: empid };
  dealRecord(punchitem);
  cnt++;
  if (cnt % 1000 == 0){
    console.log("processed !!" + cnt);
  }
}
}

function dealRecord(item) {
  // parse punch record
  pdt=item.punchtime;
  rectime = pdt.y+'/'+pdt.m+'/'+pdt.d+' '+pdt.H+':'+pdt.M+':'+pdt.S;
  cmptime = moment(rectime, 'HH:mm:ss');
  var query = timeCard.where ({
    'year': pdt.y,
    'month': pdt.m,
    'day': pdt.d,
    'empid': item.empid
  });
  var update = {};
  
  query.findOne(function(err, tcard) {
    if (tcard==null) {
            // no exists, add one
            arr = new timeCard({year: pdt.y, month: pdt.m, day: pdt.d, empid: item.empid});
            arr.save(function(error, docs) {
              console.log(error); });
            console.log("one record added");
    } else {
      var t1=moment(tcard.amin);
      if (!t1.isValid()) {
        update.amin=cmptime.format("HH:mm:ss");
      }
      var t2=moment(tcard.amout);
      if (!t2.isValid()) {
        update.amout=cmptime.format("HH:mm:ss");
      }
      var t3=moment(tcard.pmin);
      var t4=moment(tcard.pmout);
      if (!t4.isValid()) {
        update.pmout=cmptime.format("HH:mm:ss");
      }
      var t5=moment(tcard.otin);
      var t6=moment(tcard.otout);
      if (item.H<12) {  // am;
        if (cmptime.isBefore(t1)) {
          update['amin']=t1.format("hh:mm:ss");
        } else if (cmptime.isAfter(t2)) {
          update['amout']=t2.format("hh:mm:ss");
        } else {
          
          update.amout=cmptime.format("hh:mm:ss");
        }
      } else if (item.H<18) {
        if (cmptime.isBefore(t3)) {
          update['pmin']=t3.format("hh:mm:ss");
        } else if (cmptime.isAfter(t4)) {
          update['pmout']=t4.format("hh:mm:ss");
        }else {
          update.pmin=cmptime.format("hh:mm:ss");
          update.pmout=cmptime.format("hh:mm:ss");
        }
      } else if (item.H<24) {
        if (cmptime.isBefore(t5)) {
          update['otin']=t5.format("hh:mm:ss");
        } else if (cmptime.isAfter(t6)) {
          update['otout']=t6.format("hh:mm:ss");
        }else {
          update.otin=cmptime.format("hh:mm:ss");
          update.otout=cmptime.format("hh:mm:ss");
        }
      }
      options = { };
      query={
        'year': pdt.y,
        'month': pdt.m,
        'day': pdt.d,
        'empid': item.empid
      };
      console.log(JSON.stringify(update));
      timeCard.update(query, update, options, function(err, timecards) {
        if (timecards.length) {
            console.log("ok");
        } else {
            console.log(err+timecards);
        }
    });
    }
  });
  
}

