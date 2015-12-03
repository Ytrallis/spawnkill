"use strict";

/* jshint multistr: true */
/* jshint newcap: false */

/**
 * EmbedMedia : Remplace les liens vers une vidéo YouTube par la vidéo elle-même.
 */
SK.moduleConstructors.EmbedMedia = SK.Module.new();

SK.moduleConstructors.EmbedMedia.prototype.id = "EmbedMedia";
SK.moduleConstructors.EmbedMedia.prototype.title = "Intégration de contenus";
SK.moduleConstructors.EmbedMedia.prototype.description = "Remplace les liens vers les images, vidéos, " +
    "sondages ou vocaroo par le contenu lui-même. Attention, si trop de contenu est activé, le chargement" +
    "de la page peut être ralenti.";

SK.moduleConstructors.EmbedMedia.prototype.init = function() {

    var self = this;

    this.initMediaTypes();

    //Si betterQuote est activé, on a besoin que les citations soient chargées pour calculer la taille des vidéos
    this.embedMedia();

    this.userSettings = {};

    //On récupère le paramètre optin
    this.userSettings.optinEmbed = this.getSetting("optinEmbed");

    //Et les paramètres de chaque type de media pour éviter les appels trop fréquents au localStorage
    for(var i in this.settings) {
        var settingId = i;
        this.userSettings[settingId] = this.getSetting(settingId);
    }

    if (this.getSetting("startGifWhenOnScreen")) {

        $(window).on("scroll", function() {
            // Pour toutes les webm qui sont complètement chargées
            $(".gif-webm").each(function() {
                self.updateWebmStatus($(this));
            });
            // Pour tous les GIF qui sont complètement chargés
            $(".image-media-element.media-element.gif").each(function() {
                SK.moduleConstructors.EmbedMedia.ManageGifCanvas.swapGifCanvas($(this));
            });
        });
    }

};

/**
 * Fonctions destinées à gérer les gifs et canvas
 */
SK.moduleConstructors.EmbedMedia.ManageGifCanvas = {
    /**
    * Crée un canvas de la première frame d'un gif
    */
    createCanvas: function($gif) {

        var $imageElement = $gif.parent();
        var gifWidth = $gif.width();
        var gifHeight = $gif.height();

        // Création du canvas
        var canvas = document.createElement("canvas");
        canvas.width = gifWidth;
        canvas.height = gifHeight;
        canvas.style.display = "none";
        canvas.getContext("2d").drawImage($gif.get(0), 0, 0, gifWidth, gifHeight);

        $gif.after($(canvas));
        $imageElement.addClass("gif");  // Ajout d'une classe spécifique pour prise en compte par le onScroll
        SK.moduleConstructors.EmbedMedia.ManageGifCanvas.swapGifCanvas($imageElement);
    },

    /**
    * Alterne entre gif et canvas suivant la position sur l'écran
    */
    swapGifCanvas: function($imageElement) {

        var $gif = $imageElement.find("img");
        var $canvas = $imageElement.find("canvas");
        var isVisibleOnScreen = $imageElement.isVisibleOnScreen() || $imageElement.isOversized(0.9);
        var isGifDisplayed = $gif.is(":visible");

        // Le .gif n'a pas encore été affiché, mais il est à la bonne position pour l'être
        if (!isGifDisplayed && isVisibleOnScreen) {

            // Remet le gif au début, sans recharger l'image
            $gif.attr("src", $gif.attr("src"));
            $gif.show();
            $canvas.hide();
        }

        // Le .gif est affiché mais partiellement visible, il doit être caché
        else if (isGifDisplayed && !isVisibleOnScreen) {
            $gif.hide();
            $canvas.show();
        }
    }
};

/**
 * Wrapper de l'API de GfyCat permettant de convertir des gif en vidéos webm à la volée
 */
SK.moduleConstructors.EmbedMedia.GfyApi = {

    /**
     * Test si le gif a déjà été converti.
     * @param {string} url Url du gif à tester
     * @param {function} callback Fonction appelée avec la réponse de l'appel,
     *    voir la doc pour plus d'infos : http://gfycat.com/api
     */
    testGif: function(url, callback) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "http://gfycat.com/cajax/checkUrl/" + encodeURIComponent(url),
            onload: function(data) {
                callback(JSON.parse(data.responseText));
            }
        });
    },

    /**
     * Converti un gif en vidéo webm.
     * @param {string} url Url du gif à convertir
     * @param {function} callback Fonction appelée avec la réponse de l'appel,
     *    voir la doc pour plus d'infos : http://gfycat.com/api
     */
    convertGif: function(gifUrl, callback) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://upload.gfycat.com/transcode?fetchUrl=" + encodeURIComponent(gifUrl),
            onload: function(data) {
                var json = JSON.parse(data.responseText);

                if(typeof json.error !== "undefined") {
                    callback(undefined);
                }
                else {
                    callback(json);
                }
            }
        });
    },

    /**
     * Retourne le lien vers la vidéos webm correspondant au gif passé en paramètre.
     * @param {string} url Url du gif à convertir
     * @param {function} callback Fonction appelée avec l'url de la vidéo en paramètre ou false en cas d'erreur
     */
    getWebmFromGif: function(gifUrl, callback) {
        SK.moduleConstructors.EmbedMedia.GfyApi.testGif(gifUrl, function(check) {
            if(check.urlKnown) {
                callback(check.webmUrl);
            }
            else {
                SK.moduleConstructors.EmbedMedia.GfyApi.convertGif(gifUrl, function(converted) {
                    if(typeof converted === "undefined") {
                        callback(undefined);
                    }
                    else {
                        callback(converted.webmUrl);
                    }
                });
            }
        });
    }
};


/* options : {
    id: nom du type de media
    regex: regex de reconnaissance du lien
    addHideButton: si vrai, un bouton pour cacher le media sera affiché
    hideButtonText: texte au survol du bouton de masquage
    showButtonText: texte au survol du bouton d'affichage
    settingId: id du paramètre gérant le media
    getEmbeddedMedia: callback appelé avec getEmbeddedMedia($a, link.match(regex)), retourne l'élément jQuery qui remplace le lien
}*/
SK.moduleConstructors.EmbedMedia.MediaType = function(options) {
    this.id = options.id;
    this.regex = options.regex;
    this.addHideButton = options.addHideButton;
    this.hideButtonText = options.hideButtonText;
    this.showButtonText = options.showButtonText;
    this.settingId = options.settingId;
    this.getEmbeddedMedia = options.getEmbeddedMedia;
};

/**
 * Tous les types de media pris en compte par le plugin
 */
SK.moduleConstructors.EmbedMedia.prototype.mediaTypes = [];

/**
 * Modifie le statut (lecture / pause) du GIF (.webm) suivant sa visibilité sur l'écran
 */
SK.moduleConstructors.EmbedMedia.prototype.updateWebmStatus = function($gif) {

    var isVisibleOnScreen = $gif.isVisibleOnScreen() || $gif.isOversized(0.9);
    var gif = $gif.get(0);
    var isPaused = gif.paused;

    // La vidéo n'a pas encore été débuté, mais elle est à la bonne position pour l'être
    if (isPaused && isVisibleOnScreen) {
        gif.play();
    }

    // La vidéo a débuté mais elle partiellement visible : elle doit être mise en pause
    else if (!isPaused && !isVisibleOnScreen) {
        gif.currentTime = 0;
        gif.pause();
    }
};

/**
 * Prépare les styles de media supportés
 */
SK.moduleConstructors.EmbedMedia.prototype.initMediaTypes = function() {

    var self = this;

    //Images
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "image",
        settingId: "embedImages",

        /*
         * match :
         * http://www.hapshack.com/?v=kCIu0.png
         * http://www.noelshack.com/2014-33-1408191836-vimeo.png
         * ne match pas :
         * https://www.dropbox.com/s/lfta3yd9tryotxp/screen2.png
         * http://www.hostingpics.net/viewer.php?id=785683.jpg
         * Pour les tests : http://regex101.com/r/fD7bC3/2
         */
        regex: /^https?:\/\/(?!www\.dropbox\.com|www\.hostingpics)(?:(?:(www\.hapshack\.com\/\?v=)|(www\.noelshack\.com\/([\d]{4})-([\d]{2})-))?(.*.(jp(e|g|eg)|png|gif|bmp)))(?:[\?:].*)?$/i,

        addHideButton: true,
        showButtonText: "Afficher les images",
        hideButtonText: "Masquer les images",

        getEmbeddedMedia: function($a, match) {

            var imageLink = match[0];
            var extension = match[6];

            //Prise en compte des images Noelshack
            if(typeof match[2] != "undefined") {
                imageLink = "http://image.noelshack.com/fichiers/" + match[3] + "/" + match[4] + "/" + match[5];
            }

            //Prise en compte d'Hapshack
            else if(typeof match[1] != "undefined") {
                imageLink = "http://www.hapshack.com/images/" + match[5];
            }

            //Embed d'une image "classique"
            var $el = $("<a>", {
                href: imageLink,
                target: "_blank"
            });

            var $imageEmbed = $("<img>", {
                src: imageLink,
                title: " ",
                alt: imageLink, //Obligatoire pour que les citations partielles fonctionnent avec les images
                "data-popin": imageLink,
                "data-popin-type": "image"
            });

            $el.html($imageEmbed);

            //Si l'image est un gif, on la converti en vidéo HTML5 via Gfycat
            if(extension.toLowerCase() === "gif") {

                // On intègre la vidéo et on met à jour le lien vers cette vidéo
                $el.html("<video autoplay loop></video>");

                SK.moduleConstructors.EmbedMedia.GfyApi.getWebmFromGif(imageLink, function(webmLink) {
                    //En cas d'erreur, fallback à l'embed classique
                    if(typeof webmLink === "undefined") {
                        $el.html($imageEmbed);

                        if (self.getSetting("startGifWhenOnScreen")) {
                            // On attend le chargement complet du GIF, sinon le canvas sera vide
                            $imageEmbed.one("load", function() {
                                SK.moduleConstructors.EmbedMedia.ManageGifCanvas.createCanvas($imageEmbed);
                            });
                            $imageEmbed.attr("src", $imageEmbed.attr("src"));
                        }
                    }
                    else {
                        //On rempli l'élément du DOM après coup
                        $el.attr("href", webmLink);
                        $el.find("video").attr("src", webmLink);

                        if (self.getSetting("startGifWhenOnScreen")) {
                            $el.find("video").on("loadedmetadata", function() {

                                var $this = $(this);
                                // Une fois chargé, ajout d'une classe pour prise en compte par le onScroll
                                $this.addClass("gif-webm");
                                // Démarrer ou mettre en pause la webm suivant sa position
                                self.updateWebmStatus($this);
                            });
                        }
                    }
                });
            }
            return $el;
        }

    }));

    //Vidéos HTML5 (WebM, OGG, MP4)
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "video_html5",
        settingId: "embedVideos",

        regex: /^(https?:\/\/[^\s]*\.(?:ogv|mp4|webm|ogg))$/,

        addHideButton: true,
        showButtonText: "Afficher les vidéos HTML5",
        hideButtonText: "Masquer les vidéos HTML5",


        getEmbeddedMedia: function($a, match) {

            var src = match[1];

            var $el = $("\
                <video controls='controls'>\
                    <source src='" + src + "'>\
                    Votre navigateur Internet ne permet pas d'afficher cette vidéo.\
                </video>\
            ");
            return $el;
        }

    }));

    //Youtube
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "youtube",
        settingId: "embedVideos",

        // http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
        // http://regex101.com/r/cJ5xN3/1 pour les tests de la regex
        /* $1: youtubeId */
        /* $2 (si présent): startTime */
        regex: /^https?:\/\/(?:(?:www)?m?\.)?youtu.*(?:\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^\s^#\&\?]*)?(?:.*(?:\?|#|&)t=([^\s^#\&\?]*))?/,

        addHideButton: true,
        showButtonText: "Afficher les vidéos Youtube",
        hideButtonText: "Masquer les vidéos Youtube",

        getEmbeddedMedia: function($a, match) {

            /**
             * Retourne une version "embed" du lien, sinon null.
             */
            var getEmbedUrl = function(youtubeId, start) {
                return "http://www.youtube.com/embed/" + youtubeId + "?html5=1" + (start !== 0 ? "&start=" + start : "");
            };

            /**
             * Fonction qui crée l'élément à intégrer à la page.
             */
            var createVideoElement = function (youtubeLink) {
                var ratio = 16 / 9;
                var videoWidth = $a.closest("blockquote, .bloc-contenu").width() - 5;
                var videoHeight = videoWidth / ratio;

                var $el = $("<iframe>", {
                   src: youtubeLink,
                   width: videoWidth,
                   height: videoHeight,
                   allowfullscreen: 1,
                   frameborder: 0,
                });

                return $el;
            };

            /**
             * Prend en paramètre une chaîne représentant un temps ("24", "1m35s", "1h8m12s", etc.) et la convertit en secondes
             */
            var timeToSeconds = function(time) {
                var tmp = "";
                var seconds = 0;
                for (var i = 0, c = time.length; i < c; i++) {
                    switch (time[i]) {
                        case "h":
                        seconds += parseInt(tmp) * 3600;
                        tmp = "";
                        break;

                        case "m":
                        seconds += parseInt(tmp) * 60;
                        tmp = "";
                        break;

                        case "s":
                        seconds += parseInt(tmp);
                        tmp = "";
                        break;

                        default: // un chiffre
                        tmp += time[i];
                        break;
                    }
                }
                if (tmp !== "") { // cas où time ne contenait que des chiffres
                    seconds += parseInt(tmp);
                }
                return seconds;
            };

            if (match[1].length === 11) {
                var start = 0;
                if (typeof match[2] !== "undefined") {
                    start = timeToSeconds(match[2]);
                }
                var youtubeLink = getEmbedUrl(match[1], start);
                return createVideoElement(youtubeLink);
            }
            else {
                return null;
            }
        }

    }));

    //Vocaroo
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "vocaroo",
        settingId: "embedRecords",

        regex: /^http:\/\/vocaroo\.com\/i\/(.*)$/,

        addHideButton: true,
        showButtonText: "Afficher les Vocaroos",
        hideButtonText: "Masquer les Vocaroos",


        getEmbeddedMedia: function($a, match) {

            var vocarooId = match[1];
            var $el = $("\
                <object width='148' height='44'>\
                    <param name='movie' value='http://vocaroo.com/player.swf?playMediaID=" + vocarooId + "&autoplay=0'></param>\
                    <param name='wmode' value='transparent'></param>\
                    <embed src='http://vocaroo.com/player.swf?playMediaID=" + vocarooId + "&autoplay=0' width='148' height='44'\
                        wmode='transparent' type='application/x-shockwave-flash'>\
                    </embed>\
                </object>\
            ");
            return $el;
        }

    }));

    //Pixule
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "pixule",
        settingId: "embedSurveys",

        regex: /^http:\/\/www\.pixule\.com.*\/(\d+).*$/,

        addHideButton: true,
        showButtonText: "Afficher les sondages Pixule",
        hideButtonText: "Masquer les sondages Pixule",

        getEmbeddedMedia: function($a, match) {

            //On ne remplace pas les sondages dans les citations
            if($a.parents(".quote-message").length > 0) {
                return null;
            }
            else {
                var pixuleId = match[1];
                var sondageLink = "http://www.pixule.com/widget" + pixuleId;

                var $el = $("<iframe>", {
                   src: sondageLink,
                   "data-key": pixuleId,
                   width: 370,
                   height: 365,
                   frameborder: 0,
                   scrolling: "no",
                   allowtransparency: "true",
                });

                return $el;
            }
        }

    }));

    //Sondage.io
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "sondageio",
        settingId: "embedSurveys",

        regex: /^http:\/\/sondage\.io\/([\d]*).*$/,

        addHideButton: true,
        showButtonText: "Afficher les sondages Sondage.io",
        hideButtonText: "Masquer les sondages Sondage.io",

        getEmbeddedMedia: function($a, match) {


            //On ne remplace pas les sondages dans les citations
            if($a.parents(".quote-message").length > 0) {
                return null;
            }
            else {
                var sondageLink = match[0];
                var sondageWidth = Math.min(400, $a.parents("blockquote, .bloc-contenu").width() - 5);
                var sondageHeight = 300;

                var $el = $("<iframe>", {
                   src: sondageLink,
                   width: sondageWidth,
                   height: sondageHeight,
                   frameborder: 0,
                });

                return $el;
            }
        }

    }));

    //DailyMotion
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "dailymotion",
        settingId: "embedVideos",

        regex: /^http:\/\/www\.dailymotion\.com\/video\/([^_]*)/,

        addHideButton: true,
        showButtonText: "Afficher les vidéos DailyMotion",
        hideButtonText: "Masquer les vidéos DailyMotion",

        getEmbeddedMedia: function($a, match) {
            var dailymotionId = match[1];
            var dailymotionLink = "http://www.dailymotion.com/embed/video/" + dailymotionId;
            var ratio = 16 / 9;
            var videoWidth = $a.closest("blockquote, .bloc-contenu").width() - 5;
            var videoHeight = videoWidth / ratio;

            var $el = $("<iframe>", {
               src: dailymotionLink,
               width: videoWidth,
               height: videoHeight,
               allowfullscreen: 1,
               frameborder: 0,
            });

            return $el;
        }

    }));

    //Vimeo
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "vimeo",
        settingId: "embedVideos",

        regex: /^http:\/\/vimeo.com\/(?:\w*\/)*(\d*)/,

        addHideButton: true,
        showButtonText: "Afficher les vidéos Vimeo",
        hideButtonText: "Masquer les vidéos Vimeo",

        getEmbeddedMedia: function($a, match) {
            var vimeoId = match[1];
            var vimeoLink = "http://player.vimeo.com/video/" + vimeoId + "?title=0&byline=0&portrait=0&color=20B9EB";
            var ratio = 16 / 9;
            var videoWidth = $a.closest("blockquote, .bloc-contenu").width() - 5;
            var videoHeight = videoWidth / ratio;

            var $el = $("<iframe>", {
               src: vimeoLink,
               width: videoWidth,
               height: videoHeight,
               allowfullscreen: 1,
               frameborder: 0,
            });

            return $el;
        }

    }));

    //Vine
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "vine",
        settingId: "embedVideos",

        regex: /(^(https?:\/\/vine.co\/v\/[a-zA-Z0-9]*)|(https?:\/\/v\.cdn\.vine\.co\/r\/videos\/[\w\.\-]+\.mp4))/,

        addHideButton: true,
        showButtonText: "Afficher les vidéos Vine",
        hideButtonText: "Masquer les vidéos Vine",

        getEmbeddedMedia: function($a, match) {
            var vineLink = match[1];
            if (match[3] === undefined) {
                vineLink += "/embed/simple?audio=1&related=0";
            }
            var vineWidth = 320;
            var vineHeight = 320;

            var $el = $("<iframe>", {
               src: vineLink,
               width: vineWidth,
               height: vineHeight,
               allowfullscreen: 1,
               frameborder: 0,
            });

            return $el;
        }

    }));

    //Twitter
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "twitter",
        settingId: "embedTweets",
        regex: /https?:\/\/twitter\.com\/.+\/status\/(\d{18})/,
        addHideButton: true,
        showButtonText: "Afficher les tweets",
        hideButtonText: "Masquer les tweets",

        getEmbeddedMedia: function($a, match) {

            var tweetId = match[1];
            var tweetLink = "https://api.twitter.com/1/statuses/oembed.json?omit_script=true&id=" + tweetId;

            var $el = $("<div>");

            GM_xmlhttpRequest({
                method: "GET",
                url: tweetLink,
                onload: function(data) {
                    var json = JSON.parse(data.responseText);
                    $el.html(json.html);
                },
            });

            return $el;
        }

    }));

    //Lien Télécharger SpawnKill
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({

        id: "spawnkill",
        settingId: "embedSpawnKill",

        // https://regex101.com/r/yZ7tJ4/1
        regex: /^http:\/\/(?:(?:dl\.spixel\.fr\/get-spawnkill)|(?:www\.spawnkill\.fr))\/?#download(?:-box)?$/,

        addHideButton: false,

        getEmbeddedMedia: function() {

            var $el = $("<div>");

            var donationLabels = [
                "Me payer une bière",
            ];
            var donationLabel = donationLabels[Math.floor(Math.random() * donationLabels.length)];

            $el.append(new SK.Button({
                class: "spawnkill-button large",
                text: "Télécharger SpawnKill",
                href: "http://www.spawnkill.fr/#download",
                target: "_blank",
                tooltip: {
                    position: "bottom large",
                    text: "Télécharger et Installer SpawnKill"
                },
                wrapper: {
                    class: "spawnkill-wrapper"
                }
            }));

            var $donationButton = new SK.Button({
                class: "spawnkill-button large minor",
                html: donationLabel,
                tooltip: {
                    position: "bottom large",
                    text: "Faire un don de 2€ à Spixel_"
                },
                click: function() {
                    $(this).parents("form").first().submit();
                }
            });

            $el.append("<span class='or' >ou</span>");
            $el.append("<form target='_blank' class='donation-form' action='https://www.paypal.com/cgi-bin/webscr' method='post' target='_top'>\
                <input type='hidden' name='cmd' value='_donations'>\
                <input type='hidden' name='business' value='LHTF3GZ496X8U'>\
                <input type='hidden' name='lc' value='FR'>\
                <input type='hidden' name='item_name' value='Dorian Marchal'>\
                <input type='hidden' name='amount' value='2.00'>\
                <input type='hidden' name='currency_code' value='EUR'>\
                <input type='hidden' name='bn' value='PP-DonationsBF:1408178230-capture-du-2014-08-16-10-33-38.jpg:NonHostedGuest'>\
                <img alt=' border='0' src='https://www.paypalobjects.com/fr_FR/i/scr/pixel.gif' width='1' height='1'>\
                </form>\
            ");

            $el.find("[name=bn]").after($donationButton);

            return $el;
        }

    }));

    //Pogo
    this.mediaTypes.push(new SK.moduleConstructors.EmbedMedia.MediaType({
        id: "pogo",
        settingId: "embedPogos",

        regex: /^http:\/\/f\.angiva\.re\/(.{5,5})$/,

        addHideButton: true,
        showButtonText: "Afficher les miniatures pogo",
        hideButtonText: "Masquer les miniatures pogo",


        getEmbeddedMedia: function($a, match) {
            var stamp = match[1];

            GM_xmlhttpRequest({
                method: "GET",
                url: "http://f.angiva.re/get_thumb.php?f=" + stamp,
                onload: function(data) {

                    //Si on a bel et bien chargé une miniature, on l'affiche dans le lien
                    if(data.status === 200 || data.status === 304) {
                        $el.html("<img src=\"http://f.angiva.re/get_thumb.php?f=" + stamp + "\">");
                    }
                },
            });

            //Par défaut, on affiche seulement le lien
            var $el = $("<a>", { href: "http://f.angiva.re/" + stamp, target: "_blank" });
            $el.html("http://f.angiva.re/" + stamp);

            return $el;
        }
    }));

};

/**
 * Parcourt tous les liens des posts à la recherche de contenu à intégrer.
 */
SK.moduleConstructors.EmbedMedia.prototype.embedMedia = function() {

    var self = this;
    /**
     * Fonction qui ajoute le bouton afficher/masquer les media d'un post.
     */
    var addToggleMediaButton = function($msg, mediaType, actionShow) {

        var dataAction = actionShow ? "show" : "hide";
        var tooltipText = actionShow ? mediaType.showButtonText : mediaType.hideButtonText;

        SK.Util.addButton($msg, {
            location: "right",
            "data-media-id": mediaType.id,
            "data-action": dataAction,
            tooltip: {
                text: tooltipText,
                position: "top"
            },
            click: function() {
                var $button = $(this);
                var mediaId = $button.attr("data-media-id");
                var show = $button.attr("data-action") === "show";

                //On change l'état du bouton
                if(show) {
                    $button.attr("data-action", "hide")
                           .siblings(".sk-tooltip").html(mediaType.hideButtonText);
                }
                else {
                    $button.attr("data-action", "show")
                           .siblings(".sk-tooltip").html(mediaType.showButtonText);
                }

                //On affiche/cache les medias
                $msg.find("." + mediaId + "-media-element").toggle();
                $msg.find("." + mediaId + "-media-link").toggle();

                //Fix pour vine quand optin est activé
                if(mediaType.id === "vine") {
                    var $vineFrame = $msg.find("." + mediaId + "-media-element");
                    $vineFrame.attr("src", $vineFrame.attr("src"));
                }

                //On enregistre l'état dans le localStorage
                SK.Util.setValue($msg.attr("id") + "." + mediaId +".show", show);

            }
        });
    };

    /**
     * Lie un contenu au lien s'il match un type de media
     */
    var queueCheckLinkForMedia = function($msg, $a, limit) {

        self.queueFunction(function() {

            if (limit.isReached()) {
                // Stoppe directement si la limite est atteinte
                return;
            }

            var messageId = $msg.attr("id");

            //On parcourt tous les types de medias
            self.mediaTypes.some(function(mediaType) {

                //On intégre seulement les medias activés
                if(self.userSettings[mediaType.settingId]) {

                    var matchMedia = $a.attr("href").match(mediaType.regex);

                    // Vrai si le media doit être affiché au chargement, on récupère les infos dans le localStorage
                    var showMedia = SK.Util.getValue(messageId + "." + mediaType.id +".show");

                    //On cache tous les medias des citations, par défaut
                    if($a.parents("blockquote").length > 0) {
                        showMedia = false;
                    }

                    //Par défaut, on affiche le media si optinEmbed est à faux
                    if(showMedia === null) {
                        showMedia = !self.userSettings.optinEmbed;
                    }

                    //Le lien correspond au media
                    if (matchMedia) {
                        // Notifie le code parent qu'un media a été trouvé
                        limit.increment();

                        //On remplace le lien par l'élément du media
                        var $mediaElement = mediaType.getEmbeddedMedia($a, matchMedia);

                        if($mediaElement !== null) {
                            $a.after($mediaElement);
                            $mediaElement.addClass(mediaType.id + "-media-element media-element");
                            $a.addClass(mediaType.id + "-media-link");

                            if(showMedia) {
                                $a.hide();
                            }
                            else {
                                $mediaElement.hide();
                            }

                            //Si besoin, on ajoute une seule fois  un bouton pour masquer/afficher le media
                            if(mediaType.addHideButton && $msg.find("[data-media-id='" + mediaType.id + "']").length === 0) {
                                addToggleMediaButton($msg, mediaType, !showMedia);
                            }
                        }

                        return true;
                    }
                }
            });

        }, this);

    };

    /**
     * Parcourt des posts à la recherche de medias à intégrer,
     * remplacement des liens pas l'intégration du media correspondant
     *  et ajout d'un bouton masquer/afficher au post si nécessaire.
     */
    $(".bloc-message-forum").each(function(id, msg) {

        var $msg = $(msg);
        var count = 0;

        //On parcourt tous les liens du post
        $msg.find(".txt-msg a").each(function(id, a) {

            //Et on cherche chaque type de media
            queueCheckLinkForMedia($msg, $(a), {
                // Quand un media est trouvé
                increment: function () {
                    count++;
                },

                // Retourne si la limite est atteinte
                isReached: function () {
                    var maxMediaPerPost = parseInt(self.getSetting("maxMediaPerPost"));
                    return maxMediaPerPost !== 0 && count >= maxMediaPerPost;
                }
            });
        });
    });
};

SK.moduleConstructors.EmbedMedia.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ, SK.common.Pages.TOPIC_RESPONSE, SK.common.Pages.POST_PREVIEW);
};

SK.moduleConstructors.EmbedMedia.prototype.settings = {
    optinEmbed: {
        title: "Masquer les contenus par défaut",
        description: "Cache le contenu par défaut, il faut d'abord cliquer sur le bouton pour le faire apparaître.",
        type: "boolean",
        default: false,
    },
    maxMediaPerPost: {
        title: "Nombre maximum de media par post",
        description: "Au delà de cette limite, les liens ne seront pas transformés.",
        type: "select",
        options: {
            "5": "5",
            "10": "10",
            "20": "20",
            "50": "50",
            "0": "Pas de limite",
        },
        default: "20",
    },
    embedVideos: {
        title: "Intégration des vidéos",
        description: "Intégre les vidéos Youtube, DailyMotion, Vimeo et Vine aux posts.",
        type: "boolean",
        default: true,
    },
    embedImages: {
        title: "Intégration des images",
        description: "Intégre les images PNG, JPG et GIF aux posts.",
        type: "boolean",
        default: true,
    },
    embedSurveys: {
        title: "Intégration des sondages",
        description: "Intégre les sondages Pixule et Sondage.io aux posts.",
        type: "boolean",
        default: true,
    },
    embedRecords: {
        title: "Intégration des Vocaroos",
        description: "Intégre les enregistrements Vocaroo aux posts.",
        type: "boolean",
        default: true,
    },
    embedTweets: {
        title: "Intégration des tweets",
        description: "Intègre les tweets aux posts.",
        type: "boolean",
        default: false,
    },
    embedSpawnKill: {
        title: "Bouton de téléchargement SpawnKill",
        description: "Affiche un bouton à la place du lien de téléchargement SpawnKill.",
        type: "boolean",
        default: true,
    },
    startGifWhenOnScreen: {
        title: "Retarder le départ des GIF",
        description: "Les GIF démarrent lorsqu'ils sont entièrement visibles sur l'écran pour éviter d'en louper une partie.",
        type: "boolean",
        default: true,
    },
    embedPogos: {
        title: "Intégrations des pogos",
        description: "Intègre les miniatures pogos aux posts.",
        type: "boolean",
        default: false,
    },
};

SK.moduleConstructors.EmbedMedia.prototype.getCss = function() {
    var css = "\
        [data-media-id='image'] {\
            background-color: #FFB82B;\
            border-bottom-color: #C48B21;\
            background-image: url('" + GM_getResourceURL("image") + "');\
            background-position: 0px -1px;\
        }\
        [data-media-id='video_html5'] {\
            background-color: #F0662B;\
            border-bottom-color: #B51E00;\
            background-image: url('" + GM_getResourceURL("youtube") + "');\
            background-position: 0px -1px;\
        }\
        [data-media-id='youtube'] {\
            background-color: #E62117;\
            border-bottom-color: #9B140F;\
            background-image: url('" + GM_getResourceURL("youtube") + "');\
            background-position: 0px -1px;\
        }\
        [data-media-id='vine'] {\
            background-color: #23CC96;\
            border-bottom-color: #1B8C6A;\
            background-image: url('" + GM_getResourceURL("vine") + "');\
            background-position: 0px -2px;\
        }\
        [data-media-id='vimeo'] {\
            background-color: #20B9EB;\
            border-bottom-color: #167E9E;\
            background-image: url('" + GM_getResourceURL("vimeo") + "');\
            background-position: 0px -1px;\
        }\
        [data-media-id='dailymotion'] {\
            background-color: #0072AF;\
            border-bottom-color: #002438;\
            background-image: url('" + GM_getResourceURL("dailymotion") + "');\
            background-position: 0px -1px;\
        }\
        [data-media-id='pixule'] {\
            background-color: #B9E04E;\
            border-bottom-color: #809B36;\
            background-image: url('" + GM_getResourceURL("sondageio") + "');\
            background-position: 0px 0px;\
        }\
        [data-media-id='vocaroo'] {\
            background-color: #B1DB69;\
            border-bottom-color: #789346;\
            background-image: url('" + GM_getResourceURL("vocaroo") + "');\
            background-position: 0px -1px;\
        }\
        [data-media-id='sondageio'] {\
            background-color: #FF7B3B;\
            border-bottom: solid 2px #BC3800;\
            background-image: url('" + GM_getResourceURL("sondageio") + "');\
            background-position: 0px 0px;\
        }\
        [data-media-id='twitter'] {\
            background-color: #55ACEE;\
            border-bottom: solid 2px #2B76A8;\
            background-image: url('" + GM_getResourceURL("tweet-mini") + "');\
            background-position: 3px 2px;\
        }\
        [data-media-id='pogo'] {\
            background-color: #18428D;\
            border-bottom: solid 2px #0C2144;\
            background-image: url('" + GM_getResourceURL("pogo") + "');\
            background-position: 3px 2px;\
        }\
        .donation-form {\
            display: inline-block;\
        }\
        .spawnkill-media-element .sk-button {\
            vertical-align: top;\
        }\
        .spawnkill-media-element .or {\
            margin-left: 8px;\
            margin-right: 3px;\
            position: relative;\
            top: 6px;\
        }\
        .sk-button-content[data-action=show] {\
            background-color: #A3A3A3;\
            border-bottom-color: #525252;\
        }\
        .spawnkill-media-element {\
            display: block;\
        }\
        .spawnkill-wrapper {\
            margin-left: 0px;\
        }\
        .sondageio-media-element {\
            margin: 5px;\
            margin-left: 0px;\
            border: solid 1px #CCC;\
            border-radius: 5px;\
        }\
        .media-element {\
            margin: 10px 5px;\
            margin-left: 0px;\
        }\
        .image-media-element {\
            display: inline-block;\
            max-width: calc(100% - 5px);\
            margin: 5px;\
            margin-left: 0px;\
        }\
        .image-media-element img ,\
        .image-media-element video,\
        .video_html5-media-element {\
            max-width: 100%;\
        }\
    ";

    if(this.getSetting("embedPogos")) {
        css += "\
            .pogo-media-element img {\
                display: inline-block;\
                background-color: #fff;\
                border: 1px solid #666;\
                border-radius: 4px;\
                width: 128px;\
                height: 94px;\
                overflow: hidden;\
            }\
        ";
    }

    if(this.getSetting("embedTweets")) {
        css += "\
            .twitter-media-element {\
                padding-top: 32px;\
                background-color: #F6F6F6;\
                border-width: 1px;\
                border-style: solid;\
                border-color: #EEE #DDD #BBB;\
                font: 16px \"Helvetica Neue\",Roboto,\"Segoe UI\",Calibri,sans-serif;\
                color: #292F33;\
                background-image: url('" + GM_getResourceURL("tweet") + "');\
                background-position: 15px 8px;\
                background-repeat: no-repeat;\
                border-radius: 5px;\
                box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.15);\
            }\
            .twitter-tweet {\
                padding: 16px;\
                padding-top: 8px;\
                margin: 0px;\
                border-top: 1px solid rgba(0, 0, 0, 0.1);\
                border-left: none;\
                line-height: 1.4em;\
                font-size: 14px;\
                font-weight: bold;\
                border-radius: 0px 0px 5px 5px;\
                background-color: #FFF;\
            }\
            .twitter-tweet a {\
                display: block;\
                font-size: 14px;\
                color: #0084B4;\
            }\
            .twitter-tweet p {\
                font-size: 14px;\
                font-weight: normal;\
                margin-bottom: 5px;\
            }\
            .twitter-tweet p a {\
                display: inline-block;\
            }\
        ";
    }

    return css;
};
