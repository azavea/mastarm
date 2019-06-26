const AWS = require('aws-sdk')
const mime = require('mime')

const logger = require('./logger')

module.exports = ({ s3bucket }) => ({ body, outfile }) =>
  upload({ body, outfile, s3bucket })

/**
 * Upload the contents of a file to s3.
 */
function upload ({ body, s3bucket, outfile }) {
  const bucketUrl = `https://s3.amazonaws.com/${s3bucket}`
  return new Promise((resolve, reject) => {
    const s3object = new AWS.S3({
      params: {
        ACL: 'public-read',
        Body: body,
        Bucket: s3bucket,
        ContentType: mime.getType(outfile),
        Key: outfile
      }
    })

    const bytes = bytesToSize(body.byteLength || body.length)
    const bucketLink = `<${bucketUrl}/${outfile}|${s3bucket}/${outfile}>`
    s3object.upload().send(function (err) {
      if (err) {
        return reject(
          new Error(
            `s3 upload to ${bucketLink} rejected with ${err.code} ${
              err.message
            }`
          )
        )
      } else {
        done()
      }
    })

    /**
     * Helper function to log a successful upload to s3.
     */
    function done () {
      logger
        .log(`:checkered_flag: *uploaded:* ${bucketLink} (${bytes})`)
        .then(resolve)
    }
  })
}

const BYTES = 1024
const DISPLAY_DECIMALS = 2

/**
 * Pretty print the size of the number of bytes.
 */
function bytesToSize (bytes) {
  const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb']
  if (bytes === 0) return '0 byte'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(BYTES)))
  return (bytes / Math.pow(BYTES, i)).toFixed(DISPLAY_DECIMALS) + sizes[i]
}
