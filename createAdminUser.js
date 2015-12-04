var groupName = "Cape Town",
    admin = true,
    userName = 'admin',
    userEmail = 'user@email.com',
    userPass = 'admin'
    role = 'admin_3',
    latitude = -33.920684,
    longitude = 18.425690;

var db = require('./lib/db');


group = db.group.build({name: groupName, isAdmin: admin, lat: latitude, lng: longitude });
group.save().then(function(group){
    var user = db.user.build({
        username : userName,
        email : userEmail,
        name : userName,
	role : role,
        groupId: group.id,
        isAdmin : admin
    });

    user.hashPassword(userPass, function() {
        user.save().then(function() {process.exit();}).catch(function(err) {console.log(err);});
    });
}).catch(function(err) {console.log(err);});
