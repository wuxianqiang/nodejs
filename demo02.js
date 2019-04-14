const http = require('http')
const url = require('url')

let routes = [];
let pathRegexp = (path, strict) => {
  path = path
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, function (_, slash, format, key, capture, optional, star) {
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '')
        + (star ? '(/*)?' : '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.*)');
  return new RegExp('^' + path + '$');
}

function app (req, res) {
  let { pathname } = url.parse(req.url, true)
  let hasPath = false
  routes.forEach(item => {
    let [path, handler] = item
    if (path.exec(pathname)) {
      handler(req, res)
      hasPath = true
    }
  })
  if (!hasPath) {
    res.end('404')
  }
}

app.use = function (path, action) {
  routes.push([pathRegexp(path), action])
}
// 正则匹配路由
app.use('/user/:id', (req, res) => {
  res.end('user')
})

let server = http.createServer(app)

server.listen(8080, () => {
  console.log('port in 8080')
})
