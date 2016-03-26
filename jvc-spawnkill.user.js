// ==UserScript==
// @name        JVC SpawnKill
// @description JVC SpawnKill est une extension entièrement paramétrable permettant d'ajouter de nombreuses fonctionnalités à jeuxvideo.com
// @author      Spixel_
// @namespace   http://www.spawnkill.fr
// @include     http://*.jeuxvideo.com/*
// @include     http://*.forumjv.com/*
// @include     https://*.jeuxvideo.com/*
// @include     https://*.forumjv.com/*
// @version     3.0.5
// @require     jquery-2.2.0.min.js?v3.0.5
// @require     jquery-plugins.js?v3.0.5
// @require     base.js?v3.0.5
// @require     Util.js?v3.0.5
// @require     Message.js?v3.0.5
// @require     Author.js?v3.0.5
// @require     Button.js?v3.0.5
// @require     SlideToggle.js?v3.0.5
// @require     Modal.js?v3.0.5
// @require     DropdownList.js?v3.0.5
// @require     FaviconNotificationUpdater.js?v3.0.5
// @require     modules/Module.js?v3.0.5
// @require     modules/SpawnkillBase.js?v3.0.5
// @require     modules/Settings.js?v3.0.5
// @require     modules/Quote.js?v3.0.5
// @require     modules/Shortcuts.js?v3.0.5
// @require     modules/InfosPseudo.js?v3.0.5
// @require     modules/HilightSpecialTopic.js?v3.0.5
// @require     modules/LastPage.js?v3.0.5
// @require     modules/EmbedMedia.js?v3.0.5
// @require     modules/WarnOnNewPost.js?v3.0.5
// @require     modules/AutoUpdate.js?v3.0.5
// @require     modules/PemtHighlight.js?v3.0.5
// @require     modules/Usability.js?v3.0.5
// @resource    close                 images/close.png
// @resource    banImage              images/ban.png
// @resource    newTopic              images/new-topic.png
// @resource    bigTopic              images/big-topic.png
// @resource    carton                images/carton.png
// @resource    bronze                images/bronze.png
// @resource    argent                images/argent.png
// @resource    or                    images/or.png
// @resource    rubis                 images/rubis.png
// @resource    emeraude              images/emeraude.png
// @resource    diamant               images/diamant.png
// @resource    saphir                images/saphir.png
// @resource    female                images/female.png
// @resource    male                  images/male.png
// @resource    unknown               images/unknown.png
// @resource    plus                  images/plus.png
// @resource    minus                 images/minus.png
// @resource    link                  images/link.png
// @resource    anchor                images/anchor.png
// @resource    quote                 images/quote.png
// @resource    mp                    images/mp.png
// @resource    alert                 images/alert.png
// @resource    link-gray             images/link-gray.png
// @resource    search-topics         images/search-topics.png
// @resource    calendar              images/calendar.png
// @resource    clock                 images/clock.png
// @resource    crown                 images/crown.png
// @resource    settings              images/settings.png
// @resource    youtube               images/youtube.png
// @resource    video-html5           images/video-html5.png
// @resource    vimeo                 images/vimeo.png
// @resource    vine                  images/vine.png
// @resource    dailymotion           images/dailymotion.png
// @resource    sondageio             images/sondageio.png
// @resource    image                 images/image.png
// @resource    vocaroo               images/vocaroo.png
// @resource    loader                images/loader.gif
// @resource    big-loader            images/big-loader.gif
// @resource    error                 images/error.png
// @resource    tweet                 images/tweet.png
// @resource    tweet-mini            images/tweet-mini.png
// @resource    pogo                  images/pogo.png
// @resource    s                     images/s.png
// @resource    cross                 images/cross.png
// @resource    notification          audio/notification.ogg
// @grant       GM_xmlhttpRequest
// @grant       GM_getResourceURL
// @grant       GM_setClipboard
// @grant       GM_addStyle
// @run-at document-start
// ==/UserScript==

"use strict";
/* jshint unused: false */
/* jshint multistr: true */
/* jshint newcap: false */
SK.VERSION = "v3.0.5";


var inIframe = window.top !== window.self;

// On ne charge pas le script dans les iframes
if (!inIframe) {

    var modulesStyle = "";

    //On charge seulement les modules nécessaires
    for (var key in SK.moduleConstructors) {

        var moduleName = key;
        var module = new SK.moduleConstructors[key]();
        var moduleSettings = SK.Util.getValue(moduleName);
        //On prépare le chargement du module
        SK.modules[moduleName] = module;

        //On récupère les préférences courantes des options du module
        for (var settingKey in module.settings) {
            var setting = module.settings[settingKey];
            var settingLabel = settingKey;
            var settingValue = SK.Util.getValue(moduleName + "." + settingLabel);

            //Si la préférence n'est pas enregistrée, on prend la valeur par défaut
            if (settingValue === null) {
                settingValue = setting.default;
            }

            //On enregistre la préférence dans le module
            setting.value = settingValue;
        }

        //Si le module est requis, qu'il n'y a pas de préférences ou que la préférence est activé
        if (module.required || moduleSettings === null || moduleSettings) {

            //On autorise le module à exécuter du code avant le chargement du CSS
            module.beforeInit();

            //On charge le CSS du module
            modulesStyle += module.internal_getCss();

            //On indique que le module est chargé
            module.activated = true;
        }
        else {
            module.activated = false;
        }

    }

    //On ajoute le style de tous les modules actifs
    SK.Util.addCss(modulesStyle);

    //document.ready ne fonctionne pas sur GM.
    //Pour vérifier que le DOM est chargé, on vérifie que le footer est présent.
    var checkDomReady = setInterval(function() {

        var initModule = function(module) {
            module.internal_init();
        };

        if ($(".stats").length > 0) {
            clearInterval(checkDomReady);

            //On initialise les modules actifs
            for (var key in SK.modules) {
                if (SK.modules[key].activated) {
                    initModule(SK.modules[key]);
                }
            }
        }

    }, 50);
}
// Dans certains cas particuliers, on a besoin d'exécuter un peu de code dans une iframe
else {

    // On masque l'header, le footer et le bouton de feedback sur les CDV ouvertes dans les iframes
    if (window.location.href.match(/https?:\/\/www\.jeuxvideo\.com\/profil/)) {

        SK.Util.addCss("\
            header,\
            footer,\
            #jv-feedback {\
                display: none !important;\
            }\
        ");
    }

    // Sur la page de recherche, on ne conserve que les résultats
    else if (window.location.href.match(/https?:\/\/www\.jeuxvideo\.com\/recherche\/forums/)) {

        // On supprime tous les scripts
        $("script").remove();

        SK.Util.addCss("\
            body {\
                overflow-x: hidden !important;\
            }\
            .forum-main-col {\
                width: 100%\
            }\
            .conteneur-topic-pagi {\
                border: none;\
            }\
            .container-content {\
                min-height: 0px !important;\
            }\
            #content {\
                padding: 0px !important;\
            }\
            .bloc-pre-left,\
            .titre-head-bloc,\
            .bloc-fil-ariane-crumb-forum,\
            #forum-right-col,\
            #prospect,\
            #jv-feedback,\
            header,\
            footer {\
                display: none !important;\
            }\
            .bloc-pre-pagi-forum {\
                text-align: left;\
            }\
        ");
    }


}
