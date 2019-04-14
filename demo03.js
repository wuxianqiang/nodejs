const http = require('http')
const url = require('url')

let routes = [];
let pathRegexp = (path, strict) => {
  let keys = [];
  path = path
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?(\*)?/g, function (_, slash, format, key, capture, optional, star) {
      slash = slash || '';
      keys.push(key);
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
  return {
    keys,
    regexp: new RegExp('^' + path + '$')
  }
}

function app (req, res) {
  let { pathname } = url.parse(req.url, true)
  let hasPath = false
  routes.forEach(item => {
    let [{ keys, regexp }, handler] = item
    let matched = regexp.exec(pathname)
    if (matched) {
      let params = {}
      keys.forEach((item, index) => {
        let value = matched[index + 1]
        if (value) {
          params[item] = value
        }
      })
      req.params = params
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
// 路径参数
app.use('/user/:id', (req, res) => {
  res.end(req.params.id)
})

let server = http.createServer(app)

server.listen(8080, () => {
  console.log('port in 8080')
})
