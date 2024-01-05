;(function(g){typeof exports==="object"&&typeof module!=="undefined"?module.exports=tarts:((g?g:self).tarts=tarts);

const headers = {
  name: 100,
  mode: 8,
  uid: 8,
  gid: 8,
  size: 12,
  mtime: 12,
  chksum: 8,
  typeflag: 1,
  linkname: 100,
  magic: 5,
  version: 2,
  uname: 32,
  gname: 32,
  devmajor: 8,
  devminor: 8,
  prefix: 155,
  padding: 12
}

const offsets = {}
Object.keys(headers).reduce((acc, k) => {
  offsets[k] = acc
  return acc + headers[k]
}, 0)

const defaults = f => ({
  name: f.name,
  mode: '777',
  uid: 0,
  gid: 0,
  size: f.content.byteLength,
  mtime: Math.floor(Number(new Date()) / 1000),
  chksum: '        ',
  typeflag: '0',
  magic: 'ustar',
  version: '  ',
  uname: '',
  gname: ''
})

const nopad = ['name', 'linkname', 'magic', 'chksum', 'typeflag', 'version', 'uname', 'gname']
    , bsize = 512

function tarts(files) {
  return files.reduce((a, f) => {
    if (typeof f.content === 'string')
      f.content = stringToUint8(f.content)

    f = Object.assign(defaults(f), f)

    const b = new Uint8Array(Math.ceil((bsize + f.size) / bsize) * bsize)

    const checksum = Object.keys(headers).reduce((acc, k) => {
      if (!(k in f))
        return acc

      const value = stringToUint8(nopad.indexOf(k) > -1
        ? f[k]
        : pad(f[k], headers[k] - 1))

      b.set(value, offsets[k])
      return acc + value.reduce((a, b) => a + b, 0)
    }, 0)

    b.set(stringToUint8(pad(checksum, 7)), offsets.chksum)
    b.set(f.content, bsize)

    const sum = new Uint8Array(a.byteLength + b.byteLength)
    sum.set(a, 0)
    sum.set(b, a.byteLength)

    return sum
  }, new Uint8Array(0))
}

function pad(s, n) {
  s = s.toString(8)
  return ('000000000000' + s).slice(s.length + 12 - n)
}

function stringToUint8(s) {
  const a = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++)
    a[i] = s.charCodeAt(i)
  return a
}
})(this);