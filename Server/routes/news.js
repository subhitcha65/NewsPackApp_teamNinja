var express = require('express');
var router = express.Router();
var News = require("../models/News");
var User = require("../models/User");
/* GET users listing. */
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.json("User Unauthenticated");
  }
}

/*add news to the database */
router.route("/add").post(isLoggedIn,function(req, res, next) {
  var Obj = req.body;/*body will contain news object from newsapi added on more field category*/
    Obj.username=req.user.username;/*adding userid for news schema*/
    if(!Obj.category){
      Obj.category = "Others";
    }
    if(!Obj.comment){
      Obj.comment = "";
    }
    User.findOne({username:req.user.username,category:{$in:[Obj.category]}},function(err,data){
      if(err){
        res.send("Some Error Occured!");/*database error*/
      }
      else{
        if(data){
          /*category already exist*/
          News.findOne({url:Obj.url,username:req.user.username},function(err,data){
            if(err){
              res.send(err);
            }
            else if(data){
              res.send("News already exist");
            }
            else{
              Obj = new News(Obj);
              Obj.save(function(err){
                if(err){
                  res.send(err);
                }
                else{
                  res.send("News Added Successfully");
                }
              });
            }
          });
        }
        else{
          User.update({username:req.user.username},{$push:{category:Obj.category}},function(error,dataU){
            if(error){
              res.send(error);
            }
            else{
              /*category added successfully*/
              News.findOne({url:Obj.url,username:req.user.username},function(err,data){
                if(err){
                  res.send(err);
                }
                else if(data){
                  res.send("News already exist");
                }
                else{
                  Obj = new News(Obj);
                  Obj.save(function(err){
                    if(err){
                      res.send(err);
                    }
                    else{
                      res.send("News Added Successfully");
                    }
                  });
                }
              });
            }
          });
        }
      }
    });
});

/*fetch news from database according to category and key*/
/*object from body will be passed that contain category and key both eare optional*/
router.route("/get").post(isLoggedIn,function(req,res,next){
  var obj = {username:req.user.username};
  var key = req.body.key;
  if(req.body.category){
  obj.category = req.body.category;
  }
  News.find(obj,{_id:0},function(err,data){
  if(data){
    if(key){
        data = data.map(function(d){
          if(d.description){
            if(d.description.search(new RegExp(key,'i'))>-1)
            return d;
          }
          if(d.title){
            if(d.title.search(new RegExp(key,'i'))>-1)
            return d;
          }
          if(d.author){
            if(d.author.search(new RegExp(key,'i'))>-1)
            return d;
          }
          if(d.comment){
            if(d.comment.search(new RegExp(key,'i'))>-1)
            return d;
          }
        });
      }
    }
    res.json(data);
  });

});

/*update news comment and category */
router.route("/update").put(isLoggedIn,function(req,res,next){
  var obj = req.body;
  News.update({username:req.user.username,url:obj.url},{$set:{comment:obj.comment}},function(err,data){
    if(err){
      res.send(err);
    }
    else{
      if(data.nModified){
        res.send("News updated successfully");
      }
      else{
        res.send("Already up to date");
      }
    }
  });
});

/*delete news from  the database */
router.route("/delete").delete(isLoggedIn,function(req,res,next){
  var obj = req.body;
  News.remove({username:req.user.username,url:obj.url},function(err,data){
    if(err){
      res.send(err);
    }
    else{
      if(data.result.n){
        res.send("News deleted Successfully");
      }
      else{
        res.send("News is not available to delete");
      }
    }
  });
});
module.exports = router;
