/**
 * Created by brunosiqueira on 08/08/16.
 */
var
  db = require('./lib/db'),
  storage = require('./lib/videos/storage'),
  moment = require('moment');

module.exports = {
  updateHistoryRecording: function(){
    db.sequelize.query('select * from histories h ' +
      ' where "nextState" = \'RECORDING\' AND ' +
      ' NOT EXISTS ( ' +
      '  select * from histories h1 where to_char(h1.date, \'DD/MM/YYYY\') =  to_char(h.date, \'DD/MM/YYYY\') AND "previousState" = \'RECORDING\' )',
      {type: db.sequelize.QueryTypes.SELECT}).then(function (histories) {
      var date = null, userId = null;

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

            var newHistory = db.history.build({
              date: moment(this.date).add(parseInt(result[0].sum), 'seconds').toDate(),
              previousState: 'RECORDING', nextState: 'IDLE', userId: this.userId
            });
            console.log(newHistory);
            newHistory.save();
          }.bind(history));
        }
      }
    });
  }
};
