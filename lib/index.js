const Router = require('router')
const finalhandler = require('finalhandler')
const Cache = require('./cache')

module.exports = config => {
  console.log('Initializing router');
  const router = Router()
  let cache = null;

  try {
    cache = new Cache(config)
  } catch (err) {
    const { code, message } = err

    if (code) {
      return (req, res) => {
        res.statusCode = 400;

        res.end(JSON.stringify({
          error: {
            code,
            message
          }
        }))
      }
    }

    throw err
  }

  const routes = require('./routes')({ cache, config })

  router.get('/', routes.overview)
  router.get('/latest', routes.latest)
  router.get('/download', routes.download)
  router.get('/download/:platform', routes.downloadPlatform)
  router.get('/update/:platform/:version', routes.update)
  router.get('/update/win32/:version/RELEASES', routes.releases)

  return (req, res) => {
    router(req, res, finalhandler(req, res))
  }
}
