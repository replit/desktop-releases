# Desktop Release Server

<span><a href="https://replit.com/@util/desktop-releases" title="Run on Replit badge"><img src="https://replit.com/badge/github/replit/desktop-releases" alt="Run on Replit badge" /></a></span>

Update release server based on [Hazel](https://github.com/vercel/hazel) and used by the [desktop app](https://github.com/replit/desktop).

## Usage

Deploy the app to https://desktop-app-releases.replit.app/

Then set the following code in the Electron client:

```js
const { app, autoUpdater } = require('electron')

const server = <your-deployment-url>
const url = `${server}/update/${process.platform}/${app.getVersion()}`

autoUpdater.setFeedURL({ url })
```

That's it! :white_check_mark:

From now on, the auto updater will ask your server for updates!

## Env vars

The following environment variables must be set:

- `ACCOUNT`: The name of the account that owns the repository 
- `REPOSITORY`: The name of the repository
- `TOKEN`: Your GitHub token (for private repos)
- `URL`: The server's URL

The token must be set to a [fine-grained personal access token](https://github.com/settings/tokens?type=beta) with access to the [replit/desktop](https://github.com/replit/desktop) repo and content-read permissions.

The current token is set to expire on April 29th, 2024

## Routes

### /

Displays an overview page showing the cached repository with the different available platforms and file sizes. Links to the repo, releases, specific cached version and direct downloads for each platform are present.

### /download

Automatically detects the platform/OS of the visitor by parsing the user agent and then downloads the appropriate copy of your application.

If the latest version of the application wasn't yet pulled from [GitHub Releases](https://help.github.com/articles/creating-releases/), it will return a message and the status code `404`. The same happens if the latest release doesn't contain a file for the detected platform.

### /download/:platform

Accepts a platform (like "darwin" or "win32") to download the appropriate copy your app for. I generally suggest using either `process.platform` ([more](https://nodejs.org/api/process.html#process_process_platform)) or `os.platform()` ([more](https://nodejs.org/api/os.html#os_os_platform)) to retrieve this string.

If the cache isn't filled yet or doesn't contain a download link for the specified platform, it will respond like `/`.

### /update/:platform/:version

Checks if there is an update available by reading from the cache.

If the latest version of the application wasn't yet pulled from [GitHub Releases](https://help.github.com/articles/creating-releases/), it will return the `204` status code. The same happens if the latest release doesn't contain a file for the specified platform.

### /update/win32/:version/RELEASES

This endpoint was specifically crafted for the Windows platform (called "win32" [in Node.js](https://nodejs.org/api/process.html#process_process_platform)).

Since the [Windows version](https://github.com/Squirrel/Squirrel.Windows) of Squirrel (the software that powers auto updates inside [Electron](https://www.electronjs.org)) requires access to a file named "RELEASES" when checking for updates, this endpoint will respond with a cached version of the file that contains a download link to a `.nupkg` file (the application update).
