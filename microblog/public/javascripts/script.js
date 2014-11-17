var SP = {};
SP.module = {
    version: '0.1',
    namespace: function(ns_string){
        var parts = ns_string.split('.'),
            parent = SP,
            i;
        if (parts[0] === 'SP'){
            parts = parts.slice(1);
        }
        for (i = 0; i < parts.length; i += 1){
            if (typeof parent[parts[i]] === 'undefined') {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
    },
    inherit: function(Child, Parent){
        Child.prototype = new Parent();
    },
    moduleA: function(dModule){
        var dDIV = $(dModule).find('div').each(function(index,item){
        //var dDIV = $('.moduleA div').each(function(index,item){
            //$(item).html(index+1);
            switch(index+1){
                case 1:
                    $(item).html('a');
                    break;
                case 2:
                    $(item).html('b');
                    break;
                case 3:
                    $(item).html('c');
                    break;
                default:
                    break;
            }
        });
    }
};
(function(){
    var doWhileExist = function(ModuleID,objFunction){
        var dTarget = document.getElementById(ModuleID);
        if(dTarget){
            objFunction(dTarget);
        }                
    };
    doWhileExist('moduleA',SP.module.moduleA);
})();