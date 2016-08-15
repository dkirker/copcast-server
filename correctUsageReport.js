/**
 * Created by brunosiqueira on 08/08/16.
 */
var
  db = require('./lib/db'),
  storage = require('./lib/videos/storage'),
  moment = require('moment'),
  _ = require('lodash');

module.exports = {
  updateHistoryRecording: function(callback){
    db.sequelize.query(' select * from histories h where  NOT EXISTS (select * ' +
      ' from histories h1 where to_char(h1.date, \'DD/MM/YYYY\') =  to_char(h.date, \'DD/MM/YYYY\') '+
      ' AND h1."previousState" = \'RECORDING\' AND h."userId" = h1."userId") and h."nextState" = \'RECORDING\'',
      {type: db.sequelize.QueryTypes.SELECT}).then(function (histories) {
      var date = null, userId = null;
      console.log('histories', histories);
      if (histories.length == 0){
        return callback();
      }
      var counter = _.after(histories.length, callback);
      for (var i = 0; i < histories.length; i++) {
        var history = histories[i];
        if (!userId || (userId != history.userId || !date.isSame(moment(history.date), 'day'))) {
          userId = history.userId;
          date = moment(history.date);

          var starDate = moment(history.date).hour(0).minutes(0).seconds(0).toDate();
          var endDate = moment(history.date).hour(23).minutes(59).seconds(59).toDate();
          db.sequelize.query('select SUM("duration") sum from videos where date BETWEEN :startDate AND :endDate and "userId" = :userId',
            {
              replacements: {
                startDate: starDate, endDate: endDate,
                userId: history.userId
              },
              type: db.sequelize.QueryTypes.SELECT
            }).then(function (result) {
              console.log("result", result);
            if (parseInt(result[0].sum)>0) {
              var newHistory = db.history.build({
                date: moment(this.date).add(parseInt(result[0].sum), 'seconds').toDate(),
                previousState: 'RECORDING', nextState: 'IDLE', userId: this.userId
              });
              console.log(newHistory);
              newHistory.save();
            }
            counter();
          }.bind(history));
        }
      }
    });
  }
};
