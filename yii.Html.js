/**
 * Yii 1.1 CHtml javascript port for Backbone.
 *
 * @author Vladimir Yazykov <neizerth@gmail.com>
 */

Yii.Html = {
	ID_PREFIX:'yt',
	closeSingleTags : true,
	renderSpecialAttributesValue: true,
	liveEvents: true,
	count: 0,
	requiredCss: 'required',
	beforeRequiredLabel: '',
	afterRequiredLabel: ' <span class="required">*</span>',
},

Yii.Html.resolveNameID = function (model,attribute,htmlOptions){
	if  (!PHP.isset(htmlOptions['name'])) {
		var result = this.resolveName(model,attribute);
		
		htmlOptions['name'] = result.name;
		
		if (result.attribute != null) {
			attribute = result.attribute;
		}
		
	}
	if  (!PHP.isset(htmlOptions['id'])) {
		var result = this.getIdByName(htmlOptions['name']);

		htmlOptions['id'] = result;

		if (result.attribute != null) {
			attribute = result.attribute;
		}
	}
	else if (htmlOptions['id'] === false) {
		delete htmlOptions['id'];
	}

	return {
		htmlOptions : htmlOptions,
		attribute : attribute
	};
}

Yii.Html.getIdByName = function (name)
{
    return PHP.str_replace(['[]', '][', '[', ']', ' '], ['', '_', '_', '', '_'], name);
}

Yii.Html.resolveName = function(model,attribute) {
	var pos = PHP.strpos(attribute, '[');

	if (pos !== false) {
		if (pos !== 0) {
			return {
				name: model.className+'['+attribute.substr(0,pos)+']'+attribute.substr(pos),
				attribute : attribute
			};
		}
		pos = PHP.strrpos(attribute, '[');
		
		if(pos !== false && pos!==attribute.length-1) {
			var sub = attribute.substr(0,pos+1);
			attribute = attribute.substr(pos+1);
			return {
				name: model.className + sub+'['+ attribute+']',
				attribute : attribute
			}
		}
		if(/\](\w+\[.*)$/.test(attribute)) {
			var  name = model.className+'['+PHP.str_replace(']','][',PHP.trim(PHP.strtr(attribute,{'][' : ']','[': ']'} ),']'))+']';
			attribute = RegExp.$1;
			
			return {
				name : name,
				attribute : attribute
			};
		}
	}
	return {
		name : model.className+'['+attribute+']',
		attribute : attribute
	};

}
Yii.Html.resolveValue = function (model,attribute) {
	var pos = PHP.strpos(attribute, '[');

	if(pos !== false) {
		if(pos===0) { // [a]name[b][c], should ignore [a]

			if(/\](\w+(\[.+)?)/.test(attribute))
				attribute = RegExp.$1; // we get: name[b][c]
			pos = PHP.strpos(attribute, '[');
			if(pos ===false)
				return model.get(attribute);
		}

		var name = attribute.substr(0,pos),
			value = model.get(name),
			items = PHP.explode('][',PHP.rtrim(attribute.substr(pos+1),']'));

		for (var i in items) {
			var id = items[i];

			if((PHP.is_array(value) || value instanceof Array) && PHP.isset(value[id]))
				value = value[id];
			else
				return null;
		}

		return value;
	}
	else if (model instanceof Backbone.Collection) {
		var items = [];
		for (var i in model.models) {
			var item = model.models[i];

			items[i] = item.get(attribute);
		}
		return items;
	}
	else
		return model.get(attribute);
}

Yii.Html.tag = function (tag,htmlOptions,content,closeTag) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	content = PHP.isset(content) ? content : false;
	closeTag = PHP.isset(closeTag) ? closeTag : true;

	var html='<' + tag + this.renderAttributes(htmlOptions);
		if(content===false)
			return closeTag && this.closeSingleTags ? html+' />' : html+'>';
		else
			return closeTag ? html+'>'+content+'</'+tag+'>' : html+'>'+content;
}

Yii.Html.encode = function(text) {
	return text == null ? '' : PHP.htmlspecialchars(text+'');
}

Yii.Html.listOptions = function (selection,listData,htmlOptions) {

	var raw = PHP.isset(htmlOptions['encode']) && !htmlOptions['encode'],
		content = '';

	if(PHP.isset(htmlOptions['prompt'])) {

		content += '<option value="">'+PHP.strtr(htmlOptions['prompt'],{'<' : '&lt;', '>' : '&gt;'})+"</option>\n";
		delete htmlOptions['prompt'];
	}

	if(PHP.isset(htmlOptions['empty'])) {

		if(!PHP.is_array(htmlOptions['empty']))
			htmlOptions['empty'] = {'' : htmlOptions['empty']};
		

		for (var value in htmlOptions['empty']) {
			
			var label = htmlOptions['empty'][value];

			content +='<option value="'+this.encode(value)+'">'+PHP.strtr(label,{'<' : '&lt;', '>' : '&gt;'})+"</option>\n";
		}
		
		delete htmlOptions['empty'];
	}
	var options = {};

	if(PHP.isset(htmlOptions['options'])) {
		options = htmlOptions['options'];
		delete htmlOptions['options'];
	}

	var key = PHP.isset(htmlOptions['key']) ? htmlOptions['key'] : 'id';

	if(selection instanceof Backbone.Collection) {

		var models = selection.models;

		var data = [];
		for (var i in models) {
			var item = models[i];

			if(PHP.is_object(item)) {
				data[i] = item.get(key);
			}
				
		}
		selection = data;
	}
	else if(PHP.is_array(selection)) {
		for (var i in selection) {
			var item = selection[i];

			if(PHP.is_object(item))
				selection[i] = item.get(key);
		}
	}
	else if(PHP.is_object(selection)) {
		selection = selection.get(key);
	}

	for (var key in listData) {
			var value = listData[key];

		if(PHP.is_array(value)) {
			
			content += '<optgroup label="'+(raw? key : this.encode(key))+"\">\n";
			var dummy = {'options' : options};
			if(PHP.isset(htmlOptions['encode']))
				dummy['encode'] = htmlOptions['encode'];

			content += this.listOptions(selection,value,dummy);
			content += '</optgroup>'+"\n";
		}
		else {
			var attributes = {'value' : key, 'encode' : !raw};
			if( (!PHP.is_array(selection) && (key == selection)) || (PHP.is_array(selection) && PHP.in_array(key,selection)) )
				attributes['selected'] = 'selected';
			
			if(PHP.isset(options[key]))
				attributes = PHP.array_merge(attributes,options[key]);

			content += this.tag('option',attributes, raw? value : this.encode(value))+"\n";
		}
	}

	delete htmlOptions['key'];

	return { 
		content: content,
		htmlOptions : htmlOptions
	};
}

Yii.Html.renderAttributes = function (htmlOptions) {
	var specialAttributes= {
		'async':1,
		'autofocus':1,
		'autoplay':1,
		'checked':1,
		'controls':1,
		'declare':1,
		'default':1,
		'defer':1,
		'disabled':1,
		'formnovalidate':1,
		'hidden':1,
		'ismap':1,
		'loop':1,
		'multiple':1,
		'muted':1,
		'nohref':1,
		'noresize':1,
		'novalidate':1,
		'open':1,
		'readonly':1,
		'required':1,
		'reversed':1,
		'scoped':1,
		'seamless':1,
		'selected':1,
		'typemustmatch':1,
	};

	if($.isEmptyObject(htmlOptions))
		return '';

	var html='', raw;
	if(PHP.isset(htmlOptions['encode'])) {
		raw = !htmlOptions['encode'];
		delete htmlOptions['encode'];
	}
	else
		raw = false;

	for (var name in htmlOptions) {
		var value = htmlOptions[name];

		if(PHP.isset(specialAttributes[name])) {
			if(value) {
				html += ' ' + name;
				if(this.renderSpecialAttributesValue)
					html += '="' + name + '"';
			}
		}
		else if(value!=null)
			html += ' ' + name + '="' + (raw ? value : this.encode(value)) + '"';
	}

	return html;
}


Yii.Html.activeDropDownList = function (model,attribute,data,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

	var result = this.resolveNameID(model,attribute,htmlOptions);

	htmlOptions = result.htmlOptions;
	attribute = result.attribute;

	var selection = this.resolveValue(model,attribute),
		result = this.listOptions(selection,data,htmlOptions),
		options = "\n"+result.content;
		hidden = '';

	if(PHP.isset(htmlOptions['multiple'])) {
        if(htmlOptions['name'].substr(-2) !== '[]')
            htmlOptions['name'] +='[]';

        if(PHP.isset(htmlOptions['unselectValue'])) {
            var hiddenOptions = PHP.isset(htmlOptions['id']) ? {'id' : this.ID_PREFIX + htmlOptions['id']} : {'id' : false};
            hidden = this.hiddenField(htmlOptions['name'].substr(0,-2),htmlOptions['unselectValue'],hiddenOptions);
            delete htmlOptions['unselectValue'];
        }
    }
    return hidden + this.tag('select',htmlOptions,options);
}

Yii.Html.dropDownList = function(name,select,data,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

	htmlOptions['name']=name;

	if(!PHP.isset(htmlOptions['id']))
		htmlOptions['id']=this.getIdByName(name);
	else if(htmlOptions['id']===false)
		htmlOptions['id'] = null;

	this.clientChange('change',htmlOptions);

	var options = "\n"+this.listOptions(select,data,htmlOptions).content,
		hidden='';
		
	if(!PHP.isset(htmlOptions['multiple']))
	{
		if(htmlOptions['name'].substr(-2)!=='[]')
			htmlOptions['name']+='[]';

		if(PHP.isset(htmlOptions['unselectValue']))
		{
			var hiddenOptions=PHP.isset(htmlOptions['id']) ? {'id' : this.ID_PREFIX+htmlOptions['id']} : {'id' : false};
			
			hidden=this.hiddenField(htmlOptions['name'].substr(0,-2),htmlOptions['unselectValue'],hiddenOptions);
			htmlOptions['unselectValue'] = null;
		}
	}
	// add a hidden field so that if the option is not selected, it still submits a value
	return hidden + this.tag('select',htmlOptions,options);
}

Yii.Html.listData = function(collection,valueField,textField,groupField) {
	groupField = PHP.isset(groupField) ? groupField : '';

	var listData = [];

    if(groupField==='') {
        
        for(var i in collection.models) {

        	var model = collection.models[i],
        		value = this.value(model,valueField),
        		text = this.value(model,textField);
            
            listData[value] = text;
        }
    }
    else {
    	for(var i in collection.models) {
	        var model = collection.models[i],
	        	value = this.value(model,valueField),
	        	text = this.value(model,textField);

	        if(group === null)
	            listData[value] = text;
	        else
	            listData[group][value] = text;
	    }
    }
	    
    
   return listData;
}

Yii.Html.value = function (model,attribute,defaultValue) {

    if(PHP.is_scalar(attribute) || attribute===null) {
    	var data = PHP.explode('.',attribute);
        for(var i in data) {
        	var name = data[i];
            if(PHP.is_object(model) && PHP.isset(model.get(name)) )
                model = model.get(name);
            else if(PHP.is_array(model) && PHP.isset(model[name]))
                model = model[name];
            else
                return defaultValue;
    	}
    }
    else
        return model[attribute].apply(model);

    return model;
}

Yii.Html.activeTextField =  function(model,attribute,htmlOptions) {

	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
    this.resolveNameID(model,attribute,htmlOptions);

    return this.activeInputField('text',model,attribute,htmlOptions);
}

Yii.Html.textField = function(name,value,htmlOptions) {
	value = value || '';
	htmlOptions = htmlOptions || {};

    this.clientChange('change',htmlOptions);
    return this.inputField('text',name,value,htmlOptions);
}

Yii.Html.activeTextArea =  function (model,attribute,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

    this.resolveNameID(model,attribute,htmlOptions);
    
    var text = null;

    if(PHP.isset(htmlOptions['value']))
    {
        text = htmlOptions['value'];
        delete htmlOptions['value'];
    }
    else
        text = this.resolveValue(model,attribute);
    return this.tag('textarea',htmlOptions, PHP.isset(htmlOptions['encode']) && !htmlOptions['encode'] ? text : this.encode(text));
}


Yii.Html.textArea = function (name,value,htmlOptions) {
	value = value || '';
	htmlOptions = htmlOptions || {};

    htmlOptions['name']=name;
    if(PHP.isset(htmlOptions['id']))
        htmlOptions['id'] = this.getIdByName(name);
    else if(htmlOptions['id']===false)
        delete htmlOptions['id'];
    this.clientChange('change',htmlOptions);

    return this.tag('textarea',htmlOptions,PHP.isset(htmlOptions['encode']) && !htmlOptions['encode'] ? value : this.encode(value));
}


Yii.Html.activeInputField = function(type,model,attribute,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

	htmlOptions['type'] = type;

    if(type==='file')
        delete htmlOptions['value'];
    else if(!PHP.isset(htmlOptions['value']))
        htmlOptions['value'] = this.resolveValue(model,attribute);

    return this.tag('input',htmlOptions);
}

Yii.Html.link = function (text,url,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	url = PHP.isset(url) ? url : 'javascript:void(0)';

	if(url!=='')
		htmlOptions['href'] = this.normalizeUrl(url);

	return this.tag('a',htmlOptions,text);
}

Yii.Html.normalizeUrl = function (url) {
	if(!PHP.is_scalar(url)) {
		if(PHP.isset(url[0])) {
			
			var c = Yii.app.getController();

			if(c!==null) {
				if (PHP.is_object(url)) {
					var action = url[0];
					url[0] = null;

					url = c.createUrl(action,url);
				}
				else {
					url = c.createUrl(url[0],PHP.array_splice(url,1));
				}
			}
				
		}
		else
			url = '';
	}
	return url ==='' ? Yii.app.getRequest().getUrl() : url;
}

Yii.Html.openTag = function (tag,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

    return '<' + tag + this.renderAttributes(htmlOptions) + '>';
}

Yii.Html.closeTag = function (tag) {
    return '</' + tag + '>';
}


Yii.Html.submitButton = function(label,htmlOptions) {

	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	label = PHP.isset(label) ? label : 'submit';

    htmlOptions['type'] = 'submit';
    return this.button(label,htmlOptions);
}

Yii.Html.ajaxSubmitButton =  function (label,url,ajaxOptions,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	ajaxOptions = PHP.isset(ajaxOptions) ? ajaxOptions : {};

    ajaxOptions['type']='POST';
    htmlOptions['type']='submit';
    return this.ajaxButton(label,url,ajaxOptions,htmlOptions);
}

Yii.Html.ajaxButton = function (label,url,ajaxOptions,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	ajaxOptions = PHP.isset(ajaxOptions) ? ajaxOptions : {};

    ajaxOptions['url'] = url;
    htmlOptions['ajax'] = ajaxOptions;
    return this.button(label,htmlOptions);
}

Yii.Html.button = function (label,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	label = PHP.isset(label) ? label : 'button';

    if(!PHP.isset(htmlOptions['name'])) {

        if(!PHP.array_key_exists('name',htmlOptions))
            htmlOptions['name'] = this.ID_PREFIX+this.count++;
    }
    if(!PHP.isset(htmlOptions['type']))
        htmlOptions['type']='button';
    if(!PHP.isset(htmlOptions['value']) && htmlOptions['type'] != 'image')
        htmlOptions['value'] = label;

    this.clientChange('click',htmlOptions);

    return this.tag('input',htmlOptions);
}

Yii.Html.clientChange = function(onEvent,htmlOptions) {
    if(!PHP.isset(htmlOptions['submit']) && !PHP.isset(htmlOptions['confirm']) && !PHP.isset(htmlOptions['ajax']))
        return;
    
    var live;

    if(PHP.isset(htmlOptions['live'])) {
        live = htmlOptions['live'];
        delete htmlOptions['live'];
    }
    else
        live = this.liveEvents;

    var returnValue;

    if(PHP.isset(htmlOptions['return']) && htmlOptions['return'])
        returnValue = true;
    else
        returnValue = false;

    var handlers = [];
    if(PHP.isset(htmlOptions['on'+onEvent])) {

        handlers[handlers.length] = function(){ eval(htmlOptions['on'+onEvent]) };
        delete htmlOptions['on'+onEvent];
    }

    var id;
    if(PHP.isset(htmlOptions['id']))
        id = htmlOptions['id'];
    else
        id = htmlOptions['id']= PHP.isset(htmlOptions['name'])? htmlOptions['name']: this.ID_PREFIX+this.count++;

    var cs = Yii.app.getClientScript();

    if(PHP.isset(htmlOptions['submit'])) {
    	var params;

        if(PHP.isset(htmlOptions['params']))
            params = htmlOptions['params'];
        else
            params = {};

        var url;
        if(htmlOptions['submit']!=='')
            url = this.normalizeUrl(htmlOptions['submit']);
        else
            url='';
        handlers[handlers.length] = function() { jQuery.yii.submitForm(this, url ,params); return returnValue; };
    }

    var ajax = htmlOptions['ajax'];
    
    if(PHP.isset(ajax))
    	handlers[handlers.length] = function() { this.ajax(ajax); return returnValue;};

    if(PHP.isset(htmlOptions['confirm'])) {

        if($handler!=='') {
        	var onConfirm = handlers;
        	handlers = [function(){
        		if ( confirm(htmlOptions['confirm']) ) {
        			for (var i, len = onConfirm.length;i<len;i++) {
        				onConfirm[i].apply(this);
        			}
        		}
        		else {
        			return false;
        		}
        	}];
        }
        else {
        	handlers = [function(){
        		return confirm(htmlOptions['confirm']);
        	}];
        }
    }

    if(live) {
    	jQuery('body').on(onEvent,'#'+id,function(){
    		for (var i, len = handlers.length;i<len;i++) {
				handlers[i].apply(this);
			}
    	});
    }
    else {
    	jQuery('#'+id).on(onEvent, function(){
    		for (var i, len = handlers.length;i<len;i++) {
				handlers[i].apply(this);
			}
    	});
    }

    delete htmlOptions['params'];
    delete htmlOptions['submit'];
    delete htmlOptions['ajax'];
    delete htmlOptions['confirm'];
    delete htmlOptions['return'];
    delete htmlOptions['csrf'];
}

Yii.Html.activeHiddenField = function (model,attribute,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};

    this.resolveNameID(model,attribute,htmlOptions);
    return this.activeInputField('hidden',model,attribute,htmlOptions);
}

Yii.Html.hiddenField = function (name,value ,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	value = PHP.isset(value) ? value : '';

    return this.inputField('hidden',name,value,htmlOptions);
}

Yii.Html.fileField = function(name,value,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	value = PHP.isset(value) ? value : '';

    return this.inputField('file',name,value,htmlOptions);
}

Yii.Html.inputField = function (type,name,value,htmlOptions) {
    htmlOptions['type']= type;
    htmlOptions['value']= value;
    htmlOptions['name']= name;
    
    if(!PHP.isset(htmlOptions['id']))
        htmlOptions['id']=this.getIdByName(name);
    else if(htmlOptions['id']===false)
        htmlOptions['id'] = null;

    return this.tag('input',htmlOptions);
}

Yii.Html.image = function(src,alt,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
	alt = PHP.isset(alt) ? alt : '';

    htmlOptions['src'] = src;
    htmlOptions['alt'] = alt;

    return this.tag('img',htmlOptions);
}

Yii.Html.activePasswordField = function(model,attribute,htmlOptions) {
	htmlOptions = PHP.isset(htmlOptions) ? htmlOptions : {};
    
    this.resolveNameID(model,attribute,htmlOptions);
    this.clientChange('change',htmlOptions);
    
    return this.activeInputField('password',model,attribute,htmlOptions);
}


Yii.Html.label = function (label,forName,htmlOptions) {
	htmlOptions = htmlOptions || {};

    if(forName===false)
        delete htmlOptions['for'];
    else
        htmlOptions['for'] = forName;

    if(PHP.isset(htmlOptions['required']))
    {
        if(htmlOptions['required'])
        {
            if(PHP.isset(htmlOptions['class']))
                htmlOptions['class']+=' '+this.requiredCss;
            else
                htmlOptions['class']=this.requiredCss;
            label = this.beforeRequiredLabel+label+this.afterRequiredLabel;
        }
        delete htmlOptions['required']; 
    }
    return this.tag('label',htmlOptions,label);
}

Yii.Html.checkBox = function (name,checked,htmlOptions) {
	
	checked = checked || false;
	htmlOptions = htmlOptions || {};

	if(checked)
		htmlOptions['checked']='checked';
	else
		delete htmlOptions['checked'];

	var value = PHP.isset(htmlOptions['value']) ? htmlOptions['value'] : 1;

	this.clientChange('click',htmlOptions);

	var uncheck = null;

	if(PHP.array_key_exists('uncheckValue',htmlOptions)) {
		uncheck = htmlOptions['uncheckValue'];
		delete htmlOptions['uncheckValue'];
	}
	else
		uncheck = null;

	var hidden = '';
	if(uncheck!==null) {
		var uncheckOptions = {};
		// add a hidden field so that if the check box is not checked, it still submits a value
		if(PHP.isset(htmlOptions['id']) && htmlOptions['id']!==false)
			uncheckOptions = {'id' : this.ID_PREFIX + htmlOptions['id']};
		else
			uncheckOptions= {'id' : false};
		hidden = this.hiddenField(name,uncheck,uncheckOptions);
	}
	else
		hidden='';

	// add a hidden field so that if the check box is not checked, it still submits a value
	return hidden + this.inputField('checkbox',name,value,htmlOptions);
}

Yii.Html.radioButton = function (name,checked,htmlOptions) {
	checked = checked || false;
	htmlOptions = htmlOptions || {};

	if(checked)
		htmlOptions['checked']='checked';
	else
		delete htmlOptions['checked'];

	var value = PHP.isset(htmlOptions['value']) ? htmlOptions['value'] : 1,
		uncheck = null;

	this.clientChange('click',htmlOptions);

	if(PHP.array_key_exists('uncheckValue',htmlOptions)) {
		uncheck = htmlOptions['uncheckValue'];
		delete htmlOptions['uncheckValue'];
	}
	else
		uncheck=null;

	if(uncheck!==null) {
		var uncheckOptions = {};
		// add a hidden field so that if the radio button is not selected, it still submits a value
		if(PHP.isset(htmlOptions['id']) && htmlOptions['id']!==false)
			uncheckOptions= {'id' : this.ID_PREFIX+htmlOptions['id']};
		else
			uncheckOptions= { 'id' : false };
		hidden=this.hiddenField(name,uncheck,uncheckOptions);
	}
	else
		hidden='';

	// add a hidden field so that if the radio button is not selected, it still submits a value
	return hidden + this.inputField('radio',name,value,htmlOptions);
}

Yii.Html.activeLabel = function(model,attribute,htmlOptions) {

	htmlOptions = htmlOptions || {};

    var inputName = this.resolveName(model,attribute),
    	forName = '', label = '';

    if(PHP.isset(htmlOptions['for'])) {
        forName = htmlOptions['for'];
        delete htmlOptions['for'];
    }
    else
        forName = this.getIdByName(inputName);
    
    if(PHP.isset(htmlOptions['label']))
    {
        if((label = htmlOptions['label'])===false)
            return '';
        delete htmlOptions['label'];
    }
    else
        label = model.getAttributeLabel(attribute);
    /*if( model->hasErrors($attribute))
        self::addErrorCss($htmlOptions);*/
    return this.label(label,forName,htmlOptions);
}