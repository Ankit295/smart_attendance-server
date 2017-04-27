var express=require ('express');
var app=express();

var sessions=require('client-sessions');
var bodyParser=require('body-parser');
var mongoose=require('mongoose');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var path=require('path');

//homepage


var Schema=mongoose.Schema;
var ObjectId =Schema.ObjectId;

//connecting to mongo

mongoose.connect('mongodb://attend_otp:dance@ds163940.mlab.com:63940/smart_attendance');

var user_faculty = mongoose.model('user_faculty',new Schema({
	userName:String,
	employeeNo:{type:String, unique: true},
	email:String,
	password:String
}));

var user_student= mongoose.model('user_student',new Schema({
	userName:String,
	registrationNo:{type:String, unique: true},
	email:String,
	password:String
}));

var attend= mongoose.model('attend',new Schema({
	otp:Number,
	date:String,//make it unique
	std_reg_no: { type : Array , "default" : [] }
	//trk : { type : Array , "default" : [] }
}));
//var date = $('#datepicker').datepicker({ dateFormat: 'dd-mm-yy' }).val();

app.get('/', function (req, res) {
   res.sendFile(path.join(__dirname,'index.html'));
   console.log('request made at initial');    //initial
});

//middleware
app.use(bodyParser.urlencoded({extended: true}));

app.use(sessions({
	cookieName:'sessions',
	secret:'awedxctyhnvcdfghjmmhgfdxcbvcxdfvcd',
	duration:5*60*1000,
	activeDuration:5*60*1000
}));


//routing request

app.get('/faculty_signin',function(req,res){

	res.sendFile(path.join(__dirname,'Faculty_login.html'));	
});

app.get('/Student_signin',function(req,res){

	res.sendFile(path.join(__dirname,'Student_login1.html'));	
});


//signup
app.post('/stud_signup',urlencodedParser,function(req,res){
	//console.log(req.body);
	console.log('request made at stud_signin');
	var User_student = new user_student({
		userName : req.body.username,
		registrationNo : req.body.registrationNo ,
		email : req.body.email ,
		password : req.body.password
	});
	User_student.save(function(err,doc){
		if(err){
					
					if(err.code==11000){
						
						console.log("User Already registered");
						res.redirect('/Student_signin');
					}
		    		
		    	}
		else	{
					res.redirect('/Student_signin');
				}
	console.log(doc);
	console.log('request completed at stud_signup');	
				});
				
});


app.post('/faculty_signup',urlencodedParser,function (req,res){
	console.log(req.body);
	var User_faculty = new user_faculty({
		userName:req.body.username,
		employeeNo:req.body.employeeNo,
		email:req.body.email,
		password :req.body.password
	});
	User_faculty.save(function(err){
		if(err){
			console.log(err);
			var err="something fishy";
			if(err==11000){var err="User Already registered";}
		    	res.redirect('/faculty_signin');//send a html file
		    	}
		else{
			console.log(User_faculty);
			res.redirect('/faculty_signin');
	}
});
});
//faculty takes attendance
app.post('/take_attendance',function(req,res){
	
	var Attend = new attend({
		otp:req.body.otp,
		date:req.body.datepicker
	});
	Attend.save(function(err){
		if(err){ res.write('Errooor'); }
		else{
			res.redirect('/take_attendance');
		}
		
		});
});
//student gives attendance
app.post('/give_attendance',function(req,res){
	var n=parseInt(req.body.otp);
	
	var query ={
			otp:n,
			date:req.body.datepicker
				}; 
	console.log(query);
	attend.findOne(query,function(err,user){
		if(err){
				res.write('no data');
				console.log(query);
		}
		else{
			if(!user){
			res.write('no user');
		}
			else{var std_attendance=req.sessions.user.registrationNo ;//student giving attendance
			
			user.std_reg_no.push(std_attendance);
			
			console.log('hi'+user+'hi');
			
user.save(function(err){
		if(err){ res.write('Errooor'); }
		else{
			res.redirect('/give_attendance');
		}
		
		});
	}
}
});
});

//post signin
app.post('/stud_signin',function(req,res){
user_student.findOne({registrationNo:req.body.registrationNo},function(err,user){
	if(err){
		console.log(" you dont exist ");

		res.redirect('/Student_signin');

	}else{
		if(user){

		if(req.body.password==user.password){
			req.sessions.user=user;
			res.redirect('/give_attendance');
			console.log('u are correct');			
			
			}
		else
			{
				res.redirect('/Student_signin');
			}
		}
		else{
			res.send('test');
		}
		
	}
})
});


app.post('/faculty_signin',function(req,res){
user_faculty.findOne({employeeNo:req.body.employeeNo},function(err,user){
		if(err){
		console.log(" you don't exist ");

		res.redirect('/faculty_signin');

	}else{
		if(user){

		if(req.body.password==user.password){
			req.sessions.user=user;
			res.redirect('/take_attendance');
			console.log('bro u r correct');			
			
			}
		else
			{
				res.redirect('/faculty_signin');
			}
		}
		else{
			res.send('test');
		}
		
	}	
			})		
		
});
//teacher on OTP page 
app.get('/take_attendance',function(req,res){
	if (req.sessions && req.sessions.user)
	{

		user_faculty.findOne({employeeNo:req.sessions.user.employeeNo},function(err,user){
			
			if (!err){
				if(!user){
				console.log(user);	
				req.sessions.reset();
				res.redirect('/faculty_signin');}
			else
			{
				res.sendFile(path.join(__dirname,'take_attendance.html'));	
			}
		}
			else{res.write('tes');}
		});
	}
	else{res.redirect('/faculty_signin');}
});

//student giving attendance
app.get('/give_attendance',function(req,res){
	if (req.sessions && req.sessions.user)
	{

		user_student.findOne({registrationNo:req.sessions.user.registrationNo},function(err,user){
			
			
			if (!err){
				if(!user){
					
					req.sessions.reset();
					res.redirect('/Student_signin');}
				else
				{
					res.sendFile(path.join(__dirname,'give_attendance.html'));	
				}
		}
			else{res.write('err');}
		});
	}
	else{res.redirect('/Student_signin');}

});
//faulty to see student student list
app.get('/student_list',function (req,res){
			if (req.sessions && req.sessions.user)
	{

		user_faculty.findOne({employeeNo:req.sessions.user.employeeNo},function(err,user){
			
			if (!err){
				if(!user){
				console.log(user);	
				req.sessions.reset();
				res.redirect('/faculty_signin');}
			else
			{
					user_student.find({},function(err,docs){
			if(err){
				console.log('error')
				res.redirect('/take_attendance');
			}
			else{
			var strJson='{"array":[';	
			
			  var intCount = docs.length;
              if (intCount > 0) {
                for (var i = 0; i < intCount;) {
                  strJson +=  JSON.stringify(docs[i]);

                  i = i + 1;
                  if (i < intCount) {
                    strJson += ',';
                  }
                }
              }
             
            strJson+=']}';
            var jsom=JSON.parse(strJson);
            res.jsonp(jsom);
			}
		});
		}
		}
			else{res.write('tes');}
		});
	}
	else{res.redirect('/faculty_signin');}


});
//app.delete is left
//student can calculate attendance
app.get('/see_attendance',function (req,res){

attend.find({},function(err,docs){
			if(err){
				console.log('error')
				res.redirect('/take_attendance');
			}
			else{
			var strJson='{"registrationNo":"'+ req.sessions.user.registrationNo  +'","array":[';	
			  var intCount = docs.length;
              if (intCount > 0) {
                for (var i = 0; i < intCount;) {
                  strJson +=  JSON.stringify(docs[i]);

                  i = i + 1;
                  if (i < intCount) {
                    strJson += ',';
                  }
                }
              }
             
            strJson+=']}';
           
            var jsom=JSON.parse(strJson);
            res.jsonp(jsom);
			}
});
});
app.get('/logout',function(req,res){
			req.sessions.reset();
			res.redirect('/');
});
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
console.log("listening at 3000");