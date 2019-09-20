var TRY_HISTORY;

var LOCATION_EVERYWHERE = "//";
var LOCATION_DIRECT_CHILD = "/";
var TAGNAME_ALL = "*";

var OPTION_TAGNAME = "_tag";
var OPTION_INNERTEXT = "_innerText";
var OPTION_POSITION = "_position";
var OPTION_OTHER_ATTRIBUTES = "_other";

var _ts_xpath_result = '';

var ESCAPE_QUOTE = "', \"'\", '";

/**
 * TS xpath algo list dom
 */
var _ts_exp_elm = document.createElement('ul');
_ts_exp_elm.setAttribute('id', 'ts-xpath-algorithm-history');
document.getElementsByTagName('body')[0].appendChild(_ts_exp_elm)

function buildElementXpathPossibility(element, selectedOptions) {
    
    var prefix = LOCATION_EVERYWHERE;
    
    var tagName = buildXpathTagName(element, selectedOptions);
    var attributes = buildXpathAttributes(element, selectedOptions);
    return prefix + tagName + attributes;
}

function buildXpathAttributes(element, selectedOptions) {
    var firstAttributeUsed = false;

    var result = "";

    for (var i = 0; i < selectedOptions.length; i++) {
        var attr = null;
        if (selectedOptions[i].charAt(0) == "_") {
            attr = buildSpecialAttribute(element, selectedOptions[i], selectedOptions);
        }
        else {
            attr = buildCommonAttribute(element, selectedOptions[i]);
        }

        if (attr && result.indexOf(attr) === -1) {
            result += firstAttributeUsed ? " and " + attr : attr;
            firstAttributeUsed = true;
        }
    }
    return firstAttributeUsed ? "[" + result + "]" : "";
}

function buildSpecialAttribute(element, selectedOption) {

    var result = null;
    switch (selectedOption) {
        case OPTION_INNERTEXT:
            result = buildSpecialAttributeText(element, true);
            break;
        case OPTION_POSITION:
            result = buildSpecialAttributePosition(element);
            break;
    }
    return result;
}

function buildSpecialAttributeText(element, perfectMatch) {
    var result = null;
    var text = element.innerHTML.replace(/'/g, ESCAPE_QUOTE);
    if (text.length > 0 && text.length < 300) {
        if (text.indexOf(ESCAPE_QUOTE) === -1) {
            result = perfectMatch ? "text()='" + text + "'" : "contains(text(),'" + text + "')";
        } else {
            result = perfectMatch ? "text()=concat('" + text + "')" : "contains(text(),concat('" + text + "'))";
        }
    }
    return result;
}

function buildSpecialAttributePosition(element) {
    var children = element.parentElement ? element.parentElement.children : null;
    if (children && children.length > 0) {
        var counter = 0;
        for (var i = 0; i < children.length; i++) {
            if (children[i].tagName === element.tagName) {
                counter++;
            }
            if (children[i] === element) {
                return counter;
            }
        }
    }
}

function buildCommonAttribute(element, selectedOption) {

    var result = null;
    var text = element.getAttribute(selectedOption);
    if (text && text.length > 0) {
        text == text.replace(/'/g, ESCAPE_QUOTE);
        if (text.indexOf(ESCAPE_QUOTE) === -1) {
            result = "@" + selectedOption + "='" + text + "'";
        } else {
            result = "@" + selectedOption + "=concat('" + text + "')";
        }

    }
    return result;
}

function buildXpathTagName(element, selectedOptions) {
    return selectedOptions.indexOf(OPTION_TAGNAME) === -1 ? TAGNAME_ALL : element.tagName.toLowerCase();
}

function defineOtherOptions(element, arrayOfOptions) {
    var otherPosition = arrayOfOptions.indexOf(OPTION_OTHER_ATTRIBUTES);
    if (otherPosition > -1) {
    }
    return arrayOfOptions;
}

var MANDATORY_OPTIONS = null;

function initMandatoryOptions(arrayOfOptions) {
    
    if (MANDATORY_OPTIONS === null && arrayOfOptions) {
        MANDATORY_OPTIONS = [];
        for (var i = arrayOfOptions.length - 1; i >= 0; i--) {
            var cleanOption = arrayOfOptions[i].replace("!", "");
            if (cleanOption !== arrayOfOptions[i]) {
                MANDATORY_OPTIONS.push(cleanOption);
                arrayOfOptions.splice(i, 1);
            }
        }
    }
}

function displayHistory(){
    var elem = document.querySelector("#ts-xpath-algorithm-history");
    elem.innerHTML = "";
    TRY_HISTORY.forEach(function(h){
       var child = document.createElement("li");
       child.innerHTML = "" +
           "<span>#"+h.order+"</span>" +
           "<input type='text' class='os-text-input' id='os-history-xpath-input-"+h.order+"' value=\""+h.xpath+"\"/>" +
           "<span class='ts-match-history' id='ts-history-xpath-match-"+h.order+"' >"+h.match+"</span>";
       elem.appendChild(child);
       elem.querySelector("#ts-history-xpath-match-"+h.order).onclick = function(ev){
           _ts_xpath_result = document.querySelector("#"+this.id.replace("match","input")).value;
           return _ts_xpath_result;
       };
    });
}

function tryPossibilities(element, arrayOfOptions, parentTry, suffix, rootElement) {
    initMandatoryOptions(arrayOfOptions);
    
    parentTry = parentTry ? parentTry : [];
    rootElement = rootElement ? rootElement : element;
    
    suffix = suffix ? suffix : "";


    if (TRUE_PREFIX && !isXpathInHistory(xpath)) {
        var xpathResultElement = __x(TRUE_PREFIX);
        addXpathToHistory(TRUE_PREFIX,xpathResultElement.length);
        if (rootElement.isSameNode(xpathResultElement[0]) && xpathResultElement.length === 1) {
            return TRUE_PREFIX;
        }
    }

    var dig = false;

    arrayOfOptions = defineOtherOptions(element, arrayOfOptions);
    for (var i = 0; i <= arrayOfOptions.length; i++) {
        
        
        if (dig && i === parentTry.length) {

            var currentTry = parentTry.slice();
            currentTry.push(arrayOfOptions[i]);

            var result = tryPossibilities(element, arrayOfOptions, currentTry, suffix, rootElement);
            if (result) return result;

        } else if (!dig) {

            if ((arrayOfOptions.length === i && MANDATORY_OPTIONS.length > 0) || parentTry.indexOf(arrayOfOptions[i]) === -1) {

                var currentTry = parentTry.slice();

                if (i < arrayOfOptions.length) {
                    currentTry.push(arrayOfOptions[i]);
                }
                currentTry = currentTry.concat(MANDATORY_OPTIONS);
                var xpath = TRUE_PREFIX + buildElementXpathPossibility(element, currentTry) + suffix;

                if (!isXpathInHistory(xpath)) {
                    var xpathResultElement = __x(xpath);
                    addXpathToHistory(xpath,xpathResultElement.length);
                    if (rootElement.isSameNode(xpathResultElement[0]) && xpathResultElement.length === 1) {
                        return xpath;
                    }
                } else {

                }
            }
        }

        if (i == (arrayOfOptions.length - 1) && !dig) {

            dig = true;
            i = -1;
        }
    }


    if (parentTry.length === 0) {
        return tryPossibilitiesOnParent(element, arrayOfOptions, TRY_HISTORY, rootElement);
    }
}


function tryPossibilitiesOnParent(element, arrayOfOptions, TRY_HISTORY, rootElement) {
    var lastXpath = null;
    if (TRY_HISTORY && TRY_HISTORY.length > 0) {
        for (var i = TRY_HISTORY.length - 1; i >= 0; i--) {
            if (TRY_HISTORY[i].xpath.indexOf("text()=") === -1) {
                lastXpath = TRY_HISTORY[i].xpath;
                break;
            }
        }
    }
    return element.parentElement && lastXpath ? tryPossibilities(element.parentElement, arrayOfOptions, [], lastXpath.replace("/", ""), rootElement) : null;
}


function __x(xpath) {
    var xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var array = [];
    for (var i = 0; i < xpathResult.snapshotLength; i++)
        array.push(xpathResult.snapshotItem(i))
    return array;
}

function searchFromPrefix(prefix, prefixElem, target, history) {
    //first of i reset the TRUE_PREFIX, and if we still have it null at the end of this function, it means
    //we are on situation of error
    TRUE_PREFIX = null;
    //i initiate my search history if it is not already set
    history = history ? history : [];
    //i add this prefix element inside the history
    history.push(prefixElem);

    //#1 - if prefix and target are already the same, we stop here dont need to go deeper
    if (target.isSameNode(prefixElem)) return prefix;

    //#2 - If the target is inside my children, my prefix is already my TRUE_PREFIX
    if (sourceHasChild(prefixElem, target, history)) {
        TRUE_PREFIX = prefix;
    } else {

        //#3 - If the target is not inside my children, i will try with my parents until i found the correct prefix
        //While my prefix element has a parent element not already inside the history
        while (prefixElem.parentElement && history.indexOf(prefixElem.parentElement) === -1) {
            //I make it as the new prefix element and put it in the history
            prefixElem = prefixElem.parentElement;
            history.push(prefixElem);
            //I update my prefix
            prefix += "/..";

            //#4 - If prefix and target are already the same, we stop here dont need to go deeper
            if (target.isSameNode(prefixElem)) {
                TRUE_PREFIX = prefix;
                break;
            }

            //#5 - If the target is inside my children, my prefix is already my TRUE_PREFIX
            if (sourceHasChild(prefixElem, target, history)) {
                TRUE_PREFIX = prefix;
                break;
            }
        }
    }
    //#6 - If i have a prefix is search my target XPATH
    if (TRUE_PREFIX) {
        var options = _ts_execution_option;
        return tryPossibilities(target, options);
    }
    //#7 - In the other case, invalid prefix we are on an error situation
    return null;
}

function isXpathInHistory(xpath){
    for(var i = 0 ; i < TRY_HISTORY.length; i++){
        if(TRY_HISTORY[i].xpath === xpath)
            return true;
    }
    return false;
}

function addXpathToHistory(xpath,match){
    TRY_HISTORY.push({"order":TRY_HISTORY.length+1, "xpath":xpath, "match":match});
}

/**
 * Main program
 * 
 * element - selector main
 */
ts_gen_algo_xpath = function(element) {
    MANDATORY_OPTIONS = null;
    TRUE_PREFIX = "";
    TRY_HISTORY = [];
    _ts_execution_option = ["_tag!","id","class","_position","width","style","srcset","src","onload","height","data-iml","data-atf","alt","_innerText","value","type","title","spellcheck","role","name","maxlength","jsaction","data-ved","autocorrect","autocomplete","autocapitalize","aria-haspopup","aria-label","aria-autocomplete"];
    
    /**
     * Google example
     */
    // addAttributeOptions(document.getElementById('hplogo')); /** Add additional attributes as options coming from this element **/

    try {
        var options = _ts_execution_option;
        if (options.length > 0) {
            /**
             * Change the xpath stuffs for selector 
             */
            _ts_xpath_result  = tryPossibilities(element, options);
            // displayHistory();
        }else if(__x(GLOBAL_PREFIX).length === 1) {
            _ts_xpath_result = searchFromPrefix(GLOBAL_PREFIX, __x(GLOBAL_PREFIX)[0], element, [__x(GLOBAL_PREFIX)[0]]);
        }

        return _ts_xpath_result;
    } catch (e) {
        console.error(e);
    }
}

