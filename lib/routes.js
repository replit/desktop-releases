const urlHelpers = require('url');
const { send } = require('micro')
const { valid, compare } = require('semver')
const { parse } = require('express-useragent')
const fetch = require('node-fetch')
const distanceInWordsToNow = require('date-fns/distance_in_words_to_now')
const checkAlias = require('./aliases')
const prepareView = require('./view')

module.exports = ({ cache, config }) => {
  const { loadCache } = cache
  const exports = {}
  const { token, url } = config
  console.log('Initializing route handlers')

  const proxyPrivateDownload = (asset, _req, res) => {
    const redirect = 'manual'
    const headers = { Accept: 'application/octet-stream', Authorization: `Bearer ${token}` }
    const options = { headers, redirect }
    const { api_url: url } = asset

    fetch(url, options)
      .then(assetRes => {
        res.setHeader('Location', assetRes.headers.get('location'))
        send(res, 302)
      })
  }

  exports.download = async (req, res) => {
    const userAgent = parse(req.headers['user-agent'])
    const params = urlHelpers.parse(req.url, true).query
    const isUpdate = params && params.update

    let platform

    if (userAgent.isMac && isUpdate) {
      platform = 'darwin'
    } else if (userAgent.isMac && !isUpdate) {
      platform = 'dmg'
    } else if (userAgent.isWindows) {
      platform = 'exe'
    }

    // Get the latest version from the cache
    const { platforms } = await loadCache()

    if (!platform || !platforms || !platforms[platform]) {
      send(res, 404, 'No download available for your platform!')
      return
    }

    proxyPrivateDownload(platforms[platform], req, res)
  }

  exports.downloadPlatform = async (req, res) => {
    const params = urlHelpers.parse(req.url, true).query
    const isUpdate = params && params.update

    let { platform } = req.params

    // Downloading an Apple Silicon build, point to the arm64 DMG
    if ((platform === 'mac' || platform === 'mac_arm64' || platform == 'mac_m1') && !isUpdate) {
      platform = 'dmg'
    }
    
    // Downloading an Intel build, point to the x64 DMG
    if ((platform === 'mac_intel' || platform === 'mac_x86' || platform === 'mac_x64') && !isUpdate) {
      platform = 'dmg_x64'
    }

    // This adds support for passing the raw filepath as part of
    // the download URL for .nupkg files. This is necessary to be able to
    // download the latest .nupkg file while still encoding the exact
    // file name and version in the URL which Squirrel.Windows needs to
    // determine if a download is necessary in the first place.
    // Inspired by https://github.com/vercel/hazel/issues/79#issuecomment-1010293920
    if (platform.endsWith('nupkg')) {
      platform = 'nupkg';
    }

    // Get the latest version from the cache
    const latest = await loadCache()

    // Check platform for appropiate aliases
    platform = checkAlias(platform)

    if (!platform) {
      send(res, 500, 'The specified platform is not valid')
      return
    }

    if (!latest.platforms || !latest.platforms[platform]) {
      send(res, 404, 'No download available for your platform')
      return
    }

    proxyPrivateDownload(latest.platforms[platform], req, res)
  }

  exports.update = async (req, res) => {
    const { platform: platformName, version } = req.params

    if (!valid(version)) {
      send(res, 500, {
        error: 'version_invalid',
        message: 'The specified version is not SemVer-compatible'
      })

      return
    }

    const platform = checkAlias(platformName)

    if (!platform) {
      send(res, 500, {
        error: 'invalid_platform',
        message: 'The specified platform is not valid'
      })

      return
    }

    // Get the latest version from the cache
    const latest = await loadCache()
    if (!latest.platforms || !latest.platforms[platform]) {
      res.statusCode = 204
      res.end()

      return
    }

    // Previously, we were checking if the latest version is
    // greater than the one on the client. However, we
    // only need to compare if they're different (even if
    // lower) in order to trigger an update.

    // This allows developers to downgrade their users
    // to a lower version in the case that a major bug happens
    // that will take a long time to fix and release
    // a patch update.
    if (compare(latest.version, version) !== 0) {
      const { notes, pub_date } = latest
      const downloadUrl = `${url}/download/${platformName}?update=true`

      // We have an update so respond with a 200 "OK" and the release metadata
      // per the spec: https://github.com/Squirrel/Squirrel.Mac#update-server-json-format
      send(res, 200, {
        name: latest.version,
        notes,
        pub_date,
        url: downloadUrl,
      })

      return
    }

    // No new updates so we respond with a 204 "No Content"
    res.statusCode = 204
    res.end()
  }

  exports.releases = async (req, res) => {
    // Get the latest version from the cache
    const latest = await loadCache()

    if (!latest.files || !latest.files.RELEASES) {
      res.statusCode = 204
      res.end()

      return
    }

    const content = latest.files.RELEASES

    res.writeHead(200, {
      'content-length': Buffer.byteLength(content, 'utf8'),
      'content-type': 'application/octet-stream'
    })

    res.end(content)
  }

  exports.latest = async(req, res) => {
    const latest = await loadCache()
    
    send(res, 200, {
      version: latest.version,
    })
  }

  exports.overview = async (req, res) => {
    // In production, we should redirect this route to the actual desktop app landing page at replit.com/desktop
    if (process.env.NODE_ENV === 'production') {
      const downloadPage = 'https://replit.com/desktop';
      res.setHeader('Location', downloadPage);
      
      send(res, 302);
      
      return;
    }

    // In development, we want to see the preview landing page
    const latest = await loadCache()

    try {
      const render = await prepareView()

      const files = {
        'Windows': {
          url: '/download/windows',
          size: latest.platforms['exe'].size,
        },
        'Mac (Intel)': {
          url: '/download/mac_x86',
          size: latest.platforms['darwin'].size,
        },
        'Mac (M1)': {
          url: '/download/mac',
          size: latest.platforms['dmg'].size,
        },
        'Debian': {
          url: '/download/deb',
          size: latest.platforms['deb'].size,
        },
        'Debian (Arm64)': {
          url: '/download/deb_arm64',
          size: latest.platforms['deb_arm64'].size,
        }
      }

      const details = {
        account: config.account,
        repository: config.repository,
        date: latest.pub_date ? distanceInWordsToNow(latest.pub_date, { addSuffix: true }) : "No releases published",
        files,
        version: latest.version,
        url: config.url,
      }

      send(res, 200, render(details))
    } catch (err) {
      console.error(err)
      send(res, 500, 'Error reading overview file')
    }
  }

  return exports
}
