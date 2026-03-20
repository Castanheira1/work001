function sc(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/^./, function (ch) { return ch.toUpperCase(); });
}

function arrayBufferToBase64(buffer) {
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  var binary = '';
  for (var i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  var binary = atob(base64);
  var len = binary.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64ToBlob(base64, type) {
  var binary = atob(base64);
  var len = binary.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: type || 'application/octet-stream' });
}
