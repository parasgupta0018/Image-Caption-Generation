const express = require("express");
const app = express();
const server = require("http").createServer(app);
const path = require('path');
const { json } = require('body-parser');
const spawn = require('child_process').spawn;
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

app.use(express.static('public'));
app.use(express.urlencoded({limit:'50mb',extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

let storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        crypto.randomBytes(20, (err, buf) => {
            const rand = buf.toString('hex');
            let filename = file.originalname.split(".")[0] +":" + rand + path.extname(file.originalname);
            cb(null, filename)
        });
    }
});

let upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (extname) {
        return cb(null, true);
    } else {
        return cb(null, false);
    }
}

app.post('/uploadpic', upload.single('image'), (req, res, next) => {
    const file = req.file;
    if (!file) {
        console.log('img_err', 'images with ext jpeg,jpg,png,gif only!!');
    }
    //console.log('ayaaa');
    //let url = file.path.replace('public', '');
    //console.log(req.file);
    //res.send(req.file.filename)
    let path = './public/uploads/'+req.file.filename;
    const python = spawn('python3',['./public/test.py',path]);

    python.stdout.on('data',(data)=>{
        let imgData = data.toString();
        console.log('Received:');
        fs.unlinkSync(req.file.path)
        res.send(imgData)
    })
    // users.updateOne({ _id: req.user._id }, { $set: { imgURL: url } }, function(err, result) {
    //     if (err) console.log(err);
    //     console.log("updated image");
    //     res.redirect('/account');
    // });
});

app.get('/', (req, res) => {
    res.render('caption');      
});

app.post('/captions',(req,res)=>{
    let url = (req.body);
    //console.log(url.url)
    //res.send('done')

    const python = spawn('python3',['./public/test.py',url.url]);

        python.stdout.on('data',(data)=>{
            let imgData = data.toString();
            //console.log('Received: ',imgData)
            //let stringData = JSON.parse((imgData));
            //console.log(typeof stringData.data);
            res.send(imgData)
        })
        // python.on('error', function(err) {
        //     console.log('error from oython : ',err);
        // });
});

server.listen(process.env.PORT || 5000, () => {
    console.log(`server started at port 5000`);
})
