const aliases = {
  darwin: ['mac', 'macos', 'osx'],
  exe: ['win32', 'windows', 'win'],
  deb: ['debian'],
  rpm: ['fedora'],
  AppImage: ['appimage'],
  dmg: ['dmg'],
  nupkg: ['nupkg'],
}

// Add support for _arm64 and _x64 aliases
for (const existingPlatform of Object.keys(aliases)) {
  const arm64 = existingPlatform + '_arm64';
  aliases[arm64] = aliases[existingPlatform].map(alias => `${alias}_arm64`);
  
  const x64 = existingPlatform + '_x64';
  aliases[x64] = aliases[existingPlatform].map(alias => `${alias}_x64`);
}

module.exports = platform => {
  if (typeof aliases[platform] !== 'undefined') {
    return platform
  }

  for (const guess of Object.keys(aliases)) {
    const list = aliases[guess]

    if (list.includes(platform)) {
      return guess
    }
  }

  return false
}
