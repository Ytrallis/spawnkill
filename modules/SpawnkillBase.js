"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * SpawnkillBase : Module requis de SpawnKill,
 * permet de mettre en place la structure du script
 */
SK.moduleConstructors.SpawnkillBase = SK.Module.new();

SK.moduleConstructors.SpawnkillBase.prototype.id = "SpawnkillBase";
SK.moduleConstructors.SpawnkillBase.prototype.title = "Module Principal";
SK.moduleConstructors.SpawnkillBase.prototype.description = "Met en place la structure générale de SpawnKill.";
SK.moduleConstructors.SpawnkillBase.prototype.required = true;

SK.moduleConstructors.SpawnkillBase.prototype.beforeInit = function() {

    //Couleur principale du script
    var mainHsl = this.getSetting("mainColor");
    var match = mainHsl.match(/hsl\((\d*), (\d*)%, (\d*)%\)/);

    SK.common.mainColor = "hsl(" + match[1] + ", " + match[2] + "%, 60%)";
    SK.common.darkColor = "hsl(" + match[1] + ", " + match[2] + "%, 35%)";

    //Définition de la page courante
    SK.common.currentPage = this.getCurrentPage();
};

SK.moduleConstructors.SpawnkillBase.prototype.init = function() {

    this.initCommonVars();
    this.addModalBackground();
    this.bindPopinEvent();
};

/**
 * Défini les variables communes à tous les modules.
 */
SK.moduleConstructors.SpawnkillBase.prototype.initCommonVars = function() {

    //Défini l'id du topic et du forum, si disponible
    if (SK.common.currentPage === SK.common.Pages.TOPIC_READ) {
        var currentURLSplit = document.URL.split("-");
        SK.common.topicId = currentURLSplit[1] + "-" + currentURLSplit[2];
        SK.common.forumId = currentURLSplit[1];
    }
    else {
        SK.common.topicId = null;
    }
};

/**
 * Récupère la page courante.
 *
 * @return {string} type de page : "topic-list", "topic-read", "topic-response", "topic-form", "post-preview" ou "other"
 */
SK.moduleConstructors.SpawnkillBase.prototype.getCurrentPage = function() {

    var regex = "https?:\\/\\/(?:[a-z]+\\.jeuxvideo\\.com\\/forums|[^\\/]*\\.forumjv\\.com)\\/(0|1|42)";
    var match = window.location.href.match(regex);

    var currentPage = null;

    //Le chiffre après forum/ identifie le type de page
    if(match !== null) {
        switch(match[1]) {
            case "0" :
                currentPage = SK.common.Pages.TOPIC_LIST;
                break;
            case "1" :
            case "42" :
                currentPage = SK.common.Pages.TOPIC_READ;
                break;
        }
    }

    //Si on n'est pas sur une page forum
    if(currentPage === null) {

        currentPage = SK.common.Pages.OTHER;
    }

    return currentPage;
};

/* Ajoute l'évenement permettant d'ouvrir du contenu dans une fenêtre modale */
SK.moduleConstructors.SpawnkillBase.prototype.bindPopinEvent = function() {

    setTimeout(function() {

        $("body").on("click", "[data-popin]", function(event) {

            //Si la touche Ctrl est enfoncée, on laisse le navigateur ouvrir un onglet
            if(!event.ctrlKey) {

                event.preventDefault();

                var $el = $(this);
                var contentSrc = $el.attr("data-popin");
                var modalTitle = $el.attr("title");
                var contentType = $el.attr("data-popin-type");
                var $modalContent = null;

                var showPopin = function(buttons) {

                    buttons = buttons || [];

                    SK.Util.showModal(new SK.Modal({
                        class: "popin-modal",
                        location: "center",
                        title: modalTitle,
                        content: $modalContent,
                        buttons: buttons
                    }));

                };

                //On affiche l'écran de chargement de la modale
                SK.Util.showModalLoader();

                //Le media est une image
                if(contentType === "image") {
                    $modalContent = $("<img>", { src: contentSrc, alt: $el.attr("alt")});

                    var buttons = [];

                    //On ajoute un bouton de téléchargement sur Chrome
                    if(navigator.userAgent.toLowerCase().indexOf("chrome") > -1 &&
                        navigator.userAgent.toLowerCase().indexOf("opr") === -1
                    ) {
                        buttons.push(new SK.Button({
                            class: "large",
                            text: "Télécharger",
                            href: contentSrc,
                            download: modalTitle,
                            tooltip: {
                                class: "large",
                                text: "Télécharger l'image",
                                position: "bottom"
                            }
                        }));
                    }

                    //Ouvre une modale au centre de l'écran quand l'image est prête
                    SK.Util.preload($modalContent, function() {

                        //On contraint la taille de l'image
                        $modalContent.css("max-width", Math.min($modalContent.get(0).width,  $(window).width() - 80) + "px");
                        $modalContent.css("max-height", Math.min($modalContent.get(0).height,  $(window).height() - 120) + "px");

                        showPopin(buttons);
                    });
                }
                else if(contentType === "iframe") {

                    var desiredWidth = parseInt($el.attr("data-popin-width")) || 800;
                    var desiredHeight = parseInt($el.attr("data-popin-height")) || 700;
                    var desiredScrollPosition = parseInt($el.attr("data-popin-scroll-position")) || 0;
                    var onLoadCallback = SK.Util.getFunctionFromString($el.attr("data-popin-callback")) || $.noop;
                    var frameWidth = Math.min(desiredWidth,  $(window).width() - 80);
                    var frameHeight = Math.min(desiredHeight,  $(window).height() - 80);
                    var autoheight = $el.attr("data-popin-autoheight");

                    $modalContent = $("<div>");


                    $modalContent.append($("<div>", {
                        class: "loader"
                    }));

                    $modalContent.append($("<iframe>", {
                        class: "loading",
                        src: contentSrc,
                        width: frameWidth + "px",
                        height: frameHeight + "px",
                        frameborder: 0,
                        //Ouvre l'iframe quand elle est chargée
                        load: function() {

                            var frame = this;
                            var $frame = $(frame);

                            var onEndLoading = function() {
                                //On appelle l'éventuel callback
                                onLoadCallback();

                                //On scrolle la frame à la position choisie
                                frame.contentWindow.scrollTo(0, desiredScrollPosition);

                                //On retire le loader pour afficher la frame
                                $frame.removeClass("loading");
                            };

                            // Si la frame est en autoheight, on la redimensionne
                            if (autoheight) {


                                // On calcule la nouvelle hauteur de la frame
                                var $modal = $(".modal-box");
                                var modalHeight = $modal.outerHeight();
                                var screenHeight = $(window).height();
                                var iframeHeight = $frame.height();
                                var newIframeHeight = Math.min($frame.contents().find("html").outerHeight(),  screenHeight - 80);
                                var modalBorder = modalHeight - iframeHeight;
                                var newModalHeight = modalBorder + newIframeHeight;
                                var newModalTop = screenHeight / 2 - newModalHeight / 2;

                                $frame.animate({
                                    height: newIframeHeight
                                }, 200);

                                $modal.animate({
                                    top: newModalTop
                                }, 200, function() {
                                    setTimeout(function() {
                                        onEndLoading();
                                    }, 300);
                                });
                            }
                            else {
                                onEndLoading();
                            }

                        }
                    }));

                    showPopin();
                }
            }
        });

    }.bind(this), 1000);
};

/** prépare le terrain pour les modales */
SK.moduleConstructors.SpawnkillBase.prototype.addModalBackground = function() {
    $("body")
        .prepend("<div id='modal-loader'></div>")
        .prepend("<div id='sk-notifications'></div>")
        .prepend("<div id='modals'></div>")
        .prepend($("<div>", {
            id: "modal-background",
            click: function() {
                SK.Util.hideModal();
            }
        }))
    ;
};

SK.moduleConstructors.SpawnkillBase.prototype.settings = {
    mainColor: {
        title: "Couleur principale du plugin",
        description: "Possibilité de choisir la couleur principale utilisée à travers tout le plugin.",
        type: "select",
        options: {
            "hsl(40, 90%, 52%)" : "Jaune",
            "hsl(20, 100%, 62%)": "Orange",
            "hsl(0, 78%, 35%)" : "Rouge",
            "hsl(262, 60%, 52%)" : "Violet",
            "hsl(193, 68%, 33%)" : "Bleu",
            "hsl(88, 60%, 52%)" : "Vert",
        },
        default: "hsl(20, 100%, 62%)",
    }
};

 SK.moduleConstructors.SpawnkillBase.prototype.getCss = function() {

    var mainColor = SK.common.mainColor;
    var darkColor = SK.common.darkColor;

    var css = "\
        .bloc-message-forum .txt-msg,\
        .bloc-message-forum .conteneur-message,\
        .conteneur-message .bloc-header {\
            overflow: visible !important;\
        }\
        .bloc-message-forum .txt-msg {\
            word-wrap: break-word;\
        }\
        #bloc-commentaires .bloc-message-forum .txt-msg {\
            overflow: hidden !important;\
        }\
        .conteneur-message .text-enrichi-forum:last-child p:last-child,\
        .info-edition-msg:last-child {\
            margin-bottom: 0px;\
        }\
        .txt-msg:last-child,\
        .info-edition-msg:last-child {\
            margin-bottom: 12px;\
        }\
        .bloc-message-forum {\
            margin-bottom: 10px;\
        }\
        #modals {\
            font-size: 12px;\
        }\
        #modals ul {\
            padding: 0px;\
        }\
        #modals li {\
            list-style: none !important;\
        }\
        #modal-background {\
            display: none;\
            position: fixed;\
            left: 0px;\
            top: 0px;\
            width: 100%;\
            height: 100%;\
            background-color: #EEE;\
            opacity: 0.9;\
            z-index: 42000;\
        }\
        #modal-loader {\
            display: none;\
            position: fixed;\
            width: 40px;\
            height: 40px;\
            background-image: url('" + GM_getResourceURL("big-loader") + "');\
            background-repeat: no-repeat;\
            z-index: 42010;\
            opacity: 0.3;\
        }\
        #sk-notifications {\
            position: fixed;\
                top: 0px;\
                right: 0px;\
        }\
        .modal-box {\
            position: fixed;\
            left: 50%;\
            padding: 10px;\
            border-bottom: solid 1px #AAA;\
            text-align: left;\
            border-radius: 4px;\
            background-color: #FFF;\
            box-shadow: 0 10px 20px 2px rgba(0, 0, 0, 0.4);\
            opacity: 0;\
            z-index: 42020;\
            transition-duration: 400ms;\
        }\
        .modal-box.center {\
            transform: scale(0.4);\
            transition-duration: 400ms;\
        }\
        .modal-box.top {\
            top: -400px;\
            width: 400px;\
            margin-left: -200px;\
            border-radius: 0 0 4px 4px;\
        }\
        .modal-box.notification {\
            left: auto;\
            top: -400px;\
            right: 10px;\
            width: 380px;\
            transition-duration: 600ms;\
        }\
        .modal-box.active {\
            opacity: 1;\
        }\
        .modal-box.center.active {\
            transform: scale(1);\
            opacity: 1;\
        }\
        .modal-box.top.active {\
            top: 0px;\
        }\
        .modal-box.notification.active {\
            top: 10px;\
        }\
        .modal-box h3 {\
            min-height: 28px !important;\
            padding-top: 6px;\
            padding-bottom: 4px;\
            margin: 0px;\
            font-size: 18px;\
            color: " + mainColor + ";\
            overflow: visible !important;\
        }\
        .modal-box h4 {\
            color: #555;\
        }\
        .modal-box hr {\
            display: block;\
            height: 0px;\
            position: relative;\
            padding: 0;\
            margin: 0;\
            margin-top: 10px;\
            border: none;\
            border-bottom: solid 1px #DDD;\
        }\
        .modal-box.top hr,\
        .modal-box.notification hr {\
            display: block;\
            width: 420px;\
            height: 0px;\
            position: relative;\
            left: -10px;\
            padding: 0;\
            margin: 0;\
            margin-top: 10px;\
            border: none;\
            border-bottom: solid 1px #DDD;\
        }\
        .modal-box.notification hr {\
            width: 380px;\
        }\
        .popin-modal h3,\
        .popin-modal .content,{\
            text-align: center;\
        }\
        .popin-modal h3 {\
            margin-bottom: 10px;\
        }\
        .popin-modal hr {\
            display: none;\
        }\
        .popin-modal .content {\
            text-align: center;\
        }\
        .popin-modal iframe {\
            position: relative;\
            transition-duration: 300ms;\
            font-size: 0px !important;\
        }\
        .popin-modal iframe.loading {\
            opacity: 0;\
        }\
        .popin-modal .loader {\
            position: absolute;\
                left: calc(50% - 20px);\
                top: calc(50% - 20px);\
            width: 40px;\
            height: 40px;\
            background-image: url('" + GM_getResourceURL("big-loader") + "');\
            background-repeat: no-repeat;\
            opacity: 0.3;\
        }\
        #sk-notifications {\
            z-index: 42030;\
        }\
        #sk-notifications .notification {\
            position: relative;\
            margin: 10px;\
            left: auto;\
            top: -200px;\
            right: 0px;\
            font-size: 12px;\
            box-shadow: 0 5px 10px 1px rgba(0, 0, 0, 0.4);\
        }\
        #sk-notifications .notification .content {\
            margin-top: 22px;\
            margin-bottom: 0px;\
            font-size: 1.2em;\
            line-height: 1;\
            color: #555;\
        }\
        #sk-notifications .notification.active {\
            top: 0px;\
            opacity: 1;\
        }\
        .sk-button {\
            position: relative;\
            display: inline-block !important;\
            vertical-align: top;\
            font-weight: bold;\
            text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);\
        }\
        .buttons {\
            display: inline-block;\
            vertical-align: top;\
            -webkit-user-select: none;\
            -moz-user-select: none;\
            user-select: none;\
        }\
        .buttons.top {\
            position: relative;\
            top: 11px;\
            left: -4px;\
        }\
        .buttons.top .sk-button {\
            margin-left: 5px;\
        }\
        .buttons.right {\
            position: relative;\
            margin-left: 0px !important;\
            top: 12px;\
            line-height: 0;\
            font-size: 0;\
        }\
        .buttons.right .sk-button:first-child {\
            margin-left: 0px;\
        }\
        .bloc-message-forum .bloc-options-msg {\
            margin-left: 3px;\
        }\
        .bloc-message-forum .bloc-options-msg a,\
        .bloc-message-forum .bloc-options-msg span {\
            margin-left: 6px !important;\
        }\
        .buttons-row-wrapper {\
            text-align: right;\
            box-sizing: content-box;\
            margin-right: 12px;\
            margin-bottom: 8px;\
        }\
        .buttons.bottom .sk-button {\
            margin-left: 5px !important;\
        }\
        .buttons.box {\
            width: 100%;\
        }\
        .modal-box.center .buttons.box .sk-button {\
            margin-top: 10px;\
        }\
        .sk-button-content {\
            background-color: " + mainColor + ";\
            display: inline-block;\
            vertical-align: top;\
            position: relative;\
            height: 14px;\
            width: 16px;\
            box-sizing: content-box;\
            border: 0;\
            padding: 0;\
            border-bottom: solid 2px " + darkColor + ";\
            color: #FFF !important;\
            border-radius: 2px;\
            cursor: pointer;\
            background-position: 0px -1px;\
            background-repeat: no-repeat;\
        }\
        .sk-button-content:hover {\
            color: #FFF !important;\
        }\
        .sk-button-content:focus {\
            color: #FFF !important;\
            outline: none;\
        }\
        .sk-button-content:active {\
            margin-top: 1px;\
            border-bottom-width: 1px;\
            outline: none;\
        }\
        .sk-button-content.large {\
            height: auto;\
            width: auto;\
            padding: 6px 10px;;\
        }\
        .sk-button-content.minor {\
            background-color: #A3A3A3;\
            border-bottom-color: #525252;\
        }\
        .sk-button-content.transparent {\
            background-color: transparent;\
            border-bottom-color: transparent;\
        }\
        .sk-button.sk-close {\
            float: right;\
            margin-top: 1px;\
        }\
        .sk-button-content.sk-close {\
            width: 18px;\
            height: 18px;\
            background-image: url('" + GM_getResourceURL("close") + "');\
        }\
        .buttons.box .sk-button {\
            float: right;\
            margin-left: 10px;\
        }\
        .bloc-message-forum .buttons .sk-button-content {\
            opacity: 0.4;\
        }\
        .bloc-message-forum .sk-button-content:hover {\
            opacity: 1;\
        }\
        .sk-tooltip {\
            display: none;\
            position: absolute;\
            padding: 4px;\
            background-color: #222;\
            line-height: normal;\
            font-family: Arial,\"Helvetica Neue\",Helvetica,sans-serif;\
            font-size: 10px;\
            font-weight: normal;\
            text-align: center;\
            color: #FFF;\
            opacity: 0.8;\
            z-index: 100;\
        }\
        .sk-tooltip:after {\
            content: \"\";\
            position: absolute;\
            left: 8px;\
            border: solid 4px transparent;\
        }\
        .sk-tooltip.large:after {\
            left: 28px;\
        }\
        .sk-tooltip.top {\
            top: -27px;\
            left: -4px;\
        }\
        .sk-tooltip.bottom {\
            bottom: -27px;\
        }\
        .sk-tooltip.bottom.large {\
            bottom: -28px;\
        }\
        .sk-tooltip.bottom-right {\
            bottom: -28px;\
            right: 0px;\
        }\
        .sk-tooltip.right {\
            top: -3px;\
            left: 24px;\
        }\
        .sk-tooltip.top:after {\
            bottom: -8px;\
            border-top-color: #222;\
        }\
        .sk-tooltip.bottom:after {\
            top: -8px;\
            border-bottom-color: #222;\
        }\
        .sk-tooltip.bottom-right:after {\
            top: -8px;\
            right: 8px;\
            left: auto;\
            border-bottom-color: #222;\
        }\
        .sk-tooltip.bottom-right.large:after {\
            right: 28px;\
        }\
        .sk-tooltip.right:after {\
            left: -8px;\
            border-right-color: #222;\
        }\
        .sk-button-content:hover + .sk-tooltip {\
            display: block;\
        }\
        .slide-toggle {\
            display: inline-block;\
            vertical-align: middle;\
            box-sizing: content-box;\
            margin: 2px 0;\
            padding: 0;\
            border: none;\
            height: 20px;\
            width: 34px;\
            cursor: pointer;\
        }\
        .slide-toggle input {\
            display: none;\
        }\
        .slide-toggle input + .slide-toggle-style {\
            position: relative;\
            width: 100%;\
            height: 100%;\
            border-radius: 50px;\
            background-color: #A3A3A3;\
            box-shadow: 0 0 2px 0px #555 inset;\
            transition-duration: 300ms;\
        }\
        .slide-toggle input + .slide-toggle-style:after {\
            content: \"\";\
            display: inline-block;\
            position: absolute;\
            left: 2px;\
            top: 2px;\
            height: 16px;\
            width: 16px;\
            border-radius: 50%;\
            background-color: #FFF;\
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);\
            transition-duration: 300ms;\
        }\
        .slide-toggle :checked + .slide-toggle-style {\
            background-color: " + mainColor + ";\
            box-shadow: 0 0 2px 0px " + darkColor + " inset;\
        }\
        .slide-toggle :checked + .slide-toggle-style:after {\
            left: 16px;\
        }\
        .slide-toggle :disabled+ .slide-toggle-style:before {\
            content: \"\";\
            display: block;\
            position: absolute;\
            top: 0px;\
            left: 0px;\
            border-radius: 50px;\
            background-color: #AAA;\
            width: 100%;\
            height: 100%;\
            opacity: 0.5;\
            cursor: auto;\
        }\
        .slide-toggle :disabled + .slide-toggle-style:after {\
            background-color: #DDD;\
        }\
        .sk-dropdown {\
            position: relative;\
            display: inline-block;\
            vertical-align: middle;\
        }\
        .sk-dropdown-select:-moz-focusring {\
            color: transparent;\
            text-shadow: 0 0 0 #FFF;\
        }\
        .sk-dropdown-select:focus {\
            outline: 0;\
        }\
        .sk-dropdown-select {\
            font-size: 12px;\
            padding: 1px;\
            margin: 0;\
            box-shadow: 0px 0px 2px 0px " + darkColor + " inset;\
        }\
        .sk-dropdown-select {\
            background-color: " + mainColor + ";\
            color: #fff;\
        }\
        .sk-dropdown-select {\
            padding-right: 30px;\
            border: 0;\
            border-radius: 3px;\
            -webkit-appearance: none;\
            -moz-appearance: none;\
            appearance: none;    \
            cursor: pointer;\
        }\
        .sk-dropdown::before,\
        .sk-dropdown::after {\
            content: \"\";\
            position: absolute;\
            pointer-events: none;\
        }\
        .sk-dropdown::after {\
            content: \"\";\
            right: 6px;\
            top: 9px;\
            border: solid 4px transparent;\
            border-top-color: rgba(0, 0, 0, 0.3);\
        }\
        .sk-dropdown::before {\
            width: 20px;\
            right: 0;\
            top: 0;\
            bottom: 0;\
            border-radius: 0 3px 3px 0;\
        }\
        .sk-dropdown.disabled {\
            opacity: 0.8;\
        }\
        .sk-dropdown::before {\
            background-color: #FFF;\
            box-shadow: -2px 0px 2px -2px rgba(0, 0, 0, 0.3);\
        }\
        .sk-dropdown:hover::before {\
            background-color: #EEE;\
        }\
        .sk-dropdown::after {\
            color: rgba(0, 0, 0, .4);\
        }\
        @media only screen and (max-width: 39.99rem) {\
            .buttons.right {\
                display: none;\
            }\
        }\
      ";

    return css;
 };
