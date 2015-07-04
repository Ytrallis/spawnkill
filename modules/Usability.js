"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * Usability : Permet d'ajouter des fonctionnalités améliorant l'ergonomie générale du forum
 */
SK.moduleConstructors.Usability = SK.Module.new();

SK.moduleConstructors.Usability.prototype.id = "Usability";
SK.moduleConstructors.Usability.prototype.title = "Amélioration de l'ergonomie";
SK.moduleConstructors.Usability.prototype.description = "Ajoute quelques fonctionnalités simples permettant d'améliorer la navigation";


SK.moduleConstructors.Usability.prototype.init = function() {
    //Rafraichir -> dernier post
    if (this.getSetting("refreshToLastPost")) {

        //La page vient d'être rafraichie
        if (this.isJustRefreshed()) {
            //Scrolle jusqu'au dernier message
            this.scrollToLastPost();

            // Nettoie l'URL
            window.location.hash = "";
        }
        this.editRefreshLinks();
    }

    if (this.getSetting("focusOnNewMessage")) {
        this.bindFocusOnNewMessage();
    }

    if (this.getSetting("betterMessageInput")) {

        $("#message_topic").autoGrow();
        this.overrideQuoteButton();
    }

    if (this.getSetting("fullScreenVideo")) {
        this.addFullScreenButtons();
    }

};

/**
 * Modifie les liens de rafraichissement du sujet pour qu'ils renvoient vers le dernier post
 */
SK.moduleConstructors.Usability.prototype.editRefreshLinks = function() {

    // On supprime la classe du bouton actualiser pour modifier son comportement
    $(".btn-actualiser-forum")
        .removeClass("btn-actualiser-forum")
        .on("click", function() {
            window.location.href = SK.Util.currentSimpleUrl() + "#refresh";
            window.location.reload();
        })
    ;
};

SK.moduleConstructors.Usability.prototype.isJustRefreshed = function() {
    //Cette regexp teste si l'url contient ?refresh=1
    var regexp = /#refresh/;

    //Teste si la requête vient du bouton Rafraichir
    return regexp.test(document.URL);
};

/**
 * Scrolle la page au dernier message.
 */
SK.moduleConstructors.Usability.prototype.scrollToLastPost = function() {
    $(".conteneur-message").last().scrollThere();

};

/**
 * Ajoute le focus sur le sujet au clic sur "Nouveau topic"
 * ainsi que le focus sur le message au clic sur "Nouveau message"
 */
SK.moduleConstructors.Usability.prototype.bindFocusOnNewMessage = function() {

    // Nouveau topic
    $(".bloc-pre-left:first .btn-actu-new-list-forum").on("mousedown", function() {
        setTimeout(function() {
            $("#titre_topic").focus();
        }, 500);
    });

    // Nouveau message
    $(".btn-repondre-msg").on("mousedown", function() {
        setTimeout(function() {
            $("#message_topic").focus();
        }, 500);
    });
};

/**
 * Remplace l'événement onclick du bouton de citation par un nouvel
 * événement permettant de faire fonctionner autoGrow
 */
SK.moduleConstructors.Usability.prototype.overrideQuoteButton = function() {

    this.queueFunction(function() {

        unsafeWindow.$(".picto-msg-quote").off();
        $(".picto-msg-quote").on("click", function() {
            var $msg = $(this).parents(".bloc-message-forum");
            var postId = $msg .attr("data-id");
            var pseudo = $msg.find(".bloc-pseudo-msg").text().replace(/[\r\n]/g, "");
            var date = $msg.find(".bloc-date-msg").text().replace(/[\r\n]/g, "").replace(/[\r\n]/g, "").replace(/#[0-9]+$/g, "");

            $.ajax({
                type: "POST",
                url: "/forums/ajax_citation.php",
                dataType: "json",
                data: {
                    id_message: postId,
                    ajax_timestamp: $("#ajax_timestamp_liste_messages").val(),
                    ajax_hash: $("#ajax_hash_liste_messages").val(),
                },
                success: function (data) {
                    if (data.erreur.length === 0) {
                        unsafeWindow.$("#message_topic")
                            .insertStartLine("> Le " + date + " '''" + pseudo + "''' a écrit :\n>" + data.txt.split("\n").join("\n> ") + "\n\n")
                            .get(0).dispatchEvent(new Event("keyup"))
                        ;
                        $("#message_topic").scrollThere();
                    }
                }
            });
        });
    });
};

/**
 * Ajoute un bouton pour voir la vidéo en plein écran sous la vidéo
 */
SK.moduleConstructors.Usability.prototype.addFullScreenButtons = function () {

    var self = this;

    // On parcourt tous les players
    $(".player-contenu").each(function () {

        var $playerWrapper = $(this);

        // On attend que le player soit initialisé avant l'ajout du bouton
        var target = $playerWrapper.get(0);

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                var $player = $playerWrapper.find("object:not(.full-screen-button-added)").first();
                var playerIdMatches = $player.attr("name").match(/-(\d+)-/);
                var playerId = playerIdMatches && playerIdMatches[1];

                // Si l'id du player a pu être récupéré, on ajoute un bouton de plein écran.
                if (playerId) {
                    self._addFullScreenButtonTo($playerWrapper, "http://www.jeuxvideo.com/videos/iframe/" + playerId);
                    $player.addClass("full-screen-button-added");
                }
            });
        });

        observer.observe(target, { subtree: true, childList: true });
    });
};

SK.moduleConstructors.Usability.prototype._addFullScreenButtonTo = function ($playerWrapper, url) {

    var $button = new SK.Button({
        class : " large",
        text : "Voir en pleine page",
        href : url,

        wrapper : {
            class : "full-screen-btn",
        }
    });

    $playerWrapper.append($button);
};

SK.moduleConstructors.Usability.prototype.settings = {
    refreshToLastPost: {
        title: "Rafraîchir au dernier message",
        description: "Le bouton \"Rafraîchir\" d'un topic amène directement au dernier post de ce topic",
        type: "boolean",
        default: true,
    },
    focusOnNewMessage: {
        title: "Focus au nouveau message",
        description: "les boutons \"Nouveau sujet\" et \"Répondre\" donnent le focus sur le champ de réponse",
        type: "boolean",
        default: true,
    },
    betterMessageInput: {
        title: "Améliorer la saisie des messages",
        description: "Redimensionne automatiquement la boîte de saisie des messages/topics et change le curseur au survol de la preview",
        type: "boolean",
        default: true,
    },
    hideTopBar: {
        title: "Masquer la barre de navigation",
        description: "Cache la barre de navigation en haut de la page quand on scrolle",
        type: "boolean",
        default: false,
    },
    hideFeedbackButton: {
        title: "Masquer le bouton de feedback",
        description: "Cache le bouton de feedback en bas à droite de la page",
        type: "boolean",
        default: false,
    },
    hideProspectBar: {
        title: "Récupérer l'espace entre le menu et la page",
        description: "Réduit l'espace vide entre l'entête de la page et son contenu",
        type: "boolean",
        default: true,
    },
    fullScreenVideo: {
        title: "Ajouter un bouton \"Voir en plein écran\" sous les vidéos",
        description: "Permet à la vidéo de remplir entièrement la page",
        type: "boolean",
        default: true,
    },
};

SK.moduleConstructors.Usability.prototype.getCss = function() {
    var css = "";

    if (this.getSetting("betterMessageInput")) {
        css += "\
            .jv-editor .previsu-editor {\
                cursor: not-allowed;\
            }\
            .jv-editor .area-editor {\
                min-height: 76px !important;\
            }\
        ";
    }

    if (this.getSetting("hideTopBar")) {
        css += "\
            #header-bottom.affix .bloc-sticker {\
                position: absolute !important;\
            }\
            .affix #navbar-jv {\
                left: 0px !important;\
            }\
            #header-bottom.affix .a-back-home {\
                display: none;\
            }\
        ";
    }

    if (this.getSetting("hideFeedbackButton")) {
        css += "\
            #jv-feedback {\
                display: none;\
            }\
        ";
    }

    if (this.getSetting("hideProspectBar")) {
        css += "\
            #prospect {\
                min-height: 20px !important;\
                height: 20px !important;\
                visibility: hidden !important;\
            }\
        ";
    }

    if (this.getSetting("fullScreenVideo")) {
        css += "\
            .full-screen-btn {\
                float: right;\
                margin-left: 0px;\
                margin-top: 3px;\
                font-size: 0.8em;\
            }\
            .full-screen-btn::after {\
                content: \"\";\
                display: table;\
                clear: both;\
            }\
            .full-screen-btn .sk-button {\
                padding: 3px 8px;\
            }\
        ";
    }

    return css;
};
