"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * PemtHighlight: Met en valeur les posts simultanés
 */
SK.moduleConstructors.PemtHighlight = SK.Module.new();

SK.moduleConstructors.PemtHighlight.prototype.id = "PemtHighlight";
SK.moduleConstructors.PemtHighlight.prototype.title = "Mise en avant des PEMT";
SK.moduleConstructors.PemtHighlight.prototype.description = "Met en valeur les posts simultanés";

/**
 * Initialise le module, fonction appelée quand le module est chargé
 */
SK.moduleConstructors.PemtHighlight.prototype.init = function() {

    //Crée un tableau contenant les dates du topic
    var $dates = $(".bloc-date-msg .lien-jv");

    var dates = [];

    $dates.each(function() {
        dates.push($(this).text());
    });

    var results = [];

    //Boucle de test de PEMT
    // Pas besoin de tester le dernier post puisqu'il n'a pas de post suivant
    for (var i = 0; i < dates.length - 1; i++) {
        //Si la date est similaire à celle du post suivant
        if (dates[i] === dates[i + 1]) {
            //Alors on l'ajoute au tableau des PEMT
            results.push(dates[i]);
        }
    }
    //Si le tableau des PEMT n'est pas vide
    if (results.length > 0) {

        //On teste les PEMT sur chaque dates
        $(".bloc-date-msg .lien-jv").each(function() {

            //Pour chaque PEMT
            for (i = 0; i < results.length; i++) {

                var re = new RegExp(results[i]);

                //On teste si certaines dates ont la date d'un PEMT
                if (re.test($(this).text())) {
                    var $date = $(this);
                    var fullDateHtml = $date.html().trim();
                    //Si oui, on colorie la date avec la couleur principale
                    $date.html(fullDateHtml.replace(/(\d{2}:\d{2}:\d{2})/, "<span class='pemt-highlight'>$1</span>"));
                }
            }
        });
    }
};

/**
 * Méthode testant si un Module doit être activé.
 * peut-être redéfinie.
 * Par défaut le module est toujours activé
 */
SK.moduleConstructors.PemtHighlight.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ);
};

/**
 * Retourne le CSS à injecter si le plugin est activé.
 * Par défaut, aucun CSS n'est injecté.
 */
SK.moduleConstructors.PemtHighlight.prototype.getCss = function() {

    var css = "\
        .pemt-highlight {\
            color: " + SK.common.mainColor + " !important;\
        }\
        .lien-jv:hover .pemt-highlight {\
            color: #FF4000 !important;\
        }\
    ";

    return css;
};
