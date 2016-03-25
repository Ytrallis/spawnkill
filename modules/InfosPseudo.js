"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

SK.moduleConstructors.InfosPseudo = SK.Module.new();

SK.moduleConstructors.InfosPseudo.prototype.id = "InfosPseudo";
SK.moduleConstructors.InfosPseudo.prototype.title = "Informations sur les posts";
SK.moduleConstructors.InfosPseudo.prototype.description = "Affiche le sexe de l'auteur si disponible, " +
    "un bouton pour copier le lien permanent ou encore un bouton pour voir les topics de l'auteur.";

/**
 * Pseudos des auteurs présents sur la page.
 */
SK.moduleConstructors.InfosPseudo.prototype.authors = {};

SK.moduleConstructors.InfosPseudo.prototype.init = function() {

    var self = this;

    //Sur la page liste des sujets, on récupère les auteurs des topics
    if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST)) {
        if (this.getSetting("enableAuthorHighlight")) {
            this.getTopicListAuthors();
        }
    }

    else {

        // On ajoute l'hilight des auteurs
        if (this.getSetting("enableUserHighlight")) {

            SK.Util.bindEvent("authorNamesLoaded", function() {
                self.highlightCurrentUser();
            });
        }

        this.addPostInfos();

        if (this.getSetting("enableAuthorHighlight")) {
            //On ajoute la couronne à l'auteur
            this.crownTopicAuthor();
        }

        // Si l'option est activée, on masque les posts des auteurs ignorés
        if (this.getSetting("enableBlockList")) {

            this.queueFunction(function() {
                this.hideBlockedPosts();
            }.bind(this));
        }

    }
};

/** Ajoute les infos à tous les posts */
SK.moduleConstructors.InfosPseudo.prototype.addPostInfos = function() {

    var self = this;

    // Messages de la page
    var $messages = $(".bloc-message-forum");

    //On parcourt tous les messages
    $messages.each(function(index) {
        var isLastMessageOnPage = $messages.length === index + 1;

        self.queueFunction(function() {

            var $msg = $(this);

            //On crée le Message
            var message = new SK.Message($msg);

            //On récupère l'auteur correspondant au post
            if(typeof self.authors[message.authorPseudo] === "undefined") {
                var $avatar = $msg.find('.user-avatar-msg');

                // Sur jeuxvideo.com la source de l'image se trouve d'abord dans `data-src`
                // puis cet attribut est remplacé par `src` quand l'image est lazyloadée.
                var avatarUrl = $avatar.data('srcset') || $avatar.attr('src');
                self.authors[message.authorPseudo] = new SK.Author(message.authorPseudo, avatarUrl);
            }
            var author = self.authors[message.authorPseudo];
            author.addMessage(message);

            //Et on l'ajoute au message
            message.setAuthor(author);

            self.showMessageInfos(message);

            // On dispatche un événement indiquant que tous les auteurs de la page sont définis
            if (isLastMessageOnPage) {
                SK.Util.dispatchEvent("authorNamesLoaded");
            }

        }, this);

    });
};

/** Affiche les infos du post et de l'auteur au message */
SK.moduleConstructors.InfosPseudo.prototype.showMessageInfos = function(message) {

    this.addPostButtons(message);

    if (this.getSetting("modalAvatar")) {
        this.addAvatarModalMarkup(message);
    }
};


/**
 * Ajoute le markup permettant aux avatars de s'ouvrir dans une fenêtre modale
 */
SK.moduleConstructors.InfosPseudo.prototype.addAvatarModalMarkup = function(message) {
    message.$msg.find(".bloc-avatar-msg a")
        .attr("data-popin", message.author.fullSizeAvatar)
        .attr("data-popin-type", "image")
        .attr("title", message.authorPseudoWithCase)
    ;
};

/** Ajoute les différents boutons et remplace ceux par défaut */
SK.moduleConstructors.InfosPseudo.prototype.addPostButtons = function(message) {

    var self = this;
    var permalink = message.permalink;
    var profileUrl = location.protocol + "//www.jeuxvideo.com/profil/" + message.authorPseudo + "?mode=infos";

    // On recrée le slug du forum pour l'url de recherche
    var forumUrl = $(".bloc-pre-left .group-two a:last").attr("href");
    var topicSearchUrl = location.protocol + "//www.jeuxvideo.com/recherche" + forumUrl + "?type_search_in_forum=auteur_topic&search_in_forum=" + message.authorPseudo;

    // Bouton profil
    if (!message.author.profileUnavailable && this.getSetting("enableProfile")) {

        var profileButtonOptions = {
            class: "unknown",
            href: profileUrl,
            tooltip: {
                text: "Voir la carte de visite"
            },
            click: function(event) {

                event.preventDefault();
                //On ne bloque pas le Ctrl + Clic et le middle clic
                if(!event.ctrlKey && event.which !== 2) {

                    //On n'ouvre la popup que si l'option modalProfile est désactivée
                    if(!self.getSetting("modalProfile")) {

                        window.open(profileUrl, "profil", "width=1000,height=720,scrollbars=no,status=no");
                    }
                }
                else {
                    window.open(profileUrl, "_blank");
                }
            }
        };

        //Si l'option est activée, la CDV s'affichera dans une popin
        if(this.getSetting("modalProfile")) {
            profileButtonOptions["data-popin"] = profileUrl;
            profileButtonOptions["data-popin-type"] = "iframe";
            profileButtonOptions["data-popin-width"] = 1000;
            profileButtonOptions["data-popin-height"] = 720;
            profileButtonOptions.index = 20;
            profileButtonOptions.title = " ";
            profileButtonOptions.href += "&popup=0";
        }

        SK.Util.addButton(message.$msg, profileButtonOptions);
    }

    //Bouton ignorer
    if(this.getSetting("enableBlockList") && !message.author.profileUnavailable) {

        var blockButtonOptions = {
            class: "block minor minus",
            location: "right",
            index: 200,
            "data-blocked": "0",
            wrapper: {
                class: "block-wrapper",
            },
            tooltip: {
                text: "Masquer les posts de " + message.authorPseudoWithCase
            },
            click: function() {

                // Affichage
                if ($(this).attr("data-blocked") === "1") {

                    // Supprime l'auteur du post des membres bloqués
                    self.removeFromBlockList(message.authorPseudo);

                    // Affiche les posts de l'auteur
                    self.showPostFrom(message);
                }
                // Masquage
                else {
                    // Ajoute l'auteur du post aux membres bloqués
                    self.addToBlockList(message.authorPseudo);

                    // Masque les posts de l'auteur
                    self.hidePostsForMessage(message);

                }
            }
        };

        SK.Util.addButton(message.$msg, blockButtonOptions);
    }

    //Bouton rechercher topics
    if(this.getSetting("enableSearchTopics") && !message.author.profileUnavailable) {
        SK.Util.addButton(message.$msg, {
            class: "searchTopics",
            href: topicSearchUrl,
            index: 40,
            tooltip: {
                text: "Rechercher les topics de " + message.authorPseudoWithCase
            },
            "data-popin": topicSearchUrl,
            "data-popin-type": "iframe",
            "data-popin-width": 680,
            "data-popin-height": 420,
            "data-popin-autoheight": 1,
        });
    }

    //Bouton permalien
    if(this.getSetting("enablePermalinkAnchor")) {
        SK.Util.addButton(message.$msg, {
            class: "anchor",
            location: "bottom",
            href: permalink,
            tooltip: {
                text: "Ancre du message"
            }
        });
    }

    //Bouton permalien (Ancre)
    if(this.getSetting("enablePermalink")) {
        SK.Util.addButton(message.$msg, {
            class: "link",
            location: "bottom",
            href: permalink,
            tooltip: {
                text: "Copier le permalien"
            },
            click: function(event) {
                event.preventDefault();
                GM_setClipboard(permalink);
            }
        });
    }

    //Supprimer boutons par défaut
    message.$msg.find(".ancre > a:first, [target='profil']").remove();
};


/**
 * Change la couleur du pseudo posts de l'utilisateur courant.
 */
SK.moduleConstructors.InfosPseudo.prototype.highlightCurrentUser = function() {

    //Cherche le pseudonyme de l'utilisateur
    var currentUserPseudo = $(".account-pseudo:first").text().trim().toLowerCase();

    for (var authorKey in this.authors) {

        if (authorKey === currentUserPseudo) {

            var messages = this.authors[authorKey].messages;

            for (var i in messages) {
                if (messages.hasOwnProperty(i)) {
                    messages[i].$msg.find(".bloc-pseudo-msg").first().addClass("current-user");
                }
            }
        }
    }

};


/**
 * Récupère et stocke les auteurs associés aux topics de la page liste des sujets.
 */
SK.moduleConstructors.InfosPseudo.prototype.getTopicListAuthors = function() {

    var currentForumId = document.URL.split("-")[1];

    //On parcourt tous les topics de la liste
    $(".titre-topic > a").each(function() {

        var $topicLink = $(this);

        //On récupère l'id du topic
        var topicId = $topicLink.attr("href").split("-")[2];
        var topicKey = "topics." + currentForumId + "-" + topicId;

        //Puis, si on n'a pas déjà les infos en localStorage
        if (SK.Util.getValue(topicKey) === null) {

            //On récupère le pseudo de l'auteur et on l'enregistre
            var topicAuthor = $topicLink.parents("tr").find(".auteur-topic > a").text().trim().toLowerCase();
            SK.Util.setValue(topicKey, topicAuthor);
        }

    });

};

/**
 * Récupère l'auteur du topic courant puis appelle la fonction pour couronner son pseudo.
 */
SK.moduleConstructors.InfosPseudo.prototype.getTopicAuthor = function(callback) {

    callback = callback || function() {};

    var topicKey = "topics." + SK.common.topicId;

    var topicAuthor = SK.Util.getValue(topicKey);

    //Si la clé n'est pas présente dans le localStorage
    if (topicAuthor === null) {
        //Si on est sur la première page du topic, on récupère directement l'auteur
        if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ) && SK.common.topicCurrentPage === "1") {

            topicAuthor = $(".bloc-pseudo-msg").first().text().trim().toLowerCase();

            //On enregistre l'info en localStorage
            SK.Util.setValue(topicKey, topicAuthor);

            callback(topicAuthor);
        }
        //Sinon, on fait une requête HTTP vers la première page du topic
        else {
            SK.Util.m(SK.common.getTopicUrlForPage(1), function($firstPage) {
                var contenu = $($firstPage.find("contenu").text());
                topicAuthor = contenu.find(".pseudo").first().text().trim().split(/\s/)[0].toLowerCase();

                //On enregistre l'info en localStorage
                SK.Util.setValue(topicKey, topicAuthor);

                callback(topicAuthor);
            });
        }
    }
    //Si on a déjà l'auteur
    else {
        callback(topicAuthor);
    }
};

/** Parcourt la liste des messages et ajoute une couronne devant le pseudo qui correspond à celui de l'auteur **/
SK.moduleConstructors.InfosPseudo.prototype.crownTopicAuthor = function() {

    //On récupère le pseudo de l'auteur
    this.getTopicAuthor(function(topicAuthor) {

        //On teste dans chaque message
        $(".bloc-pseudo-msg").each(function() {

            var $postPseudo = $(this);
            var postTextPseudo = $postPseudo.text().trim().toLowerCase();

            // Si l'auteur du message correspond à ce pseudonyme
            if (postTextPseudo === topicAuthor) {
                //Crée le div contenant l'image de la couronne et le place avant le pseudo de l'auteur du topic
                var div = document.createElement("div");
                div.className = "current-topic-author";
                $(this).prepend(div);
            }
        });
    });

};

/**
 * Masque les posts des auteurs ignorés sur la page
 */
SK.moduleConstructors.InfosPseudo.prototype.hideBlockedPosts = function() {

    for (var authorKey in this.authors) {
        // Si l'auteur fait partie des auteurs bloqué
        if (SK.Util.getValue("blockedAuthors." + authorKey)) {
            // On masque ses posts
            this.hidePostsForMessage(this.authors[authorKey].messages[0]);
        }
    }
};

/**
 * Ajoute un auteur à la liste des pseudos bloqués.
 * @param {String} authorPseudo pseudo de l'auteur à bloquer
 */
SK.moduleConstructors.InfosPseudo.prototype.addToBlockList = function(authorPseudo) {
    SK.Util.setValue("blockedAuthors." + authorPseudo, true);
};

/**
 * Supprime un auteur de la liste des pseudos bloqués.
 * @param {String} authorPseudo pseudo de l'auteur à débloquer
 */
SK.moduleConstructors.InfosPseudo.prototype.removeFromBlockList = function(authorPseudo) {
    SK.Util.deleteValue("blockedAuthors." + authorPseudo);
};

/**
 * Ajoute une class "hidden" aux posts de l'auteur passé en paramètre.
 * @param {String} authorPseudo pseudo de l'auteur à masquer
 * @param {boolean} removePost Optionnel, defaut : false. Si true,
 *                  les posts sont totalement supprimés et pas masqués
 */
SK.moduleConstructors.InfosPseudo.prototype.hidePostsForMessage = function(message) {
    if (this.getSetting("fullyHideBlockedPosts")) {
        this.togglePostsForMessage(message, "removed");
    }
    else {
        this.togglePostsForMessage(message, "hidden");
    }
};

/**
 * Supprime la class "sk-hidden" des posts de l'auteur passé en paramètre.
 * @param {String} authorPseudo pseudo de l'auteur à réafficher
 */
SK.moduleConstructors.InfosPseudo.prototype.showPostFrom = function(message) {
    this.togglePostsForMessage(message, "visible");
};

/**
 * Affiche ou masque les posts de l'auteur passés en paramètre.
 * Le bouton d'affichage ou de masquage du post est modifié en fonction de l'action
 * @param {String} authorPseudo pseudo de l'auteur à masquer ou afficher
 * @param {String} newState Nouvel état des posts "visible", "hidden", ou "removed"
 */
SK.moduleConstructors.InfosPseudo.prototype.togglePostsForMessage = function(message, newState) {

    var toToggle = this.authors[message.authorPseudo];

    if (typeof toToggle !== "undefined") {
        for (var i in toToggle.messages) {
            if (toToggle.messages.hasOwnProperty(i)) {

                var $msg = toToggle.messages[i].$msg;
                var $button = $msg.find(".sk-button-content.block");
                var $tooltip = $button.siblings(".sk-tooltip");

                switch (newState) {

                    case "visible":
                        $msg
                            .removeClass("sk-hidden")
                            .attr("title", "")
                        ;
                        $button
                            .attr("data-blocked", "0")
                            .removeClass("plus")
                            .addClass("minus")
                        ;
                        $tooltip.html("Masquer les posts de " + message.authorPseudoWithCase);
                        break;

                    case "hidden":
                        $msg
                            .addClass("sk-hidden")
                            .attr("title", "Cliquez sur le + à droite du post pour réafficher les posts de " + message.authorPseudoWithCase)
                        ;
                        $button
                            .attr("data-blocked", "1")
                            .removeClass("minus")
                            .addClass("plus")
                        ;
                        $tooltip.html("Afficher les posts de " + message.authorPseudoWithCase);
                        break;

                    case "removed":
                        $msg.remove();
                        break;
                }
            }
        }
    }
};


SK.moduleConstructors.InfosPseudo.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(
        SK.common.Pages.TOPIC_LIST,
        SK.common.Pages.TOPIC_READ
    );
};

SK.moduleConstructors.InfosPseudo.prototype.settings = {
    enableProfile: {
        title: "Bouton de profil",
        description: "Ajoute un bouton permettant d'accéder au profil de l'auteur à droite de son pseudo.",
        type: "boolean",
        default: true,
    },
    modalProfile: {
        title: "Charger le profil dans une modale",
        description: "Affiche le profil de l'auteur dans une fenêtre modale au clic.",
        type: "boolean",
        default: true,
    },
    enablePermalink: {
        title: "Bouton Permalien",
        description: "Ajoute un bouton permettant de copier directement le permalien d'un post.",
        type: "boolean",
        default: false,
    },
    enablePermalinkAnchor: {
        title: "Bouton ancre Permalien",
        description: "Ajoute un bouton ancre du permalien d'un post.",
        type: "boolean",
        default: false,
    },
    enableSearchTopics: {
        title: "Bouton de recherche des topics d'un auteur",
        description: "Ajoute un bouton permettant de rechercher les topics créés par l'utilisateur dans le forum courant.",
        type: "boolean",
        default: false,
    },
    modalAvatar: {
        title: "Charger l'avatar dans une modale",
        description: "Agrandit l'avatar de l'auteur au clic.",
        type: "boolean",
        default: true,
    },
    enableUserHighlight: {
        title: "Mise en valeur de vos messages",
        description: "Affiche votre pseudonyme en bleu pour les messages que vous avez postés.",
        type: "boolean",
        default: false,
    },
    enableAuthorHighlight: {
        title: "Mise en valeur des messages de l'auteur du topic",
        description: "Affiche une couronne devant le pseudo de tous les messages de l'auteur.",
        type: "boolean",
        default: true,
    },
    enableBlockList: {
        title: "Possibilité d'ignorer des membres",
        description: "Ajoute un bouton aux posts permettant d'ignorer un auteur. Les messages des membres ignorés ne seront pas affichés.",
        type: "boolean",
        default: false,
    },
    fullyHideBlockedPosts: {
        title: "Masquer totalement les posts ignorés",
        description: "Si cette option est activée, les posts ignorés sont supprimés totalement de la page.",
        type: "boolean",
        default: false,
    },
};

SK.moduleConstructors.InfosPseudo.prototype.getCss = function() {

    var css = "";

    //Si on met en valeur les posts de l'utilisateur
    if (this.getSetting("enableUserHighlight")) {
        css += "\
            .current-user {\
                color: " + SK.common.darkColor + " !important;\
            }\
        ";
    }

    //Si on met en valeur les posts de l'auteur
    if (this.getSetting("enableAuthorHighlight")) {
        css += "\
            .current-topic-author {\
                vertical-align: top;\
                display:inline-block;\
                width:16px;\
                height:16px;\
                background-image: url('" + GM_getResourceURL("crown") + "');\
            }\
        ";
    }

    if (this.getSetting("enableBlockList")) {
        css += "\
            .bloc-message-forum.sk-hidden .bloc-options-msg {\
                line-height: 0px !important;\
            }\
            .bloc-message-forum.sk-hidden .bloc-avatar-msg,\
            .bloc-message-forum.sk-hidden .bloc-options-msg span,\
            .bloc-message-forum.sk-hidden .bloc-contenu,\
            .bloc-message-forum.sk-hidden .bloc-date-msg,\
            .bloc-message-forum.sk-hidden .bloc-pseudo-msg,\
            .bloc-message-forum.sk-hidden .bloc-mp-pseudo,\
            .bloc-message-forum.sk-hidden .buttons-row-wrapper,\
            .bloc-message-forum.sk-hidden .sk-button:not(.block-wrapper) {\
                display: none !important;\
            }\
            .bloc-message-forum.sk-hidden .bloc-header {\
                position: relative;\
                    top: -10px;\
                height: 30px;\
                margin: 0px !important;\
                border: none !important;\
                color: #999;\
            }\
            .bloc-message-forum.sk-hidden .bloc-header::after {\
                content: \"Vous avez ignoré l'auteur de ce message\";\
                position: absolute;\
                    top: 9px;\
                    left: 1px;\
            }\
        ";
    }

    css += "\
        .sk-button-content.mp {\
            background-image: url('" + GM_getResourceURL("mp") + "');\
            background-color: #FCCB0C;\
            border-bottom-color: #C6860F;\
        }\
        .sk-button-content.searchTopics {\
            background-image: url('" + GM_getResourceURL("search-topics") + "');\
            background-color: #FFA500;\
            border-bottom-color: #8d5b00;\
        }\
        .sk-button-content.minus {\
            background-image: url('" + GM_getResourceURL("minus") + "');\
        }\
        .sk-button-content.plus {\
            background-image: url('" + GM_getResourceURL("plus") + "');\
        }\
        .sk-button-content.link {\
            background-image: url('" + GM_getResourceURL("link") + "');\
            background-color: #A3A3A3;\
            border-bottom-color: #525252;\
        }\
        .sk-button-content.anchor {\
            background-image: url('" + GM_getResourceURL("anchor") + "');\
            background-color: #777;\
            border-bottom-color: #000;\
        }\
        .sk-button-content.unknown {\
            background-image: url('" + GM_getResourceURL("unknown") + "');\
            background-position: 0px -1px;\
            background-color: #6EBD1A;\
            border-bottom-color: #4D8412;\
        }\
    ";

    return css;

};
