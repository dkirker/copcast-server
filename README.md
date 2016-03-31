[![Build Status](https://travis-ci.org/igarape/mogi-server.svg?branch=master)](https://travis-ci.org/igarape/mogi-server)
[![Code Climate](https://codeclimate.com/github/igarape/mogi-server/badges/gpa.svg)](https://codeclimate.com/github/igarape/mogi-server)

Copcast Server
===========

Copcast Server is part of the Copcast solution to help improve police accountability using mobile phones to record the video and the audio and register their GPS location.

Copcast Server is a server API developed with <a href="https://nodejs.org">Node.js</a> and <a href="http://expressjs.com">Express</a> 


## Dev Installation

First, install <a href="https://nodejs.org">Node.js</a> in your development machine. We are using, currently, version <b>0.10.40</b>.

Then make sure you have the following softwares installed:

   * ImageMagick
   * ffmpeg 
   * PostgreSQL server and development files
   * gcc, gcc-c++ and make
   * bzip2


<b>IMPORTANT:</b>
use the version <b>2.6.8</b> of <b>ffmpeg</b>. We will test it with the version 3.x in the following months. 

## Building

First make sure you have NodeJS and NPM properly installed (check http://nodejs.org for help).

```
npm install -g forever nodemon express sequelize-cli
npm install
```


## Database

The server requires a PostgreSQL database.

First, create 2 database users. One will be the owner of the database and user for administrative purposes, while the other, a less privileged one, will be used by the application. 
As a placeholder, we will use "COPCASTADM" and "COPCASTUSER".

Next, setup your configuration files. Copy the following files from lib/config/template to config/:

   * development.json
   * common.json

Now edit the connection string and enter your database parameters, like _username_, _password_, _database_ and _host_ in "development.json".

Next, at the project root, initialize your database:

```
psql -U username -f copcast-db.sql
sequelize db:migrate:old_schema --url 'postgres://COPCASTADM:PASSWORD@HOST:5432/DBNAME'
sequelize db:migrate --url 'postgres://COPCASTADM:PASSWORD@HOST:5432/DBNAME'
NODE_ENV=development node createAdminUser.js
```
The last line will create your first user "admin" with the password "admin".


## Cryptography

The video files are encrypted before being stored. If you want to change the password or the salt, run the following script:

```
NODE_ENV=development node cryptoConfigGenerator.js
```

The output is a JSON fragment to be stored into "development.json".
The number of partitions allows the password to be constructed from the input of multiple users, each having its own password.
For production mode, it is advised to remove the "key" subsection under "crypto".


## Running

Finally, start your application:

```
NODE_ENV=development node app.js
```


## Deployment

1. Create a _production.json_ file at _config/_
2. Set your database connection parameters and cryptography parameters (without the "key" entry).
3. Run it (the passwords must be entered at the same order as previously configured):

```
NODE_ENV=production node app.js
```
