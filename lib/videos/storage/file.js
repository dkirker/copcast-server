var path = require('path'),
  fs = require('node-fs'),
  FFmpeg = require('fluent-ffmpeg'),
  db = require('../../db'),
  crypto = require('../../crypto'),
  uuid = require('node-uuid'),
  StreamMeter = require('stream-meter'),
  archiver = require('archiver'),
  config = require('../../config'),
  moment = require('moment');


var basePath = path.resolve(__dirname, '../../../videos') + '/';
var fontsPath = path.resolve(__dirname, '../../../fonts/roboto') + '/Roboto-Regular.ttf';
var zipBasePath = path.resolve(__dirname, '../../../exported') + '/';
var watermarkPath90 = path.resolve(__dirname, '../../../images') + '/watermark_90.png';
var watermarkPath = path.resolve(__dirname, '../../../images') + '/watermark.png';
var watermarkPath180 = path.resolve(__dirname, '../../../images') + '/watermark_180.png';
var watermarkPath270 = path.resolve(__dirname, '../../../images') + '/watermark_270.png';

exports.readVideoStream = function (video, callback, options) {

  if (!fs.existsSync(basePath + video.encVideoPath()))
    return callback('video file not found', null);

  var x = fs.createReadStream(basePath + video.encVideoPath()).pipe(crypto.decryptor());

  return callback(null, x);
};

var deleteFolderRecursive = function (path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
exports.compressAndRemoveDirectory = function (directory, callback) {
  try {
    var pathExport = zipBasePath + directory + '/';
    var outputPath = zipBasePath + directory + '.zip';
    var output = fs.createWriteStream(outputPath);
    var zipArchive = archiver('zip');

    output.on('close', function () {
      console.log('done with the zip', outputPath);
      deleteFolderRecursive(pathExport)
    });

    zipArchive.pipe(output);
    zipArchive.directory(pathExport, '/', {});
    zipArchive.finalize();

    // the file you want to get the hash
    var fd = fs.createReadStream(outputPath);
    var hash = crypto.createHash('sha1');
    hash.setEncoding('hex');

    fd.on('end', function() {
      hash.end();
      callback(null, hash.read());
    });

    // read all file and pipe it (write it) to the hash object
    fd.pipe(hash);

  } catch (err){
    callback(err);
  }
};

exports.deleteZipFile = function(filepath, callback){
  var outputPath = zipBasePath + filepath + '.zip';
  fs.unlink(outputPath, callback);
}

exports.getTotalDuration = function (video, callback) {
  var path = basePath + video.encVideoPath();
  FFmpeg.ffprobe(path, function (err, metadata) {
    if (err) {
      return callback(video, 0);
    }
    if (metadata.format) {
      return callback(video, metadata.format.duration);
    } else if (metadata.durationsec) {
      return callback(video, metadata.durationsec);
    }
    return callback(video, 0);
  });
};

exports.exists = function (video) {
  return (fs.existsSync(basePath + video.encVideoPath()));
};

function addExporterWatermark(video, tempfilename, filename, userRecorder, user, callback) {
  new FFmpeg({source: tempfilename}).on('end', function () {
    console.log('watermark added');
    fs.unlinkSync(tempfilename);
    callback();
  }).on('error', function (err, stdout, stderr) {
    console.error(stdout);
    console.error(stderr);
    callback('e1'+err);
  }).addOption('-vcodec', 'libx264').videoFilters([
    {
      filter: 'drawtext',
      options: {
        fontfile: fontsPath, text: ' Video recorded by ' + userRecorder.name ,
        fontsize: 20, fontcolor: 'white', boxcolor: 'black', fix_bounds: '1', box: '1', y: '0'
      }
    }, {
      filter: 'drawtext',
      options: {
        fontfile: fontsPath, text: ' At ' + moment(video.date).format('YYYY/MM/DD HH_mm') ,
        fontsize: 20, fontcolor: 'white', boxcolor: 'black',  fix_bounds: '1', box: '1', y: '22'
      }
    },{
      filter: 'drawtext', options: {
        fontfile: fontsPath, text:  ' Exported by ' + user.name ,
        fontsize: 20, fontcolor: 'white', boxcolor: 'black', fix_bounds: '1', box: '1', y: '44'
      }
    },{
      filter: 'drawtext', options: {
        fontfile: fontsPath, text: ' At ' +
        moment(video.date).format('YYYY/MM/DD HH_mm'),
        fontsize: 20, fontcolor: 'white', boxcolor: 'black', fix_bounds: '1', box: '1', y: '66'
      }
    }])
    .save(filename);
}
exports.exportVideoFile = function (directory, video, userRecorded, user, callback) {
  var pathExport = zipBasePath + directory + '/'
  fs.mkdir(pathExport, 0777, true, function (err) {
    console.log('directory created: '+ pathExport);
    if (err){
      return callback(err);
    }
    if (!fs.existsSync(basePath + video.encVideoPath())) {
      return callback('video file not found', null);
    }

    fs.mkdirSync(path.dirname(pathExport + video.videoPath()), 0777, true)
    fs.mkdirSync(path.dirname(pathExport + video.audioPath()), 0777, true)
    var outputVideoStream = fs.createWriteStream(pathExport + video.videoPath());
    var outputAudioStream = fs.createWriteStream(pathExport + video.audioPath());

    fs.createReadStream(basePath + video.encVideoPath()).on('error', function (err) {
      callback('e2'+err);
    }).on('end', function () {
      console.log('video decrypted ');
      fs.createReadStream(basePath + video.encAudioPath()).on('error', function (err) {
        callback('e3'+err);
      }).on('end', function () {
        console.log('audio decrypted. Starting merge with video path: ' + pathExport + video.videoPath() +
          ' and audio path: ' + pathExport + video.audioPath());
        var ffmpeg = new FFmpeg({source: pathExport + video.videoPath()});
        var tempfilename = pathExport + video.userId + '/' + moment(video.date).format('YY-MM-DD_hh-MM-ss') + '1.mp4';
        var filename = pathExport + video.userId + '/' + moment(video.date).format('YY-MM-DD_hh-MM-ss') + '.mp4';
        ffmpeg.on('end', function () {
          console.log('video/audio merged');
          fs.unlinkSync(pathExport + video.videoPath());
          // fs.unlinkSync(pathExport + video.audioPath());
          addExporterWatermark(video, tempfilename, filename, userRecorded, user, callback)
        }).on('error', function (err, stdout, stderr) {
          console.error('e4'+err+'\n'+stdout+'\n'+stderr);
          fs.unlinkSync(pathExport + video.videoPath());
          // fs.unlinkSync(pathExport + video.audioPath());
          addExporterWatermark(video, tempfilename, filename, userRecorded, user, callback);
        }).addInput(pathExport + video.audioPath()).addOptions(['-c:v copy', '-strict -2', '-c:a copy']).save(tempfilename);
      }).pipe(crypto.decryptor()).pipe(outputAudioStream);
    }).pipe(crypto.decryptor()).pipe(outputVideoStream);
  })
};


exports.ingestVideo = function (rawVideoPath, user, dateRecorded, callback) {
  var meter, duration;
  FFmpeg.ffprobe(rawVideoPath, function (err, metadata) {
    if (err)
      return callback(500, "ffprobe error: "+err);

    if (!metadata) {
      //por enquanto vamos abortar neste caso
      return callback(500, 'WARNING: could not read metadata');
    }

    if (metadata.format)
      duration = Math.floor(metadata.format.duration);
    else
      duration = metadata.durationsec;

    var video = db.video.build({id: uuid.v4(), date: dateRecorded, duration: duration});
    video.setUser(user, {save: false});
    var unenc_video_path = basePath + video.videoPath() + '.tmp',
        unenc_audio_path = basePath + video.audioPath() + '.tmp',
        enc_video_path = basePath + video.encVideoPath(),
        enc_audio_path = basePath + video.encAudioPath();

    fs.mkdir(path.dirname(enc_video_path), 0777, true, function (err) {
      if (err)
        return callback(500, "mkdir error: "+err);

      var ffmpeg = new FFmpeg({source: rawVideoPath});
      var unencrypted_vid_output_stream = fs.createWriteStream(unenc_video_path);

      var outpipe = ffmpeg.on('error', function (err, stdout, stderr) {
        return callback(500, "ffmpeg error: "+err);
      });

      var unlinkAndSave = function() {
        fs.unlink(rawVideoPath, function (err) {

          if (err) {
            console.error('Error removing video: '+rawVideoPath, err);
            return callback(500, 'Error removing raw video');
          }

          video.filesize = meter.bytes;
          video.save().then(function (video) {
            console.log('video: '+rawVideoPath+' ingested.');
            return callback(201);
          }).catch(function (err) {
            console.log(err);
            return callback(500, "video save error: "+err);
          });
        });
      }

      var finalize_ingestion = function () {

        if (config.debugMode === true) {
          var destFile = basePath + '/full/full_' + path.basename(video.encVideoPath());
          var fullDir = path.dirname(destFile);
          console.log('about to exists');
          if (!fs.existsSync(fullDir)) {
            try {
              fs.mkdirSync(fullDir);
            } catch (err) {
              console.error("Failed to create full video directory", err);
              return callback(500, 'Internal error');
            }
          }

          var orig = fs.createReadStream(rawVideoPath);
          var dest = fs.createWriteStream(destFile);

          orig.on('end', function () {
            unlinkAndSave();
          });

          orig.pipe(crypto.encryptor()).pipe(dest);
        } else {
          unlinkAndSave();
        }
      } // file ingestion

      unencrypted_vid_output_stream.on('finish', function () {
        var unencrypted_video_stream = fs.createReadStream(unenc_video_path),
            encrypted_video_stream = fs.createWriteStream(enc_video_path);
        meter = new StreamMeter();
        unencrypted_video_stream.pipe(meter).pipe(crypto.encryptor()).pipe(encrypted_video_stream);

        unencrypted_video_stream.on('end', function() {
          fs.unlink(unenc_video_path, function(err) {
            if (err) {
                console.error('Error removing unencrypted temporary video file: ' + unenc_video_path, err);
            }

            console.log('finish video');
            var enc_audio_path = basePath + video.encAudioPath();
            var audio_ffmpeg = new FFmpeg({source: rawVideoPath});
            var audio_output_stream = fs.createWriteStream(unenc_audio_path);
            audio_ffmpeg = audio_ffmpeg.withNoVideo().addOption(['-strict -2', '-c:a copy']);

            //even if audio is not correctly produced, register video in database
            audio_ffmpeg.on('end', function () {
              var unencrypted_audio_stream = fs.createReadStream(unenc_audio_path),
                  encrypted_audio_stream = fs.createWriteStream(enc_audio_path);
              unencrypted_audio_stream.pipe(crypto.encryptor()).pipe(encrypted_audio_stream);

              unencrypted_audio_stream.on('end', function() {
                fs.unlink(unenc_audio_path, function(err) {
                  if (err) {
                    console.error('Error removing unencrypted temporary audio file: ' + unenc_audio_path, err);
                  }

                  console.log('audio done.')
                  finalize_ingestion();
                });
              });
            }).on('error', function (err) {
              console.log(err);
              finalize_ingestion();
            });

            audio_ffmpeg.format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(audio_output_stream);
          });
        });
      }).on('error', function (err) {
        return callback(500, "error finishing output stream: "+err);
      });

      outpipe.noAudio();

      // if (metadata.streams[0] && metadata.streams[0].tags.rotate == 90) {
      //   outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath90 + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):0 [out]');
      // } else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 180) {
      //   outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath270 + ' [watermark]; [in] [watermark] overlay=0:0 [out]');
      // } else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 270) {
      //   outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath180 + ' [watermark]; [in] [watermark] overlay=0:(main_h-overlay_h) [out]');
      // } else {
      //   outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):(main_h-overlay_h) [out]')
      // }

      outpipe.format('mp4').addOption(['-c:v copy', '-strict -2']).outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(unencrypted_vid_output_stream);
    });
  });
};
