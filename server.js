let http = require('http')
let fs = require('fs')
let path = require('path')
let URL = require('url')

const mime = {
  "css": "text/css",
  "gif": "image/gif",
  "html": "text/html",
  "ico": "image/x-icon",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "pdf": "application/pdf",
  "png": "image/png",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tiff": "image/tiff",
  "txt": "text/plain",
  "wav": "audio/x-wav",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "xml": "text/xml"
}
//哪些url请求需要代理（代理配置）
let conifg = {
  '/t.do': {
    target: 'http://pps.cmgame.com:9092'
  },

  '/activity': {
    target: 'http://pps.cmgame.com:9092'
  }
}

let app = http.createServer(function (request, response) {

  let url = request.url
  if (request.url !== '/favicon.ico') { //清除第二次访问
    //请求的数据是否存在代理
    for (var key in conifg) {
      if (url.indexOf(key) > -1) {
        let info = conifg[key].target.split(':')
        let opt = {
          protocol: info[0] + ':',
          host: info[1].slice(2),
          port: info[2] || 80,
          method: request.method, //这里是发送的方法
          path: url, //这里是访问的路径
          json: true,
          headers: request.headers
        }
        proxy(opt, response, request) //代理方法
        return;
      }
    }

    // url = url.substring(0, url.indexOf('?'))

    console.log(url)

    //正常的读取文件和其他资源加载
    // let realPath = path.join(__dirname, ((url.indexOf('html') != -1) ? '/src/index.html' : '/src' + url))
    let realPath = path.join(__dirname, ((url.indexOf('html') != -1) ? (url.indexOf('index') != -1 ? '/src/index.html' : '/src/gopay.html') : '/src' + url))



    // console.log(realPath, realPath1)

    fs.readFile(realPath, 'binary', function (err, data) {

      if (err) {
        console.log('file-err', err)
      } else {
        var ext = path.extname(realPath);
        ext = ext ? ext.slice(1) : 'unknown';

        var contentType = mime[ext] || "text/plain";
        response.writeHead(200, {
          'Content-Type': contentType
        });
        response.write(data, "binary");
        response.end();
        // response.end(data)
      }
    });
  }
})

//代理转发的方法
function proxy(opt, res, req) {
  var proxyRequest = http.request(opt, function (proxyResponse) { //代理请求获取的数据再返回给本地res
    proxyResponse.on('data', function (chunk) {
      console.log(chunk.toString('utf-8'))
      res.write(chunk, 'binary');
    });
    //当代理请求不再收到新的数据，告知本地res数据写入完毕。
    proxyResponse.on('end', function () {
      res.end();
    });
    res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
  });
  //data只有当请求体数据进来时才会触发
  //尽管没有请求体数据进来，data还是要写，否则不会触发end事件
  req.on('data', function (chunk) {
    console.log('in request length:', chunk.length);
    proxyRequest.write(chunk, 'binary');
  });
  req.on('end', function () {
    //向proxy发送求情，这里end方法必须被调用才能发起代理请求
    //所有的客户端请求都需要通过end来发起
    proxyRequest.end();
  });
}

app.listen(8000)
console.log('server is listen on 8000....')
