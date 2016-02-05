"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * Quote : Plugin de citation
 */
SK.moduleConstructors.Quote = SK.Module.new();

SK.moduleConstructors.Quote.prototype.id = "Quote";
SK.moduleConstructors.Quote.prototype.title = "Citations";
SK.moduleConstructors.Quote.prototype.description = "Permet de citer un message de manière propre simplement en cliquant sur un bouton \"citer\".";

SK.moduleConstructors.Quote.prototype.init = function() {

    // Citations partielles
    if(this.getSetting("partialQuote")) {
        this.initPartialQuote();
    }
};

/**
 * Ajoute une fonction de citation partielle d'un message quand un utilisateur
 * sélectionne une partie du texte d'un post
 */
SK.moduleConstructors.Quote.prototype.initPartialQuote = function() {

    var self = this;

    //Suppression des boutons de citations existants au mouseup
    $(document).on("mouseup", function() {
        // Mise en file pour laisser le temps au click event de s'exécuter
        // Si vous avez un meilleur moyen de faire ça, faites moi signe :)
        window.setTimeout(function() {

            //On supprime le bouton après la transition CSS
            $(".partial-quote")
                .on("transitionend webkitTransitionEnd oTransitionEnd", function() {
                    $(this).remove();
                })
                .removeClass("active");

        }, 0);
    });

    //bind de l'evenement au mouse up sur un post
    $(".conteneur-messages-pagi").on("mouseup", ".bloc-message-forum", function(event) {

        // On affiche le bouton de citation partielle.
        // Le délai permet d'éviter qu'il soit supprimé sur le champ et laisse le navigateur
        // retirer la sélection
        window.setTimeout(function() {

            var selectionText = SK.Util.getPostSelection();
            var $post = $(this).find(".txt-msg");
            var message = new SK.Message($post.parents(".bloc-message-forum"));

            //On supprime les liens noelshacks (qui posent problème à cause des miniatures)
            var comparableMessageText = message.text.replace(/http:\/\/www.noelshack.com\/(\d+)-(\d+)-([^\.]+\..{3})/g, "");
            comparableMessageText = comparableMessageText.replace(/http:\/\/image.noelshack.com\/fichiers\/(\d+)\/(\d+)\/([^\.]+\..{3})/g, "");
            var comparableSelectionText = selectionText.replace(/http:\/\/image.noelshack.com\/fichiers\/(\d+)\/(\d+)\/([^\.]+\..{3})/g, "");
            comparableSelectionText = comparableSelectionText.replace(/http:\/\/image.noelshack.com\/fichiers\/(\d+)\/(\d+)\/([^\.]+\..{3})/g, "");

            //De plus, on compare sans les espaces pour éviter les problèmes causés par les espace avant/après les images
            comparableMessageText = comparableMessageText.replace(/\s/g, "");
            comparableSelectionText = comparableSelectionText.replace(/\s/g, "");

            // Si la sélection est vide, ou que le texte sélectionné ne fait pas entièrement
            // partie du post, on n'affiche pas le bouton
            if (selectionText === "" || comparableMessageText.indexOf(comparableSelectionText) === -1) {
                return;
            }

            //On affiche le bouton de citation partielle
            self.addPartialQuoteButton(message, selectionText, event.pageX, event.pageY);

        }.bind(this), 100);

    });
};


/**
 * Crée et ajoute au message passé en paramètre un bouton de citation partielle.
 * Il sera positionné juste en dessous de la souris (coordonnées passées en paramètre)
 */
SK.moduleConstructors.Quote.prototype.addPartialQuoteButton = function(message, selectionText, mouseX, mouseY) {

    var self = this;

    var $partialQuoteButton = new SK.Button({
        class: "quote",
        index: 100,
        tooltip: {
            text: "Citer cette partie du message",
            position: "bottom"
        },
        wrapper: {
            class: "partial-quote"
        },
        click: function() {
            //On récupère le post de l'auteur et on remplace le texte de son message par la partie
            //sélectionnée avant de citer le message
            message.text = selectionText;
            var citationBlock = self.createCitationBlock(message);

            self.doQuotePost(citationBlock);
        }
    });

    //On ajoute le bouton de citation juste en dessous de la souris

    //On calcule la position relative de la souris par rapport au post
    var postPosition = message.$msg.offset();
    var relativeMouseX = mouseX - postPosition.left;
    var relativeMouseY = mouseY - postPosition.top;

    $partialQuoteButton.css({
        left: (relativeMouseX - 16) + "px",
        top: (relativeMouseY + 16) + "px"
    });

    //On supprime tous les boutons existants avant d'en ajouter un nouveau
    $(".partial-quote").remove();

    //On ajoute/anime le bouton
    message.$msg.prepend($partialQuoteButton);
    SK.Util.fetchStyle($partialQuoteButton);
    $partialQuoteButton.addClass("active");

};

/* Ajoute le bloc de citation passé en paramètre au formulaire de réponse. */
SK.moduleConstructors.Quote.prototype.doQuotePost = function(citationBlock) {

    this.addToResponseThenFocus(citationBlock);
};

/* Ajoute le texte passé en paramètre à la fin de la réponse. */
SK.moduleConstructors.Quote.prototype.addToResponse = function(text) {

    var currentResponse = $("#message_topic").val();

    //On passe une ligne si la réponse n'est pas vide
    if(currentResponse.trim() !== "") {
        text = "\n" + text;

        //On en passe deux s'il n'y a pas de passage à la ligne à la fin
        if(currentResponse.slice(-1) !== "\n") {
            text = "\n" + text;
        }
    }

    $("#message_topic").val(currentResponse + text);
};

/* Crée un bloc de citation à partir du Message passées en paramètre */
SK.moduleConstructors.Quote.prototype.createCitationBlock = function(message) {

    var lines = message.text.split("\n");

    $.each(lines, function(i, line) {
        lines[i] = "> " + line;
    }.bind(this));
    lines.splice(0, 0, "> Le " + message.date + " à " + message.time + " '''" + message.authorPseudoWithCase + "''' a écrit :");
    lines.push("\n");

    //On n'autorise pas les sauts de ligne consécutifs dans les citations
    var quote = lines.join("\n");

    return quote;
};

/* Crée une citation dans la réponse à partir du texte passé en paramètre
 * et scroll vers la boîte de réponse. */
SK.moduleConstructors.Quote.prototype.addToResponseThenFocus = function(citationBlock) {
    this.addToResponse(citationBlock);

    var $responseBox = $("#message_topic");

    //Scrolling vers la réponse
    $responseBox.scrollThere();

    //Focus sur la réponse
    $responseBox.focusWithoutScrolling();

    //On force le curseur à la fin du textarea
    var response = $responseBox.val();
    $responseBox.val("");
    $responseBox.val(response);
    $responseBox.keyup();

    //Scroll tout en bas du textarea
    $responseBox.scrollTop($responseBox[0].scrollHeight - $responseBox.height());

};

/* Options modifiables du plugin */
SK.moduleConstructors.Quote.prototype.settings = {
    partialQuote: {
        title: "Citations partielles",
        description: "Permet de ne citer qu'une partie d'un post en sélectionnant le texte avec la souris.",
        type: "boolean",
        default: true,
    },
};

SK.moduleConstructors.Quote.prototype.shouldBeActivated = function() {
    /* On affiche le bloc de citation sur la page réponse et les pages de lecture */
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ);
};

SK.moduleConstructors.Quote.prototype.getCss = function() {
    var css = "";

    var mainColor = SK.common.mainColor;

    if (this.getSetting("partialQuote")) {
        css += "\
            .sk-button-content.quote {\
                background-image: url('" + GM_getResourceURL("quote") + "');\
                background-position: -1px -1px;\
            }\
            .conteneur-message .txt-msg::-moz-selection,\
            .conteneur-message .txt-msg *::-moz-selection {\
                background-color: " + mainColor + ";\
                color: #FFF;\
            }\
            .conteneur-message .txt-msg::selection,\
            .conteneur-message .txt-msg *::selection {\
                background-color: " + mainColor + ";\
                color: #FFF;\
            }\
            .conteneur-message .txt-msg blockquote *::-moz-selection,\
            .conteneur-message .txt-msg blockquote::-moz-selection {\
                background-color: #888;\
            }\
            .conteneur-message .txt-msg blockquote *::selection,\
            .conteneur-message .txt-msg blockquote::selection {\
                background-color: #888;\
            }\
            .partial-quote {\
                position: absolute;\
                font-size: 0 !important;\
                opacity: 0.2;\
                transform: scale(0.2);\
                transition-duration: 200ms;\
                transition-property: opacity transform;\
                box-shadow: 1px 1px 2px -1px rgba(0, 0, 0, 0.5);\
                z-index: 200;\
            }\
            .partial-quote.active {\
                opacity: 1;\
                transform: scale(1);\
            }\
            .partial-quote::after {\
                content: \"\";\
                position: absolute;\
                top: -15px;\
                border: solid 8px transparent;\
                display: block;\
                border-bottom-color: " + mainColor + ";\
            }\
            .partial-quote:active::after {\
                top: -14px;\
            }\
        ";
    }

    return css;
};
