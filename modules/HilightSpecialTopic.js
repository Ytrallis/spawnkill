"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * HilightSpecialTopic : met en valeur les topics sans réponses
 *
 */
SK.moduleConstructors.HilightSpecialTopic = SK.Module.new();

SK.moduleConstructors.HilightSpecialTopic.prototype.id = "HilightSpecialTopic";
SK.moduleConstructors.HilightSpecialTopic.prototype.title = "Mise en avant des nouveaux topics";
SK.moduleConstructors.HilightSpecialTopic.prototype.description = "Les nouveaux topics apparaissent en bleu dans la liste des sujets";

SK.moduleConstructors.HilightSpecialTopic.prototype.init = function() {
    this.HilightSpecialTopic();
};

/* Change l'icone des topics avec 0 posts */
SK.moduleConstructors.HilightSpecialTopic.prototype.HilightSpecialTopic = function() {

    var self = this;

    $("#table-liste-topic-forum .nb-reponse-topic").each(function() {

        var $postCount = $(this);

        self.queueFunction(function() {

            if (parseInt($postCount.html().trim()) === 0) {
                //On remplace l'image du topic, sauf si c'est une épingle
                $postCount.parent().find("img[src='/img/forums/topic-dossier1.png']")
                    .attr("src", GM_getResourceURL("newTopic"))
                    .addClass("new-topic");
            }

        }, this);
    });
};


SK.moduleConstructors.HilightSpecialTopic.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST);
};
