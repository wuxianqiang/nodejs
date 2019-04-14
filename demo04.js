const http = require('http')
const url = require('url')

let routes = {
  all: []
};

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

let match = (pathname, routes, req, res) => {
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
  return hasPath
}

function app (req, res) {
  let { pathname } = url.parse(req.url, true)
  let method = req.method.toLowerCase();
  if (routes.hasOwnProperty(method)) {
    if (match(pathname, routes[method], req, res)) {
      return
    } else {
      if (match(pathname, routes.all, req, res)) {
        return
      }
    }
  } else {
    if (match(pathname, routes.all, req, res)) {
      return
    }
  }
  res.end('404')
}
// RESTful设计，表现层状态转化
['get', 'put', 'delete', 'post'].forEach(method => {
  routes[method] = [];
  app[method] = function (path, action) {
    routes[method].push([pathRegexp(path), action])
  }
})

app.use = function (path, action) {
  routes.all.push([pathRegexp(path), action])
}
// 路径参数
app.use('/user/:id', (req, res) => {
  res.end(req.params.id)
})

app.get('/login', (req, res) => {
  res.end('login')
})

let server = http.createServer(app)

server.listen(8080, () => {
  console.log('port in 8080')
})
