function sc(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/^./, function (ch) { return ch.toUpperCase(); });
}

function arrayBufferToBase64(buffer) {
  var bytes = new Uint8Array(buffer);
  var chunks = [];
  for (var i = 0; i < bytes.length; i += 8192)
    chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)));
  return btoa(chunks.join(''));
}

function base64ToArrayBuffer(base64) {
  var binary = atob(base64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

