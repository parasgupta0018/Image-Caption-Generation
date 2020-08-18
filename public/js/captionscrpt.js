
const dropZoneElement = document.getElementById("dropzone");
const inputElement = document.getElementsByClassName("imgupload")[0];

inputElement.addEventListener("change", (e) => {
  if (inputElement.files.length) {
    updateThumbnail(dropZoneElement, inputElement.files[0]);
  }
});

const imgform = document.getElementById('imgfileform');
imgform.addEventListener('submit',(e)=>{
  e.preventDefault();
})

dropZoneElement.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZoneElement.style.borderStyle = 'solid';
});

["dragleave", "dragend"].forEach((type) => {
  dropZoneElement.addEventListener(type, (e) => {
    dropZoneElement.style.borderStyle = 'dashed';
  });
});

dropZoneElement.addEventListener("drop", (e) => {
  e.preventDefault();

  if (e.dataTransfer.files.length) {
    inputElement.files = e.dataTransfer.files;
    updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
  }

  dropZoneElement.style.borderStyle = 'dashed';
});

//copy to clipboard function 
function CopyToClipboard(containerid) {
  M.toast({html: 'Copied to Clipboard!!', displayLength: 2000});
  var range = document.createRange();
  range.selectNode(document.getElementById(containerid));
  window.getSelection().removeAllRanges(); // clear current selection
  window.getSelection().addRange(range); // to select text
  document.execCommand("copy");
  window.getSelection().removeAllRanges();// to deselect
}

function updateThumbnail(dropZoneElement, file) {
  let thumbnailElement = document.getElementsByClassName('box_uploading')[0];
  let thumbnail = thumbnailElement.parentElement.parentElement;
  let formelement = document.getElementsByClassName('main-form')[0];
  $(formelement).hide();
  $(thumbnail).show()
  console.log(file.name);
  thumbnailElement.dataset.label = file.name;
  if(window.innerWidth <= 600)
  { 
    let stylechange = document.getElementById('dropzone');
    stylechange.style.padding = '0';
    stylechange.style.height = '90vw';
  }
  
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    //console.log('file1 : ',reader);
    reader.onload = () => {
      thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
    };
  } else {
    thumbnailElement.style.backgroundImage = null;
    Swal.fire({
      title: 'Invalid Image',
      text: "Images only with extension jpeg | jpg | png | gif are valid!",
      icon: 'warning',
      allowOutsideClick: false,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Try again'
    }).then((result) => {
      if (result.value) {
        location.reload();
      }
    })
  }
}

$('#urlform').submit(function (e) {
  e.preventDefault();
  let target = e.target;
  let inputElement = target.getElementsByClassName('input_url')[0].value;
  let thumbnailElement = document.getElementsByClassName('box_uploading')[0];
  let thumbnail = thumbnailElement.parentElement.parentElement;
  let formelement = document.getElementsByClassName('main-form')[0];
  $(formelement).hide();
  $(thumbnail).show();
  if(window.innerWidth <= 600)
  { 
    let stylechange = document.getElementById('dropzone');
    stylechange.style.padding = '0';
    stylechange.style.height = '90vw';
  }
  if (checkURL(inputElement)) {
    thumbnailElement.style.backgroundImage = `url('${inputElement}')`;
    thumbnailElement.dataset.label = inputElement;
  }
  else {
    thumbnailElement.style.backgroundImage = null;
    Swal.fire({
      title: 'Invalid Image',
      text: "Images only with extension jpeg | jpg | png | gif!",
      icon: 'warning',
      allowOutsideClick: false,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Try again'
    }).then((result) => {
      if (result.value) {
        location.reload();
      }
    })
  }
})

function checkURL(url) {
  return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

$('#cancelbtn').click(function (e) {
  location.reload();
});

$('#captionbtn').click(function (e) {
  
  let thumbnailElement = document.getElementsByClassName('box_uploading')[0];
  let url = thumbnailElement.style.backgroundImage;
  url = url.replace('url(', '').replace(')', '').replace(`"`,``).replace(`"`,``);
  
  function isBase64(strtest) {
    if (strtest ==='' || strtest.trim() ===''){ return false; }
    try {
        let str = strtest.split(",")[1];
        return btoa(atob(str)) == str;
    } catch (err) {
        return false;
    }
  }
  if(isBase64(url)){
    //$('#imgfileform').submit();
    let thumbnailElement = document.getElementsByClassName('box_uploading')[0];
    let filename = thumbnailElement.dataset.label
    console.log('base64 : ',filename);
    Swal.fire({
      title:'Processing',
      //timer:3000,
      showConfirmButton: false,
      timerProgressBar: true,
      showLoaderOnConfirm: true,
      onOpen:()=>{
        Swal.showLoading();
        $('#imgfileform').ajaxSubmit({
          data: {url: filename},
          contentType: 'application/json',
          success: function(data){
              var captions = document.getElementById('disp-captions');
              $('#buttons').hide();
              $('#disp-captions').show();
              var para = document.createElement("p");
              para.id = "capt";
              var quote = document.createElement("q");
              quote.style.fontStyle="italic";
              var node = document.createTextNode(data);
              quote.appendChild(node);
              para.appendChild(quote);
              captions.appendChild(para);
              Swal.hideLoading();
              Swal.close();
          }
        });
        //console.log(url, ' input ')
        // $.ajax({
        //   type: 'POST',
        //   url: '/uploadpic',
        //   data: {
        //     url : filename,
        //     type : 'img'
        //   }
        // })
        // .done(function(data){
        //   var captions = document.getElementById('disp-captions');
        //   $('#buttons').hide();
        //   $('#disp-captions').show();
        //   //data.forEach(caption => {
        //   var para = document.createElement("p");
        //   var node = document.createTextNode(data);
        //   para.appendChild(node);
        //   captions.appendChild(para);
        //   //})
        //   Swal.hideLoading();
        //   Swal.close();
        // })
        // .then(function(){

        // })
      }
    })
  }
  else{
    console.log('url : ',url)
  
  //var img = document.getElementById('hidden-image');
  //img.src = url + '?' + new Date().getTime();
  //img.setAttribute('crossOrigin', '');
  // img.crossOrigin = "Anonymous";
  // img.onload = function () {
  //   let frame = cv.imread(img)
  //   console.log(frame, ' frame');
  //   $.ajax({
  //     type: 'POST',
  //     url: '/captions',
  //     data: url
  //   })
  //     .done(function (data) {
  //       console.log(data);
  //     })

      Swal.fire({
        title:'Processing',
        //timer:3000,
        showConfirmButton: false,
        timerProgressBar: true,
        showLoaderOnConfirm: true,
        onOpen:()=>{
          Swal.showLoading();
          //console.log(url, ' input ')
          $.ajax({
            type: 'POST',
            url: '/captions',
            data: {
              url : url,
              type : 'url'
            }
          })
          .done(function(data){
            var captions = document.getElementById('disp-captions');
            $('#buttons').hide();
            $('#disp-captions').show();
            //data.forEach(caption => {
            var para = document.createElement("p");
            para.id = "capt";
            var node = document.createTextNode(data);
            var quote = document.createElement("q");
            quote.style.fontStyle="italic";
            quote.appendChild(node);
            para.appendChild(quote);
            captions.appendChild(para);
            //})
            Swal.hideLoading();
            Swal.close();
          })
          // .then(function(){

          // })
        }
      })
  }
});


