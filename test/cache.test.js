/* eslint-disable no-new */
/* global describe, it, expect */
const Cache = require('../lib/cache')

describe('Cache', () => {
  it('should throw when account is not defined', () => {
    expect(() => {
      const config = { repository: 'desktop' }
      new Cache(config)
    }).toThrow(/ACCOUNT/)
  })

  it('should throw when repository is not defined', () => {
    expect(() => {
      const config = { account: 'replit' }
      new Cache(config)
    }).toThrow(/REPOSITORY/)
  })

  it('should throw when token is defined and url is not', () => {
    expect(() => {
      const config = { account: 'replit', repository: 'desktop', token: 'abc' }
      new Cache(config)
    }).toThrow(/URL/)
  })

  it('should run without errors', () => {
    const config = {
      account: 'replit',
      repository: 'desktop',
      token: process.env.TOKEN,
      url: process.env.URL
    }

    new Cache(config)
  })

  it('should refresh the cache', async () => {
    const config = {
      account: 'replit',
      repository: 'desktop',
      token: process.env.TOKEN,
      url: process.env.URL
    }

    const cache = new Cache(config)
    const storage = await cache.loadCache()

    expect(typeof storage.version).toBe('string')
    expect(typeof storage.platforms).toBe('object')
  })

  it('should set platforms correctly', async () => {
    const config = {
      account: 'replit',
      repository: 'desktop',
      token: process.env.TOKEN,
      url: process.env.URL
    }

    const cache = new Cache(config)
    const storage = await cache.loadCache()

    console.log(storage.platforms.darwin)
  })
})
