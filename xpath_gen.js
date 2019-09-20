var TRY_HISTORY;

var LOCATION_EVERYWHERE = "//";
var LOCATION_DIRECT_CHILD = "/";
var TAGNAME_ALL = "*";

//Ici je defini mes options speciales, tout ce qui n'est pas ici sera considéré comme un attribute
var OPTION_TAGNAME = "_tag";
var OPTION_INNERTEXT = "_innerText";
var OPTION_POSITION = "_position";
var OPTION_OTHER_ATTRIBUTES = "_other";

var _ts_xpath_result = 'Unavailable';

var _ts_execution_option = ['_tag!', 'id', 'class', '_position'];

//Ici je défini mes escape String
var ESCAPE_QUOTE = "', \"'\", '";

function buildElementXpathPossibility(element, selectedOptions) {
    //Pour le moment, je ne tiens pas compte de la hiérarchie
    var prefix = LOCATION_EVERYWHERE;
    
    var tagName = buildXpathTagName(element, selectedOptions);
    var attributes = buildXpathAttributes(element, selectedOptions);
    /*if(selectedOptions.indexOf(OPTION_POSITION) !== -1){
        return prefix + tagName + "["+ getPosition(element) +"]";
    }*/
    return prefix + tagName + attributes;
}

function buildXpathAttributes(element, selectedOptions) {

    //Ici je declare une variable pour gerer la notion de 'and'
    var firstAttributeUsed = false;

    //Je declare egalement mon resultat final
    var result = "";

    //pour chacune de mes options selectionnées
    for (var i = 0; i < selectedOptions.length; i++) {
        //si c'est une option spéciale elle commence par _ alors je la traite différamment
        var attr = null;
        if (selectedOptions[i].charAt(0) == "_") {
            attr = buildSpecialAttribute(element, selectedOptions[i], selectedOptions);
        }
        //sinon cela veut dire que c'est un attribute standard je lui applique le traitement standard
        else {
            attr = buildCommonAttribute(element, selectedOptions[i]);
        }

        //si j'ai bien un attribute a essayer alors
        if (attr && result.indexOf(attr) === -1) {
            //Je renseigne le and si ce n'est pas le premier attribut, sinon je met seulement l'attribut
            result += firstAttributeUsed ? " and " + attr : attr;
            // j'ai trouvé un attribut donc dans tous les cas je m'assure de bien set ma valeur a true pour gérer le and au prochain coup
            firstAttributeUsed = true;
        }
    }
    //si j'ai utilisé des attributs alors je renseigne le resultat entourè de bracket sinon je retourne rien
    return firstAttributeUsed ? "[" + result + "]" : "";
}

function buildSpecialAttribute(element, selectedOption) {

    var result = null;
    switch (selectedOption) {
        //dans le cas ou mon option speciale est le innerText
        case OPTION_INNERTEXT:
            result = buildSpecialAttributeText(element, true);
            break;
        //dans le cas ou mon option speciale est le childPosition
        case OPTION_POSITION:
            result = buildSpecialAttributePosition(element);
            break;
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
                //return "position()=" + counter;
            }
        }
    }
}

function buildCommonAttribute(element, selectedOption) {

    var result = null;
    //ici je prend l'attribut
    var text = element.getAttribute(selectedOption);
    //si il existe je continu
    if (text && text.length > 0) {
        //j'escape les quotes au cas ou
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
    //Si dans mes options selectionnes pour cet essai j'ai le tagName je le prend sinon je le laisse le all
    return selectedOptions.indexOf(OPTION_TAGNAME) === -1 ? TAGNAME_ALL : element.tagName.toLowerCase();
}

function defineOtherOptions(element, arrayOfOptions) {
    var otherPosition = arrayOfOptions.indexOf(OPTION_OTHER_ATTRIBUTES);
    if (otherPosition > -1) {
        //TODO i do not remember what i wanted to do here :/
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

function tryPossibilities(element, arrayOfOptions, parentTry, suffix, rootElement) {
    
    initMandatoryOptions(arrayOfOptions);
    //Si je n'ai pas d'essai parent, je cree un tableau vide
    parentTry = parentTry ? parentTry : [];
    rootElement = rootElement ? rootElement : element;
    //J'initialise mon suffix s'il n'était pas renseigné
    suffix = suffix ? suffix : "";


    if (TRUE_PREFIX) {
        var xpathResultElement = __x(TRUE_PREFIX);
        if (rootElement.isSameNode(xpathResultElement[0]) && xpathResultElement.length === 1) {
            return TRUE_PREFIX;
        }
    }

    var dig = false;
    //pour chaque options
    arrayOfOptions = defineOtherOptions(element, arrayOfOptions);
    for (var i = 0; i <= arrayOfOptions.length; i++) {
        //si je suis en train de creuser et que je peux encore creuser d'avantage et que je n'ai pas deja inclus l'option dans ma possibilité
        //if(dig && parentTry.length < arrayOfOptions.length && parentTry.indexOf(arrayOfOptions[i]) == -1){
        //Mais il faut aussi tenir compte du fait que:
        /* Lorsque j'essaye mes options : essayer "tag" et "id" c'est la meme chose que "id" et "tag"
           Alors je prefere utiliser la condition suivante
        */
        if (dig && i === parentTry.length) {
            //Je specifie mes options actuelles
            var currentTry = parentTry.slice();
            currentTry.push(arrayOfOptions[i]);
            //Je creuse plus profond et j'essaye de nouvelles possibilités
            var result = tryPossibilities(element, arrayOfOptions, currentTry, suffix, rootElement);
            if (result) return result;
            //sinon
        } else if (!dig) {
            //si cette option n'est pas deja utilise dans le parent
            if ((arrayOfOptions.length === i && MANDATORY_OPTIONS.length > 0) || parentTry.indexOf(arrayOfOptions[i]) === -1) {
                //je construit la possibilité local en utilisant le parent + ma current option
                var currentTry = parentTry.slice();
                //un try sans seulement avec les mandatory options
                if (i < arrayOfOptions.length) {
                    currentTry.push(arrayOfOptions[i]);
                }
                currentTry = currentTry.concat(MANDATORY_OPTIONS);
                var xpath = TRUE_PREFIX + buildElementXpathPossibility(element, currentTry) + suffix;
                var xpathResultElement = __x(xpath);
                if (rootElement.isSameNode(xpathResultElement[0]) && xpathResultElement.length === 1) {
                    return xpath;
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

window.os_execute = function() {
    MANDATORY_OPTIONS = null;
    TRUE_PREFIX = "";
    TRY_HISTORY = [];
    
    /**
     * Google example
     */
    // addAttributeOptions(document.getElementById('hplogo')); /** Add additional attributes as options coming from this element **/

    try {
        var options = eval(_ts_execution_option);
        if (options.length > 0) {
            /**
             * Here you change the xpath stuffs for selector 
             */
            _ts_xpath_result  = tryPossibilities(document.getElementsByClassName('ins_descp')[0], options);
            
            console.log('os-execution-result1: ', _ts_xpath_result);
            // displayHistory();
        }
    } catch (e) {
        console.error(e);
        document.getElementById('os-execution-options-error').style.display = "block";
    }
}


function displayHistory(){
    var elem = document.getElementById('hplogo');
    elem.innerHTML = "";
    TRY_HISTORY.forEach(function(h){
       var child = document.createElement("li");
       child.innerHTML = "" +
           "<span>#"+h.order+"</span>" +
           "<input type='text' class='os-text-input' id='os-history-xpath-input-"+h.order+"' value=\""+h.xpath+"\"/>" +
           "<span class='os-match-history' id='os-history-xpath-match-"+h.order+"' >"+h.match+"</span>";
       elem.appendChild(child);
       elem.querySelector("#os-history-xpath-match-"+h.order).onclick = function(ev){
           var result = document.querySelector("#os-execution-result");
           result.value = document.querySelector("#"+this.id.replace("match","input")).value;
           OS_TRY_XPATH(result.value);
       };
    });
}

function OS_TRY_XPATH(xpath) {
    var arr = __x(xpath);
    document.getElementById('os-style-try-helper').innerHTML = "[currentxpathtry='" + (++COUNTER_TRY_XPATH) + "']{box-shadow: 0px 0px 20px 1px #E82895 !important;}";
    document.getElementById('os-try-it-found').innerHTML = "&nbsp;(" + arr.length + ")";
    for (var i = 0; i < arr.length; i++) {
        arr[i].setAttribute("currentxpathtry", "" + COUNTER_TRY_XPATH);
    }
}

function doesExistsAsOption(optionName){
    var elements = ["tagName", "id", "class", "childPosition"];
    for(var i=0; i <elements.length;i++){
        if(elements[i] === optionName)
            return true;
    }
    return false;
}

window.os_execute();