/**
 * Yii 1.1 javascript port for Backbone.
 *
 * @author Vladimir Yazykov <neizerth@gmail.com>
 */


window.Yii = {
	app: {

	},
	Ext: {}
};
Yii.t = function(titles,number)  
{  
    cases = [2, 0, 1, 1, 1, 2];  
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
}  
Yii.log = function(level,type,message)  
{  
	// console.log(level,type,message);
}  

Yii.app.getClientScript = function() {
	return {
		registerCssFile : function(url,htmlOptions) {
			htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

			htmlOptions.href = url;

			$('head').append( $('<link rel="stylesheet" type="text/css" />').attr(htmlOptions) );
		},
		registerScriptFile : function(url,options) {
			options = PHP.isset(options) ? options : {cache:false};

			$.ajax({
		         type: "GET",
		         url: url,
		         success: options.success,
		         dataType: "script",
		         cache: options.cache
		     });   
		}
	}
}

Yii.app.getRequest = function() {
	return {
		getUrl : function() {
			return window.location;
		}
	}
}

Yii.app.getController = function() {
	var widgetStack = [];

	return window.Backbone == null ? null : {
		createUrl : function (route, params, ampersand) {
			params = PHP.isset(params) ? params : {};
			ampersand = PHP.isset(ampersand) ? ampersand : '&';

			if(route==='') {
				var index = Backbone.history.fragment.indexOf('/')+1;
				
				if (index = Backbone.history.fragment.indexOf('/',index) > 0) {

					route = Backbone.history.fragment.substr(0,index);
				}
				else {
					route = Backbone.history.fragment;
				}
				
			}
		    else if(PHP.strpos(route,'/') === false)
		        route = this.getId()+'/'+route;
		    
		    var paramsData = '';
		    if ($.isArray(params)&&params.length == 1) {
		    	paramsData += '/id/'+params[0];
		    }
		    else {
		    	$.each(params, function(k, v) {
			    	if (k != 0) {
			    		paramsData += '/'+k+'/'+v;
			    	}
				});
		    }

		    var url = '#'+route+paramsData;
		    return url;
		},
		getId: function() {
			var pos = Backbone.history.fragment.indexOf('/');
			return pos == -1? 'default' : Backbone.history.fragment.substr(0,pos);
		}
	};
}
