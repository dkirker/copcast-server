#!/bin/bash

SERVICE=copcast-server

exec 1> >(logger -s -t $SERVICE) 2>&1

NODE_ENV=production node app.js


