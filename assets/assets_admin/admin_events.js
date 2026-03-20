document.addEventListener("DOMContentLoaded",function(){
  var inp=$("fileInputOms");
  if(inp){inp.addEventListener("change",async function(e){var files=Array.from(e.target.files||[]);e.target.value="";if(files.length)handleUploadFiles(files);});}

  var zone=$("uploadZone");
  if(zone){
    ["dragenter","dragover"].forEach(function(ev){zone.addEventListener(ev,function(e){e.preventDefault();e.stopPropagation();zone.classList.add("dragover");});});
    ["dragleave","drop"].forEach(function(ev){zone.addEventListener(ev,function(e){e.preventDefault();e.stopPropagation();zone.classList.remove("dragover");});});
    zone.addEventListener("drop",function(e){var files=Array.from(e.dataTransfer.files).filter(function(f){return f.type==="application/pdf";});if(files.length)handleUploadFiles(files);});
  }

  $("cfgBmNumero").addEventListener("input",atualizarBmPreview);
  $("cfgBmInicio").addEventListener("input",atualizarBmPreview);
  $("cfgBmFim").addEventListener("input",atualizarBmPreview);

  $("hdMesmaEquipe").addEventListener("change",function(){$("hdNovoExecRow").style.display=this.value==="diferente"?"block":"none";});
  $("hdEquipeDiferente").addEventListener("change",function(){$("hdNovoExecRow").style.display=this.value==="diferente"?"block":"none";});

  $("omModal").addEventListener("click",function(e){if(e.target===$("omModal"))closeOmModal();});

  document.addEventListener("keydown",function(e){if(e.key==="Escape"){closePdfViewer();closeOmModal();}});
});
