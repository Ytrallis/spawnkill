"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * Shortcuts: Ajoute des raccourcis aux forums
 * Ctrl + flèche gauche : Page précédente
 * Ctrl + flèche droite : Page suivante
 */
SK.moduleConstructors.Shortcuts = SK.Module.new();

SK.moduleConstructors.Shortcuts.prototype.id = "Shortcuts";
SK.moduleConstructors.Shortcuts.prototype.title = "Raccourcis clavier";
SK.moduleConstructors.Shortcuts.prototype.description = "Ajoute des raccourcis clavier pour naviguer plus rapidement";

SK.moduleConstructors.Shortcuts.prototype.init = function() {

    /**
     * Analyse des touches utilisées par l'utilisateur et appel de la fonction suivant le raccourci utilisé
     */
    $(window).keydown(function(event) {

        var LEFT_ARROW_KEY = 37,
            UP_ARROW_KEY = 38,
            RIGHT_ARROW_KEY = 39,
            DOWN_ARROW_KEY = 40,
            // ENTER_KEY = 13,
            SPACE_KEY = 32,
            ESCAPE_KEY = 27,
            QUESTION_MARK_KEY = 188,
            F_CHAR_KEY = 70;

        // Si l'on se trouve dans un champ de texte, on désactive les raccourcis
        var target = event.target || event.srcElement;
        if (target.tagName === "TEXTAREA" || (target.tagName === "INPUT" && target.type === "text")) {
            return;
        }

        //Page lecture d'un topic ou page liste des sujets
        if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ) || SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST)) {

            //Ctrl + Shift + fleche gauche -> Première page
            if (event.ctrlKey && event.shiftKey && event.keyCode === LEFT_ARROW_KEY) {
                event.preventDefault();
                $(".pagi-debut-actif").addClass("sk-outline").get(0).click();
                return;
            }

            //Ctrl + Shift + fleche droite -> Dernière page
            if (event.ctrlKey && event.shiftKey && event.keyCode === RIGHT_ARROW_KEY) {
                event.preventDefault();
                $(".pagi-fin-actif").addClass("sk-outline").get(0).click();
                return;
            }

            //Ctrl + fleche gauche -> page précedente
            if (event.ctrlKey && event.keyCode === LEFT_ARROW_KEY) {
                event.preventDefault();
                $(".pagi-precedent-actif").addClass("sk-outline").get(0).click();
                return;
            }

            //Ctrl + fleche droite -> page suivante
            if (event.ctrlKey && event.keyCode === RIGHT_ARROW_KEY) {
                event.preventDefault();
                $(".pagi-suivant-actif").addClass("sk-outline").get(0).click();
                return;
            }

            //Seulement page lecture d'un topic
            if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ)) {

                //Ctrl + flèche haut -> Retour liste des sujets
                if (event.ctrlKey && event.keyCode === UP_ARROW_KEY) {
                    event.preventDefault();
                    $(".btn-actu-new-list-forum:contains(Liste des sujets)").addClass("sk-btn-hilight").get(0).click();
                    return;
                }

                //Ctrl + Espace -> Répondre
                if (event.ctrlKey && event.keyCode === SPACE_KEY) {
                    event.preventDefault();
                    $(".btn-repondre-msg").get(0).click();
                    return;
                }
            }

            //Seulement Page liste des sujets
            else if (SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST)) {

                //Ctrl + Espace -> Nouveau topic
                if (event.ctrlKey && event.keyCode === SPACE_KEY) {
                    event.preventDefault();
                    $(".btn-actu-new-list-forum:contains(Nouveau sujet)").get(0).click();
                    return;
                }

                //Ctrl + F -> Focus Recherche
                if (event.ctrlKey && event.keyCode === F_CHAR_KEY) {
                    event.preventDefault();
                    $("body").scrollThere();
                    $("#search_in_forum").focus();
                    return;
                }
            }
        }


        //Sur toutes les pages

        // Ctrl + ? : Affichage des raccourcis claviers disponibles
        if (event.ctrlKey && event.keyCode === QUESTION_MARK_KEY) {
            SK.modules.Shortcuts.showShortcutsOverlay();
        }

        //Si le module Settings est activé, Ctrl + down -> Configuration
        if (SK.modules.Settings.activated && event.ctrlKey && event.keyCode === DOWN_ARROW_KEY) {
            SK.modules.Settings.showSettings();
        }

        //S'il y a des fenêtres modales ouvertes, Escape -> Ferme les modales
        if ($(".modal-box").length > 0 && event.keyCode === ESCAPE_KEY) {
            SK.Util.hideModal();
        }

    });
};

/**
 * Affiche un overlay indiquant les raccourcis claviers disponibles
 * si l'overlay n'est pas déjà affiché à l'écran
 */
SK.moduleConstructors.Shortcuts.prototype.showShortcutsOverlay = function() {

    if ($("#shortcuts-modal").length === 0) {
        // On ferme d'abord toutes les modales
        SK.Util.hideModal(false);

        SK.Util.showModal(new SK.Modal({
            id: "shortcuts-modal",
            location: "center",
            title: "Raccourcis disponibles",
            content: "\
                <h4>Général</h4>\
                <ul class='shortcut-list' >\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Bas</span>\
                        </span>\
                        Ouvrir les paramètres\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Echap</span>\
                        </span>\
                        Ferme les fenêtres modales\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >?</span>\
                        </span>\
                        Ouvrir ce panneau\
                    </li>\
                </ul>\
                <h4>Sur la liste des sujets</h4>\
                <ul class='shortcut-list' >\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Gauche</span>\
                        </span>\
                        Page précédente\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Droite</span>\
                        </span>\
                        Page suivante\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Espace</span>\
                        </span>\
                        Nouveau topic\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >F</span>\
                        </span>\
                        Rechercher\
                    </li>\
                </ul>\
                <h4>Sur un topic</h4>\
                <ul class='shortcut-list' >\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Gauche</span>\
                        </span>\
                        Page précédente\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Droite</span>\
                        </span>\
                        Page suivante\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Maj</span> + <span class='key' >Gauche</span>\
                        </span>\
                        Première page\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Maj</span> + <span class='key' >Droite</span>\
                        </span>\
                        Dernière page\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Espace</span>\
                        </span>\
                        Répondre au topic\
                    </li>\
                    <li class='shortcut' >\
                        <span class='keys' >\
                            <span class='key' >Ctrl</span> + <span class='key' >Haut</span>\
                        </span>\
                        Retour à la liste des sujets\
                    </li>\
                </ul>\
            ",
        }));
    }
};

SK.moduleConstructors.Shortcuts.prototype.settings = {
    showShortcutsOverlay: {
        title: "Affiche les raccourcis claviers disponibles",
        description: "Affiche un overlay indiquant les raccourcis disponibles.",
        type: "button",
        buttonLabel: "Voir les raccourcis",
        default: function() {
            SK.modules.Shortcuts.showShortcutsOverlay();
        },
    },
};

SK.moduleConstructors.Shortcuts.prototype.getCss = function() {

    var css = "\
        .sk-outline {\
            outline: solid 3px " + SK.common.mainColor + " !important;\
        }\
        .sk-btn-hilight {\
            background-color: " + SK.common.mainColor + " !important;\
            border: solid 1px " + SK.common.mainColor + " !important;\
        }\
        #shortcuts-modal {\
            padding: 10px 0px;\
        }\
        #shortcuts-modal h3 {\
            padding: 0px 10px;\
        }\
        #shortcuts-modal .content {\
            padding: 0px 10px;\
            font-size: 1.2em;\
            color: #666;\
        }\
        #shortcuts-modal .shortcut-list {\
            margin: 5px 10px;\
            line-height: 1.6em;\
        }\
        #shortcuts-modal .keys {\
            display: inline-block;\
            width: 160px;\
        }\
        #shortcuts-modal .key {\
            font-family: monospace, monospace;\
            font-size: 0.9em;\
            color: " + SK.common.darkColor + ";\
            opacity: 0.7;\
        }\
        #shortcuts-modal h4 {\
            margin-top: 16px;\
            color: #333;\
        }\
    ";

    return css;
};
