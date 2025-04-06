document.getElementById('fileUploadBtn').addEventListener('click', function() {
    document.getElementById('fileInput').click();
});

const dropZone = document.getElementById('dropZone');
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drop-active'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drop-active'), false);
});

dropZone.addEventListener('drop', function(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
});

function handleFiles(files) {
    console.log('Files uploaded:', files);
    alert(`${files.length} file(s) uploaded!`);
}
