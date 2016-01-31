"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * LastPage : Ce module permet d'accéder à la dernière page d'un topic
 * directement depuis la liste des sujets et de mettre en favoris un
 * lien pointant toujours vers la dernière page d'un topic.
 */
SK.moduleConstructors.LastPage = SK.Module.new();

SK.moduleConstructors.LastPage.prototype.id = "LastPage";
SK.moduleConstructors.LastPage.prototype.title = "Dernière page";
SK.moduleConstructors.LastPage.prototype.description = "Permet d'accéder à la dernière page d'un topic directement depuis la liste des sujets et de conserver un lien vers la dernière page en favoris.";

/**
 * Initialise le module, fonction appelée quand le module est chargé
 */
SK.moduleConstructors.LastPage.prototype.init = function() {
    // Ajoute un lien vers la dernière page du topic
    if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST)) {
        this.addLastPageLinks();
    }

    // Si on est sur la page lecture et que lastPageBookmarkLink est activé
    else if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ) && this.getSetting("lastPageBookmarkLink")) {

        //Si le hash #last-page est présent, on switch à la dernière page
        if (location.hash === "#last-page") {

            // On scrolle sur la dernière page
            var reloadToLastPage = this.goToLastPageIfPossible();

            //Si on est déjà sur la dernière page, on va au dernier post
            if(!reloadToLastPage) {
                this.scrollToLastPost();
            }
        }

        // On ajoute un bouton "lien vers la dernière page"
        $(".titre-head-bloc").prepend(new SK.Button({
            text: document.title,
            class: "last-page-bookmark-link minor link",
            href: "#last-page",
            wrapper: {
                class: "last-page-link-wrp",
            },
            tooltip: {
                text: "Copier le lien vers le dernier post de ce topic",
            },
            click: function(event) {
                event.preventDefault();
                GM_setClipboard(location.href + $(this).attr("href"));
            }
        }));

        // On permets aux tooltips de dépasser, sauf quand on vient de créer le topic
        if ($("[data-modif-titre-sujet]").length === 0) {

            $(".titre-head-bloc").css({
                overflow: "visible",
                "margin-bottom": "26px",
            });
        }
    }
};

/**
 * Ajoute le lien vers la dernière page du topic sur l'icone du sujet
 */
SK.moduleConstructors.LastPage.prototype.addLastPageLinks = function() {

    var self = this;

    //On parcourt la liste des topics
    $(".topic-list li:not(.topic-head)").each(function() {

        var $topic = $(this);

        var POST_PER_PAGE = 20;

        //Nombre de posts
        var postCount = parseInt($topic.find(".topic-count").text().trim());

        //Nombre de pages
        var pageCount = Math.floor(postCount / POST_PER_PAGE + 1);

        var topicLink = $topic.find(".topic-title").attr("href");

        //Dans le lien, on remplace le numéro de la page par la dernière page
        var lastPageLink = topicLink.replace(/(\/forums\/[\d]*-[\d]*-[\d]*-)[\d]*(-.*)/, "$1" + pageCount + "$2");

        //Si lastPageBookmarkLink est activé, on ajoute le hash #last-page au lien pour que
        //celui-ci pointe toujours vers la dernière page

        if (self.getSetting("lastPageBookmarkLink")) {
            lastPageLink += "#last-page";
        }

        //On ajoute le lien dernière page à l'icone des topics
        $topic.find(".topic-img").wrap($("<a>", {
            class: "last-page-link",
            href: lastPageLink,
            title: "Accéder à la dernière page du sujet"
        }));
    });
};

/**
 * Scrolle la page au dernier message.
 */
SK.moduleConstructors.LastPage.prototype.scrollToLastPost = function() {
    $(".bloc-message-forum").last().scrollThere();
};

/**
 * Si on n'est pas déjà sur la dernière page (bouton présent),
 * on va sur cette dernière page.
 * Sinon, retourne false
 */
SK.moduleConstructors.LastPage.prototype.goToLastPageIfPossible = function() {

    var lastPageUrl = $(".pagi-fin-actif").first().attr("href");

    if(typeof lastPageUrl !== "undefined") {
        location.href = $(".pagi-fin-actif").first().attr("href") + "#last-page";
        return true;
    }
    else {
        return false;
    }
};

/**
 * Options configurables du plugin.
 * Ces options apparaitront dans le panneau de configuration de SpawnKill
 */
SK.moduleConstructors.LastPage.prototype.settings = {
    showIndicator: {
        title: "Ajout d'un indicateur",
        description: "Ajout d'une flèche à droite de l'image du topic pour indiquer l'intéractivité.",
        type: "boolean",
        default: true,
    },
    lastPageBookmarkLink: {
        title: "Raccourci vers le dernier post depuis le topic",
        description: "Ajoute un bouton qui permet de copier le lien vers le dernier post du topic à gauche de son titre.",
        type: "boolean",
        default: false,
    },
};


/**
 * Le script est exécuté sur la liste des sujets
 */
SK.moduleConstructors.LastPage.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST, SK.common.Pages.TOPIC_READ);
};

/**
 * Retourne le CSS à injecter si le plugin est activé.
 * Par défaut, aucun CSS n'est injecté.
 */
SK.moduleConstructors.LastPage.prototype.getCss = function() {

    var css = "";

    if (this.getSetting("showIndicator")) {
        css += "\
            .titre-topic {\
                margin-left: 32px !important;\
            }\
            a.last-page-link::after {\
              content: \"\";\
              display: block;\
              position: absolute;\
                left: 20px;\
                top: 4px;\
              border: solid 4px transparent;\
              border-left-color: #999;\
            }\
            a.last-page-link:hover::after {\
              border-left-color: #000;\
            }\
        ";
    }

    if (this.getSetting("lastPageBookmarkLink")) {
        css += "\
            .titre-bloc-forum {\
                display: inline-block;\
                width: calc(100% - 30px) !important;\
            }\
            .sk-button .last-page-bookmark-link {\
                font-size: 0px;\
            }\
            .last-page-link-wrp {\
                float: left;\
                margin-right: 6px;\
                margin-top: 1px;\
            }\
            .sk-button-content.link {\
                background-image: url('" + GM_getResourceURL("link") + "');\
                background-color: #A3A3A3;\
                border-bottom-color: #525252;\
            }\
        ";
    }

    return css;
};
