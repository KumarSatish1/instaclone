var express = require('express');
var router = express.Router();
const userModel=require('./users');
const passport = require('passport');
const localStratgy=require('passport-local')
const upload=require('./multer');
const multer = require('multer');
const postSchema=require('./post')

passport.use(new localStratgy(userModel.authenticate()));

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed',isLogged,async function(req, res) {
  const posts= await postSchema.find().populate("user")
  res.render('feed', {footer: true,posts});
});

router.get('/profile',isLogged, async function(req, res) {
  const user=await userModel.findOne({username:req.session.passport.user}).populate('posts')
  res.render('profile', {footer: true,user:user});
});

router.get('/search',isLogged, function(req, res) {
  res.render('search', {footer: true});
});

// username/
router.get('/username/:username',isLogged,async function(req,res){
  const searchTerm=new RegExp('^{req.params.username}','i')
  const user=await userModel.find({username:searchTerm})
  res.json({user})
})
router.get('/edit',isLogged, async function(req, res) {
  const user=await userModel.findOne({username:req.session.passport.user})
  res.render('edit', {footer: true,user:user});
});

router.get('/upload',isLogged, function(req, res) {
  res.render('upload', {footer: true});
});
router.post('/register',function(req,res,next){
  const userData=new userModel({
    username:req.body.username,
    name:req.body.name,
    email:req.body.email,
    
     
  })
  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate('local')(req,res,function(){
      res.redirect('/profile')
    })
  })
})
router.post('/login',passport.authenticate("local",{
  successRedirect:'/profile',
  failureRedirect:'/login'
}),function(req,res){


})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.post('/update',upload.single('image'),async function(req,res){
  const user=await userModel.findOneAndUpdate(
    {username:req.session.passport.user},
    {username:req.body.username,name:req.body.name,bio:req.body.bio},
    {new:true})

if(req.file){

  user.profileImage=req.file.filename;
}
await user.save()
res.redirect('/profile')
})
router.post('/upload',isLogged,upload.single('image'), async function(req,res){
  const user=await userModel.findOne({username:req.session.passport.user})
 const post=await postSchema.create({
    picture:req.file.filename,
    user:user._id,
    caption:req.body.caption,
  })
  user.posts.push(post._id)
  await user.save()
  res.redirect('/feed')
})
function isLogged(req, res, next) {
  if (req.isAuthenticated()) {
      return next(null, true);
  }
  res.redirect('/');
  }
  


module.exports = router;
