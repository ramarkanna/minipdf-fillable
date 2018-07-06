
var AWS = require('aws-sdk');

var minipdf = require('minipdf.js');
var minipdf_js = require('minipdf_js.js');
var pako = require('pako.min.js');
var pdfform = require('pdfform.js');
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

// From here on just code for this demo.
// This will not feature in your website
var on_error = function(e) {
	console.error(e, e.stack);  // eslint-disable-line no-console
}

var make_pdfform = function() {
	var lib_name = "pdf.js";
	return pdfform((lib_name === 'minipdf') ? minipdf : minipdf_js);
}

var generatePDF = function(buff , data)
{
		var filled_pdf; // Uint8Array
	try {
		filled_pdf =make_pdfform().transform(buff, data);
	} catch (e) {
		console.error('make_pdf:'+ e.msg);
		return on_error(e);
	}

	return filled_pdf;

}



exports.handler = function(event, context) {
	var BUCKET_NAME = "gpa-dev-mitosis";	
	var TEMPLATE_PATH="";
	var OUTPUT_PATH="applicant/";
	var LANGUAGE=event.language;
	var KEY_NAME ="";
	var DocCategory=event.DocCategory;
	var FCL_TYPE=event.FCLType;
	
	if(DocCategory=="tc")
	{
		TEMPLATE_PATH="template/termscondition/";
		KEY_NAME ="tc_"+LANGUAGE+".html";
	}
	else if(DocCategory=="paf")
	{
		TEMPLATE_PATH="template/pensionapplication/";
		KEY_NAME ="paf_"+LANGUAGE+".html";
	}
	else if(DocCategory=="fcl")
	{		
		TEMPLATE_PATH="template/forecastletter/";
		KEY_NAME ="prefcl_"+LANGUAGE+".html";
	}
	else if(DocCategory=="poa")
	{		
		TEMPLATE_PATH="template/poa/";
		KEY_NAME ="poa_new_"+LANGUAGE+".pdf";
	}

  var html_utf8 =event.html;
  var inputparam = event.params ; 
  //TC Params
  var firstName =  ""
  var middleName =  "";
  var lastName =  "";
  var signedBy =  "";
  var companyName = "";
  var empSignature = "";
  var empId = "";
  //var lang_locale="en";
  var signedbyname = ""; 
  //FCL Params
  var ninumber="";
  var Countrycitizenship="";
  var lastName="";
  var firstName="";
  var middleName="";
  var othersurnames="";
  var dateofbirth="";
  var maritalstatus="";
  var datemarriagedeath="";
  var Countryaddress="";
  var dateleftcountry="";
  //PAF Params
  var qrcode="";

if( typeof inputparam != 'undefined' && DocCategory=="poa" && inputparam.hasOwnProperty("empId"))
	{
	  firstName =  inputparam.firstName;
	  middleName =  inputparam.middleName;
	  lastName =  inputparam.lastName;
	  signedBy =  inputparam.signedBy;
	  companyName = inputparam.companyName;
	  empSignature = inputparam.empSignature;
	  empId = inputparam.empId;
	  //var lang_locale =  inputparam.lang;
	  signedbyname = inputparam.signedbyname;


	  //if( typeof LANGUAGE != 'undefined')
	  //KEY_NAME = "poa_" + LANGUAGE + ".pdf";


	  OUTPUT_PATH = OUTPUT_PATH + empId + "/";

		 // read data from s3 bucket 
		  var params = {Bucket: BUCKET_NAME, Key: TEMPLATE_PATH + KEY_NAME};
		  console.log('params:' + params);
			new AWS.S3().getObject(params, function(err, data)
			{
			  if (!err) {
				html_utf8 = data.Body;//.toString('utf-8');

				//console.log('file :', html_utf8);
				let fields = {'ApplicantName':[firstName + ' ' + middleName + ' ' + lastName]}	

				var result = generatePDF(html_utf8 , fields);

				var buff = Buffer.from( result );
				console.log('afterreplace :', buff);


		   var s3 = new AWS.S3();
			var params = {
			  Bucket : BUCKET_NAME,
			  Key : OUTPUT_PATH + KEY_NAME +".pdf",
			  Body : buff
			}

			s3.putObject(params, function(err, data) {
			  if (err) {
				console.log(err)
					context.done(null, { status:'error',  err: err , msg : 'file write error', filename: params.Key});
					context.done(null, { filename:params.Key,  content: buff});				

			  } else {
				//context.done(null, { status:'success',  filename: html_utf8 });
				context.done(null, { status:'success',  filename: params.Key });

			  }
			});
		  }
	    else
				{
					console.log('params:' + params);
					console.log('file read error:', err);
					context.done(null, { status:'error',  err: err , msg:'file read error'});
				}

		   });
	
	}		
	else
	{
					console.log('invalid Input param ');
					context.done(null, { status:'error',  msg: 'invalid input parameter' });

	}

};


