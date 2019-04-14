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
    let { path: { keys, regexp }, stack } = item
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
      handler(req, res, stack) // 递归执行
      hasPath = true
    }
  })
  return hasPath
}

function handler (req, res, stack) {
  let list = stack.slice()
  let next = () => {
    let middleware = list.shift()
    if (middleware) {
      middleware(req, res, next)
    }
  }
  next()
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
  app[method] = function (...args) {
    let handle = {
      path: pathRegexp(args[0]),
      stack: args.slice(1) // 中间件
    }
    routes[method].push(handle)
  }
})

app.use = function (...args) {
  let handle = {
    path: pathRegexp(args[0]),
    stack: args.slice(1) // 中间件
  }
  routes.all.push(handle)
}

let queryString = (req, res, next) => {
  req.query = url.parse(req.url, true).query
  next()
}
// 中间件
app.use('/user', queryString, (req, res) => {
  res.end('user')
})
app.get('/login', queryString, (req, res) => {
  res.end('login')
})

let server = http.createServer(app)

server.listen(8080, () => {
  console.log('port in 8080')
})
