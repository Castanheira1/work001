function sc(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/^./, function (ch) { return ch.toUpperCase(); });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  for (let i = 0; i < bytes.length; i += 8192)
    chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)));
  return btoa(chunks.join(''));
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

