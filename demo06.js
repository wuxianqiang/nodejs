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
  let stacks = []
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
      stacks = stacks.concat(stack)
    }
  })
  return stacks
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
  let stacks = match(pathname, routes.all, req, res)
  if (routes.hasOwnProperty(method)) {
    stacks = stacks.concat(match(pathname, routes[method], req, res))
  }
  if (stacks.length) {
    handler(req, res, stacks)
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
  let path = args[0]
  let handle = {}
  if (typeof path === 'string') {
    handle = {
      path: pathRegexp(path),
      stack: args.slice(1) // 中间件
    }
  } else {
    handle = {
      path: { keys: [], regexp: /\// },
      stack: args.slice() // 中间件
    }
  }
  routes.all.push(handle)
}

let queryString = (req, res, next) => {
  req.query = url.parse(req.url, true).query
  console.log(req.query)
  next()
}
// 路由和中间件结合
app.use(queryString)
app.get('/login', (req, res) => {
  res.end('login')
})

let server = http.createServer(app)

server.listen(8080, () => {
  console.log('port in 8080')
})
