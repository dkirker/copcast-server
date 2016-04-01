var path = require('path'),
  fs = require('node-fs'),
  FFmpeg = require('fluent-ffmpeg'),
  db = require('../../db'),
  crypto = require('../../crypto'),
  uuid = require('node-uuid'),
  StreamMeter = require('stream-meter'),
  archiver = require('archiver');


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
    fs.unlinkSync(tempfilename);
    callback();
  }).on('error', function (err, stdout, stderr) {
    callback('e1'+err);
  }).videoFilters([
      {
        filter: 'drawtext',
        options: {
          fontfile: fontsPath, text: ' Video recorded by ' + userRecorder.name ,
          fontsize: 10, fontcolor: 'white', boxcolor: 'black', boxborderw: '1', fix_bounds: '1', box: '1', y: '0'
        }
      }, {
        filter: 'drawtext',
        options: {
          fontfile: fontsPath, text: ' At ' + moment(video.date).format('YY/MM/DD HH_mm') ,
          fontsize: 10, fontcolor: 'white', boxcolor: 'black', boxborderw: '1', fix_bounds: '1', box: '1', y: '12'
        }
      },{
        filter: 'drawtext', options: {
          fontfile: fontsPath, text:  ' Exported by ' + user.name ,
          fontsize: 10, fontcolor: 'white', boxcolor: 'black', boxborderw: '1', fix_bounds: '1', box: '1', y: '24'
        }
      },{
        filter: 'drawtext', options: {
          fontfile: fontsPath, text: ' At ' +
          moment(video.date).format('YY/MM/DD HH_mm'),
          fontsize: 10, fontcolor: 'white', boxcolor: 'black', boxborderw: '1', fix_bounds: '1', box: '1', y: '36'
        }
      }])
    .save(filename);
}
exports.exportVideoFile = function (directory, video, userRecorded, user, callback) {
  var pathExport = zipBasePath + directory + '/'
  fs.mkdir(pathExport, 0777, true, function (err) {

    if (!fs.existsSync(basePath + video.encVideoPath()))
      return callback('video file not found', null);

    fs.mkdirSync(path.dirname(pathExport + video.videoPath()), 0777, true)
    fs.mkdirSync(path.dirname(pathExport + video.audioPath()), 0777, true)
    var outputVideoStream = fs.createWriteStream(pathExport + video.videoPath());
    var outputAudioStream = fs.createWriteStream(pathExport + video.audioPath());

    fs.createReadStream(basePath + video.encVideoPath()).on('error', function (err) {
      console.log('e2'+err)
    }).on('end', function () {

      fs.createReadStream(basePath + video.encAudioPath()).on('error', function (err) {
        console.log('e3'+err)
      }).on('end', function () {


        var ffmpeg = new FFmpeg({source: pathExport + video.videoPath()});
        var tempfilename = pathExport + video.userId + '/' + moment(video.date).format('YY-MM-DD_hh-MM-ss') + '1.mp4';
        var filename = pathExport + video.userId + '/' + moment(video.date).format('YY-MM-DD_hh-MM-ss') + '.mp4';
        ffmpeg.on('end', function () {
          fs.unlinkSync(pathExport + video.videoPath())
          fs.unlinkSync(pathExport + video.audioPath())
          addExporterWatermark(video, tempfilename, filename, userRecorded, user, callback)
        }).on('error', function (err, stdout, stderr) {
          fs.unlinkSync(pathExport + video.videoPath())
          fs.unlinkSync(pathExport + video.audioPath())
          callback('e4'+err);
        }).addInput(pathExport + video.audioPath()).addOptions(['-c:v copy', '-c:a libfdk_aac', '-b:a 128k']).save(tempfilename);
      }).pipe(crypto.decryptor()).pipe(outputAudioStream);
    }).pipe(crypto.decryptor()).pipe(outputVideoStream);
  })
};


exports.ingestVideo = function (rawVideoPath, user, dateRecorded, callback) {
  var meter, duration;
  FFmpeg.ffprobe(rawVideoPath, function (err, metadata) {
    if (err)
      return callback(500, "p1:"+err);

    if (!metadata) {
      //por enquanto vamos abortar neste caso
      return callback(500, 'WARNING: could not read metadata');
    }

    if (metadata.format)
      duration = Math.ceil(metadata.format.duration);
    else
      duration = metadata.durationsec;

    var video = db.video.build({id: uuid.v4(), date: dateRecorded.toISOString(), duration: duration});
    video.setUser(user, {save: false});
    var enc_video_path = basePath + video.encVideoPath();
    var enc_audio_path = basePath + video.encAudioPath();

    fs.mkdir(path.dirname(enc_video_path), 0777, true, function (err) {
      if (err)
        return callback(500, "p2:"+err);

      var ffmpeg = new FFmpeg({source: rawVideoPath});
      var vid_output_stream = fs.createWriteStream(enc_video_path);

      var outpipe = ffmpeg.on('error', function (err, stdout, stderr) {
        return callback(500, "p3:"+err);
      }).on('end',function(){
        console.log('finish video');
        var enc_audio_path = basePath + video.encAudioPath();
        var audio_ffmpeg = new FFmpeg({source: rawVideoPath});
        var audio_output_stream = fs.createWriteStream(enc_audio_path);
        audio_ffmpeg = audio_ffmpeg.withNoVideo().addOption('-strict -2');

        //even if audio is not correctly produced, register video in database
        audio_ffmpeg.on('end', function () {
          console.log('audio done.')
          finalize_ingestion();
        }).on('error', function (err) {
          console.log(err);
          finalize_ingestion();
        });

        audio_ffmpeg.format('mp4').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(crypto.encryptor()).pipe(audio_output_stream);

      });

      var finalize_ingestion = function () {
        fs.unlink(rawVideoPath, function () {
          video.filesize = meter.bytes;
          video.save().then(function (video) {
            return callback(201);
          }).catch(function (err) {
            console.log(err);
            return callback(500, "p4:"+err);
          });
        });
      }

      vid_output_stream.on('error', function (err) {
        return callback(500, "p5:"+err);
      });

      outpipe.noAudio();

      if (metadata.streams[0] && metadata.streams[0].tags.rotate == 90) {
        outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath90 + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):0 [out]');
      } else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 180) {
        outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath270 + ' [watermark]; [in] [watermark] overlay=0:0 [out]');
      } else if (metadata.streams[0] && metadata.streams[0].tags.rotate == 270) {
        outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath180 + ' [watermark]; [in] [watermark] overlay=0:(main_h-overlay_h) [out]');
      } else {
        outpipe = outpipe.addOption('-vf', 'movie=' + watermarkPath + ' [watermark]; [in] [watermark] overlay=(main_w-overlay_w):(main_h-overlay_h) [out]')
      }

      meter = new StreamMeter();
      outpipe.format('mp4').addOption('-vcodec', 'libx264').outputOptions('-movflags frag_keyframe+empty_moov').pipe().pipe(meter).pipe(crypto.encryptor()).pipe(vid_output_stream);
    });
  });
};
