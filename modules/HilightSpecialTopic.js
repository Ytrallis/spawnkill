"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * HilightSpecialTopic : met en valeur les topics sans réponses et les topics importants
 *
 */
SK.moduleConstructors.HilightSpecialTopic = SK.Module.new();

SK.moduleConstructors.HilightSpecialTopic.prototype.id = "HilightSpecialTopic";
SK.moduleConstructors.HilightSpecialTopic.prototype.title = "Mise en avant des topics particuliers";
SK.moduleConstructors.HilightSpecialTopic.prototype.description = "Les nouveaux topics apparaissent en bleu et les gros topics apparaissent en rouge sombre";

SK.moduleConstructors.HilightSpecialTopic.prototype.init = function() {
    this.hilightSpecialTopics();
};

/**
 * Change l'icone des topics avec 0 post et ceux de +5000 posts
 */
SK.moduleConstructors.HilightSpecialTopic.prototype.hilightSpecialTopics = function() {

    var self = this;

    $(".topic-list .topic-count").each(function() {

        var $postCount = $(this);

        self.queueFunction(function() {

            var postCount = parseInt($postCount.html().trim());
            // Topics vides
            if (postCount === 0 && self.getSetting("hilightEmptyTopics")) {
                $postCount.parent().find("img[src='/img/forums/topic-dossier1.png']")
                    .attr("src", GM_getResourceURL("newTopic"))
                    .addClass("new-topic");
            }
            // Topics importants
            else if (postCount >= 5000 && self.getSetting("hilightBigTopics")) {
                $postCount.parent().find("img[src='/img/forums/topic-dossier2.png']")
                    .attr("src", GM_getResourceURL("bigTopic"))
                    .addClass("big-topic");
            }

        }, this);
    });
};

SK.moduleConstructors.HilightSpecialTopic.prototype.settings = {
    hilightEmptyTopics: {
        title: "Topics bleus : 0 post",
        description: "Les topics vides sont affichés en bleu",
        type: "boolean",
        default: true,
    },
    hilightBigTopics: {
        title: "Topics foncés : 5000 posts ou plus",
        description: "Les topics de plus de 5000 posts sont affichés en rouge foncé",
        type: "boolean",
        default: true,
    },
};

SK.moduleConstructors.HilightSpecialTopic.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST);
};
