const { ipcRenderer } = require('electron');
const path = require('path')
const {readFileSync, promises: fsPromises} = require('fs');
const fs = require('fs');
import AesCtr from './aes/aes-ctr.js';
const mammoth = require("mammoth-colors");
const axios = require('axios')
const htmlDocx = require('html-docx-js')


//nút chọn ảnh
var btnSelectImage = document.getElementById('button-select-image');

//ảnh để hiển thị ảnh đc chọn
var sendFingerprintImage = document.getElementById('send-fingerprint')

//link ảnh được lựa chọn, mặc định là rỗng
var imageSendPath = ""

//link ảnh nhận được, mặc định là rỗng
var imageRetrievePath = ""

//thời gian bắt đầu phiên giao dịch
var startTime = 0

//bản rõ
var plainText = ""

//bản mã
var cipherText = ""

//khóa mã hóa
var encryptKey = ""

//khóa giải mã
var decryptKey = ""

//ảnh để hiển thị ảnh nhận được
var retrieveFingerprintImage = document.getElementById('retrieve-fingerprint')

//nút để gửi ảnh
var btnSendImage = document.getElementById('button-send-image')

//nút để tìm kiếm thông tin
var btnFindInformation = document.getElementById('button-find-information')

var h1Message = document.getElementById('h1-message')
var radioTxt = document.getElementById('radio-txt')
var radioDocx = document.getElementById('radio-docx')

//thẻ div chứa thông tin đọc được phía server
var readInformation = document.getElementById('read-information')

//thẻ div chứa thông tin mã hóa phía server
var encryptInformation = document.getElementById('encrypted-information')

//thẻ div chứa thông tin mã hóa nhận được phía client
var retrieveInformation = document.getElementById('retrieve-information')

//thẻ div chứa thông tin giải mã ở phía client
var decryptInformation = document.getElementById('decrypted-information')

//nút để tạo khóa mã hóa
var btnGenKeyServer = document.getElementById('button-server-gen-key')

//nút để mã hóa thông tin
var btnEncrypt = document.getElementById('button-server-encrypt')

//nút để gửi thông tin
var btnSendInformation = document.getElementById('button-send-information')

//thẻ h1 hiển thị khóa mã hóa
var h1EncryptKey = document.getElementById('h1-encrypt-key')

//thẻ h1 hiển thị khóa giãi mã
var h1DecryptKey = document.getElementById('h1-decrypt-key')

//thẻ div chứa khóa mã hóa
var divEncryptKey = document.getElementById('encrypt-key')

//thẻ div chứa khóa giải mã
var divDecryptKey = document.getElementById('decrypt-key')

//nút để mã hóa thông tin
var btnDecryptInformation = document.getElementById('button-client-decrypt')

//nút để tạo khóa giải mã client
var btnGenKeyClient = document.getElementById('button-client-gen-key')

//nút làm mới thông tin
var btnRefresh = document.getElementById('button-clear-information')

//nút lưu trữ thông tin vào file
var btnSaveInformation = document.getElementById('button-save-information')

var isTxtFile = true
var isInput = false
var isDocxFile = false

function myFunction(event) {
  if(event.target.id === 'radio-txt'){
    isTxtFile = true
    isInput = false
    isDocxFile = false
  } else {
    if(event.target.id === 'radio-docx'){
      isTxtFile = false
      isInput = false
      isDocxFile = true
    } else {
      isTxtFile = false
      isInput = true
      isDocxFile = false

      var htmlString = `
      <textarea rows="9" id="input-information" cols="50" name="text" style="width: inherit; weight: inherit; padding: 10px;"></textarea>
      <br/>`
      readInformation.innerHTML = htmlString
      
      var inputEncryptKey = document.createElement('input')
      inputEncryptKey.id = 'input-encrypt-key'
      inputEncryptKey.type = 'text'
      inputEncryptKey.style.width = 'inherit'
      inputEncryptKey.style.height = '100%'
      inputEncryptKey.style.textAlign = 'center'
      divEncryptKey.removeChild(h1EncryptKey)
      divEncryptKey.appendChild(inputEncryptKey)

      var inputDecryptKey = document.createElement('input')
      inputDecryptKey.id = 'input-decrypt-key'
      inputDecryptKey.type = 'text'
      inputDecryptKey.style.width = 'inherit'
      inputDecryptKey.style.height = '100%'
      inputDecryptKey.style.textAlign = 'center'
      divDecryptKey.removeChild(h1DecryptKey)
      divDecryptKey.appendChild(inputDecryptKey)
    }
  }
}
document.querySelectorAll("input[name='fileType']").forEach((input) => {
  input.addEventListener('change', myFunction);
});


// hiển thị dialog chọn ảnh khi nhấn vào nút
btnSelectImage.addEventListener('click', () => {
  ipcRenderer.send('file-request');
});
ipcRenderer.on('file', (event, file) => {
  file = file.toString()
  const filePath = path.join('./src/img/', file.substring(43, file.length))
  imageSendPath = filePath
  sendFingerprintImage.src = filePath
});

btnSendImage.addEventListener('click', () => {
  imageRetrievePath = imageSendPath
  retrieveFingerprintImage.src = imageRetrievePath
  startTime = new Date().getTime()
})

// chuyển ảnh sang base64
function convert(src) {
  return new Promise(function (resolve) {
    var image = new Image();
    var dataURL = ""
    image.crossOrigin = 'Anonymous';
    image.src = src;
    image.onload = function(){
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.height = this.naturalHeight;
      canvas.width = this.naturalWidth;
      context.drawImage(this, 0, 0);
      dataURL = canvas.toDataURL('image/jpeg');
      resolve(dataURL)
    };
  })
}

//đọc file txt
function syncReadFile(filename) {
  const contents = readFileSync(filename, 'utf-8');

  return contents
}

function extractContent(html) {
  return new DOMParser()
      .parseFromString(html, "text/html")
      .documentElement.textContent;
}

//tìm thông tin 
btnFindInformation.addEventListener('click', async () => {
  var retrieveImageBase64 = await convert(imageRetrievePath)
  var files = fs.readdirSync('./src/img-info/');
  var position = -1
  for (let i = 0; i < files.length; i++) {
    let currentPath = path.join('./src/img-info/', files[i])
    var currentBase64 = await convert(currentPath)
    if(currentBase64 == retrieveImageBase64){
      position = files[i].substring(0, files[i].length == 5 ? 1 : 2);
      break
    }
  }

  if(position !== -1){
    if(isTxtFile){
      //xử lý file txt
      var infoPath = path.join(
        './src/txt-info/',
        position.concat('.txt')
      )
      let content = syncReadFile(infoPath)
      let pContent = document.createElement('p')
      pContent.innerText = content
      pContent.style.textAlign = 'left'
      readInformation.appendChild(pContent)
      plainText = content
    } else {
      //xử lý file docx
      if(isDocxFile){
        var infoPath = path.join(
          './src/docx-info/',
          position.concat('.docx')
        )
        var response = await mammoth.convertToHtml({path: infoPath})
        let html = response.value
        readInformation.innerHTML = html
      }
      
    }
  } else {
    h1Message.textContent = "Thông tin không tồn tại"
  }
})

btnGenKeyServer.addEventListener('click', () => {
  let key = generateKey()
  h1EncryptKey.textContent = key
  encryptKey = key
})

btnGenKeyClient.addEventListener('click', () => {
  let key = generateKey()
  h1DecryptKey.textContent = key
  decryptKey = key
})

btnEncrypt.addEventListener('click', () => {
  if(isTxtFile){
    let cipherText1 = AesCtr.encrypt(plainText, encryptKey, 128)
    let pContent = document.createElement('p')
    pContent.innerText = cipherText1
    pContent.style.textAlign = 'left'
    pContent.style.marginLeft = "10px"
    pContent.style.marginRight = "10px"
    encryptInformation.appendChild(pContent)
    cipherText = cipherText1
  } else {
    if(isDocxFile){
      var cipherText2 = AesCtr.encrypt(readInformation.innerHTML, encryptKey, 128);
      let pContent = document.createElement('p')
      pContent.innerText = cipherText2
      pContent.style.textAlign = 'left'
      encryptInformation.appendChild(pContent)
      cipherText = cipherText2
    } else {
      if(isInput){
        var key = document.getElementById('input-encrypt-key').value
        var plainText2 = document.getElementById('input-information').value
        
        if(key.length != 16){
          h1Message.innerText = "Độ dài khóa mã hóa là 16 ký tự"
        } else {
          h1Message.innerText = "Welcome"
          var cipherText2 = AesCtr.encrypt(plainText2, key, 128);
          let pContent = document.createElement('p')
          pContent.innerText = cipherText2
          pContent.style.textAlign = 'left'
          encryptInformation.appendChild(pContent)
          cipherText = cipherText2
        }
      }
    }
  }
})

btnSendInformation.addEventListener('click', () => {
  let pContent = document.createElement('p')
  pContent.innerText = cipherText
  retrieveInformation.appendChild(pContent)
})

var plainTextFromCipherText = ''
btnDecryptInformation.addEventListener('click', () => {
  if(isTxtFile){
    if(new Date().getTime() - startTime < 60 * 1000){
      let plainText1 = AesCtr.decrypt(cipherText, decryptKey, 128)
      let pContent = document.createElement('p')
      pContent.innerText = plainText1
      pContent.style.textAlign = 'left'
      pContent.style.marginLeft = "10px"
      pContent.style.marginRight = "10px"
      decryptInformation.appendChild(pContent)
      plainTextFromCipherText = plainText1
    } else {
      h1Message.textContent = 'Phiên giao dịch hết hạn, vui lòng thử lại'
    }
    
  } else {
    if(isDocxFile){
      if(new Date().getTime() - startTime < 60 * 1000){
        let plainText1 = AesCtr.decrypt(cipherText, decryptKey, 128)
        decryptInformation.innerHTML = plainText1
        plainTextFromCipherText = plainText1
      } else {
        h1Message.textContent = 'Phiên giao dịch hết hạn, vui lòng thử lại'
      }
    } else {
      var key = document.getElementById('input-decrypt-key').value
      var plainText2 = document.getElementById('input-information').value
      
      if(key.length != 16){
        h1Message.innerText = "Độ dài khóa giải mã là 16 ký tự"
      } else {
        h1Message.innerText = "Welcome"
        var plainText2 = AesCtr.decrypt(cipherText, key, 128);
        let pContent = document.createElement('p')
        pContent.innerText = plainText2
        pContent.style.textAlign = 'left'
        pContent.style.marginLeft = "10px"
        pContent.style.marginRight = "10px"
        decryptInformation.appendChild(pContent)
        plainTextFromCipherText = plainText2
      }
    }
  }
})

function generateKey(){
  let date = new Date()
  let currentHour = date.getHours() + '00'
  let currentYear = date.getFullYear()
  let currentMonth = date.getMonth() < 10 ? "0" + date.getMonth() : date.getMonth()
  let currentDate = date.getDate() < 10 ? "0" + date.getDate() : date.getDate()
  var currentTime = (currentHour + currentYear + currentDate + currentMonth + currentYear).toString()
  var randomCharacter = 'RfD-VAUr/7YgCpmJ'
  var result = ""
  for (let i = 0; i < 16; i++) {
    let a = currentTime.charCodeAt(i)
    let b = randomCharacter.charCodeAt(i)
    let x = ((a + b) % 127)
    if (x < 32) {
      x += 32
    }
    if (x > 127) {
      x -= 32
    }
    if (x == 32) {
      x += 1
    }
    result += String.fromCharCode(x)
  }

  return result
}

btnRefresh.addEventListener('click', () => {
  sendFingerprintImage.src = './src/img/default-image.jpg'
  retrieveInformation.innerHTML = ''
  decryptInformation.innerHTML = ''
  h1EncryptKey.textContent = ''
  h1DecryptKey.textContent = ''
  retrieveFingerprintImage.src = './src/img/default-image.jpg'
  readInformation.innerHTML = ''
  encryptInformation.innerHTML = ''
  h1Message.textContent = 'Welcome'
  divEncryptKey.removeChild(document.getElementById('input-encrypt-key'))
  divEncryptKey.appendChild(h1EncryptKey)
  divDecryptKey.removeChild(document.getElementById('input-decrypt-key'))
  divDecryptKey.appendChild(h1DecryptKey)
})

btnSaveInformation.addEventListener('click', async () => {
  if(isTxtFile || isInput){
    var blob = new Blob([plainTextFromCipherText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "information.txt");
  } 
  else {
    if(isDocxFile){
      // exportHTML(plainTextFromCipherText)  
      var header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
      "xmlns:w='urn:schemas-microsoft-com:office:word' "+
      "xmlns='http://www.w3.org/TR/REC-html40'>"+
      "<head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
      var footer = "</body></html>";
      var sourceHTML = header + plainTextFromCipherText +footer;
      var converted = htmlDocx.asBlob(sourceHTML)
      saveAs(converted, 'information.docx');
    }
  }
})