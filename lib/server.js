const hazel = require('./index')

const {
  INTERVAL: interval,
  ACCOUNT: account,
  REPOSITORY: repository,
  PRE: pre,
  TOKEN: token,
  URL: url,
} = process.env

module.exports = hazel({
  interval,
  account,
  repository,
  pre,
  token,
  url
})
