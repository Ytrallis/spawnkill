"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/**
 * WarnOnNewPost : Permet de savoir quand un nouveau message a été posté dans un topic sans recharger la page
 */
SK.moduleConstructors.WarnOnNewPost = SK.Module.new();

SK.moduleConstructors.WarnOnNewPost.prototype.id = "WarnOnNewPost";
SK.moduleConstructors.WarnOnNewPost.prototype.title = "Indiquer les nouveaux posts";
SK.moduleConstructors.WarnOnNewPost.prototype.description = "Indique le nombre de nouveaux messages postés depuis que la page a chargé dans le titre de l'onglet";

//Nombre de posts au chargement
SK.moduleConstructors.WarnOnNewPost.prototype.initialPostCount = 0;

//Nombre de posts au dernier chargement
SK.moduleConstructors.WarnOnNewPost.prototype.lastPostCount = 0;

SK.moduleConstructors.WarnOnNewPost.prototype.faviconUpdater = null;
SK.moduleConstructors.WarnOnNewPost.prototype.notificationSound = null;

SK.moduleConstructors.WarnOnNewPost.prototype.init = function() {

    var self = this;

    this.faviconUpdater = new SK.FaviconNotificationUpdater(location.protocol + "//www.jeuxvideo.com/favicon.ico");

    //Si les notifications sonores sont activées, on charge le son en mémoire
    if(self.getSetting("playSoundOnNewPost")) {
        this.notificationSound = $("<audio>", {
            html: "<source src='" + GM_getResourceURL("notification") + "' type='audio/ogg'>"
        }).get(0);
    }

    this.httpPolling(5000);

};

/**
 * Check régulièrement le nombre de posts du topic pour informer
 * l'utilisateur des nouveaux posts.
 */
SK.moduleConstructors.WarnOnNewPost.prototype.httpPolling = function(checkingInterval) {

    //On récupère les infos initiales du topic
    this.getPostCount(function(postCount) {

        this.initialPostCount = postCount;

        //On récupère de nouveau les infos du topic à intervale régulier
        setInterval(function() {

            this.getPostCount(function(newPostCount) {
                //Si le nombre de posts est différent, on met à jour le titre de la page

                //Si newPostCount === -1, il y a eu une erreur
                if(newPostCount !== -1) {
                    if(this.lastPostCount !== newPostCount && this.initialPostCount !== newPostCount) {

                        var postDifference = newPostCount - this.initialPostCount;
                        if(isNaN(postDifference)) {
                            this.faviconUpdater.showFaviconError();
                        }
                        else {
                            this.faviconUpdater.showFaviconCount(newPostCount - this.initialPostCount);
                            this.lastPostCount = newPostCount;
                            if(this.getSetting("playSoundOnNewPost")) {
                                this.notificationSound.play();
                            }
                        }

                    }
                }

            }.bind(this));

        }.bind(this), checkingInterval);
    }.bind(this));
};

/**
 * Récupère le nombre de posts du topic via l'API JVC.
 * Appelle la fonction de callback avec le nombre de posts en arguments.
 */
SK.moduleConstructors.WarnOnNewPost.prototype.getPostCount = function(callback) {

    SK.Util.apiHelper.topicInfos(function(topicInfos) {
        //En cas d'erreur, on n'appelle pas le callback
        if (typeof topicInfos === "undefined") {
            return;
        }
        callback(topicInfos.postCount);

    }, false);

};

SK.moduleConstructors.WarnOnNewPost.prototype.settings = {
    playSoundOnNewPost: {
        title: "Jouer un son quand un nouveau post est ajouté",
        description: "Joue un son de notification quand un post est ajouté au topic après le chargement de la page.",
        type: "boolean",
        default: false,
    },
};

SK.moduleConstructors.WarnOnNewPost.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ);
};
