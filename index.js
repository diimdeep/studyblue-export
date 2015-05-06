#!/usr/bin/env node

var iconv = require('iconv-lite');
var program = require('commander');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
path = require('path');

program
  .version('0.1.1')
  .usage('--url <url> --out <filename or path>')
  .option('-u, --url <url>', 'URL to scrape')
  .option('-o, --out <out>', 'Output file name or path')
  .parse(process.argv);

var url = program.url;
var out = program.out;

if (!url) {
    console.log('Error: no URL specified');
    program.help();
    process.exit(1);
    return;
}

if (!out) {
    console.log('Error: no Output file name specified');
    program.help();
    process.exit(1);
    return;
}


var basePath = path.isAbsolute(out)? out : path.join(process.cwd(), out);
var filePath = basePath + '.md';
if (!fs.existsSync(basePath))
    fs.mkdirSync(basePath);


request.get({
  url: url,
  encoding: null,
  headers: {
    'User-Agent': 'curl/0.76.0'
  }
}, function(err, res, body) {
  if (err) {
    console.log('Error: ' + err);
    process.exit(1);
    return;
  }
    handleDeckMarkdown(body);
});

function handleDeckMarkdown(body) {
  body = iconv.decode(new Buffer(body), "ISO-8859-1");
  var ret = 'Source: ' + url + '\n\n';
  var $ = cheerio.load(body);
  $('div.card').each(function() {
    var $this = $(this);

    var front = $this.find('.front').text().trim();
    var back = $this.find('.back').text().trim();

    var imgSrc = $this.find('img').attr('src');
    if(imgSrc){
        var imgName = path.basename(imgSrc);
        var imgPath = path.join(basePath, imgName);
        fs.exists(imgPath, function (exists) {
            if (!exists)
                request(imgSrc).pipe(fs.createWriteStream(imgPath));
        });

        ret += '# ' + back + '\n';
        ret += '![](' + path.join(out, imgName) + ')\n\n';
    }
    else{
        ret += '# ' + front + '\n';
        ret += back + '\n\n';
    }
  });
    fs.writeFile(filePath, ret, function (err) {
        if (err) throw err;
        console.log('It\'s saved!');
    });
}

