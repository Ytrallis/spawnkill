"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

SK.moduleConstructors.BetterSurveys = SK.Module.new();

SK.moduleConstructors.BetterSurveys.prototype.id = "BetterSurveys";
SK.moduleConstructors.BetterSurveys.prototype.title = "Sondages à plus de 5 réponses";
SK.moduleConstructors.BetterSurveys.prototype.description = "Possibilité d'ajouter des sondages ayant jusqu'à 10 réponses possibles";
SK.moduleConstructors.BetterSurveys.prototype.required = false;

SK.moduleConstructors.BetterSurveys.prototype.maxNumberOfChoices = 10;

SK.moduleConstructors.BetterSurveys.prototype.init = function() {
    this.addMoreChoices();
};

SK.moduleConstructors.BetterSurveys.prototype.addMoreChoices = function() {

    var self = this;

    // Lors du clic sur le bouton "ajouter un sondage", on ajoute un attribut "data-id" aux 2 premières réponses
    // afin de pouvoir éventuellement les supprimer correctement par la suite
    $("button.btn-ajouter-sondage").click(function() {

        var $sondageForm = $("div#topic_sondage_form");

        if($sondageForm.find("div.form-group").length === 3) {
            $sondageForm.find("div.form-group:nth-child(2)").attr("data-id", "1");
            $sondageForm.find("span.href-delete-reponse:first").attr("data-id", "1");

            $sondageForm.find("div.form-group:last").attr("data-id", "2");
            $sondageForm.find("span.href-delete-reponse:last").attr("data-id", "2");
        }
    });

    // Une variable permettant de donner des attributs "data-id" uniques
    var divId = 3;

    $("span.href-ajouter-reponse").click(function() {

        var $sondageForm = $("div#topic_sondage_form");
        var numberOfChoices = $sondageForm.find(".form-group").length - 1;

        // On limite le nombre de choix
        if (numberOfChoices < self.maxNumberOfChoices) {

            // Lors du clic sur le bouton "ajouter une réponse", on ajoute manuellement un div.form-group contenant un input
            $($sondageForm.find(".form-group:last")[0].outerHTML).insertAfter($sondageForm.find(".form-group:last"));
            $("div.form-group:last").attr("data-id", divId);

            var $deleteResponse = $("span.href-delete-reponse");

            $deleteResponse.last().attr("data-id", divId);
            $deleteResponse.off("click");
            $deleteResponse.click(function() {
                // On permet la suppression de ce div seulement s'il y a au moins 3 réponses
                if($sondageForm.find(".form-group").length > 3) {
                    $sondageForm.find(".form-group[data-id='" + $(this).attr("data-id") + "']").remove();
                }
            });

            divId++;
        }

        return false; // Permet d'éviter l'action normale du bouton "ajouter une réponse"
    });
};

/**
 * Ce module n'est exécuté que sur la liste des sujets
 */
SK.moduleConstructors.BetterSurveys.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST);
};
