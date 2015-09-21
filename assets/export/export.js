function loadHandler() {
  var data = getExportData();

  var blob = new Blob([data], {type: "octet/stream"});
  var objectURL = window.URL.createObjectURL(blob);

  var a = document.getElementById('download-link');
  a.innerText = 'Download (' + data.length + ' bytes)';
  a.href = objectURL;
}

function getExportData() {
  return localStorage.localStoreData;
}

function copyAndPasteMode() {
  document.body.innerText = getExportData();
}
