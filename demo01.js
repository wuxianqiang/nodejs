const http = require('http')
const url = require('url')

let routes = [];

function app (req, res) {
  let { pathname } = url.parse(req.url, true)
  let hasPath = false
  routes.forEach(item => {
    let [path, handler] = item
    if (pathname === path) {
      handler(req, res)
      hasPath = true
    }
  })
  if (!hasPath) {
    res.end('404')
  }
}

app.use = function (path, action) {
  routes.push([path, action])
}
// 手工配置路由
app.use('/user', (req, res) => {
  res.end('user')
})

let server = http.createServer(app)

server.listen(8080, () => {
  console.log('port in 8080')
})
