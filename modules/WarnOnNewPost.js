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

    //Si l'option Websocket est activée
    if(self.getSetting("useWebsocketServer")) {
        this.requestTopicUpdates();
    }
    //Pas de websocket, on switch sur le mode HTTP
    else {
        this.httpPolling(5000);
    }

};

/**
 * Ouvre une connexion au serveur de sockets pour demander des notifications
 * de mise à jour du topic courant.
 */
SK.moduleConstructors.WarnOnNewPost.prototype.requestTopicUpdates = function() {

    var client = SK.modules.SocketConnection;

    //Quand on reçoit une mise à jour des infos du topic
    client.addOnMessageListener("topicInfos", function(topicInfos) {

        var playSound = this.getSetting("playSoundOnNewPost");

        //En cas de lock, on affiche une erreur dans le favicon
        if(topicInfos.locked) {
            this.faviconUpdater.showFaviconError();
        }
        //Sinon, c'est que le nombre de posts a changé : on le met à jour et
        //on affiche la différence dans le favicon
        else {
            //Cas de la réception initiale des infos
            if (this.initialPostCount === 0) {
                this.initialPostCount = topicInfos.postCount;
                playSound = false;
            }

            var postDifference = topicInfos.postCount - this.initialPostCount;

            if(postDifference !== 0) {
                this.faviconUpdater.showFaviconCount(postDifference);
            }
        }

        if(playSound) {
            this.notificationSound.play();
        }

    }.bind(this));

    client.addOnConnectListener(function() {
        //On demande des notifications de mise à jour au serveur
        client.sendMessage("startFollowingTopic", SK.common.topicId);
    });

    //En cas d'erreur, on affiche une notif rouge (pour différencier des topics lockés)
    client.addOnCloseListener(function() {

        //Timeout de trois secondes pour éviter les erreurs au rechargement de la page
        setTimeout(function() {
            this.faviconUpdater.showExclamationMark();
        }.bind(this), 3000);

    }.bind(this));

};

/**
 * Check régulièrement le nombre de posts du topic pour informer
 * l'utilisateur des nouveaux posts.
 */
SK.moduleConstructors.WarnOnNewPost.prototype.httpPolling = function(checkingInterval) {

        //On récupère les infos initiales du topic
        this.getPostCount(SK.common.topicId, function(postCount) {

            this.initialPostCount = postCount;

            //On récupère de nouveau les infos du topic à intervale régulier
            setInterval(function() {

                this.getPostCount(SK.common.topicId, function(newPostCount) {
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
SK.moduleConstructors.WarnOnNewPost.prototype.getPostCount = function(topicId, callback) {

    SK.Util.apiHelper.topicInfos(topicId, function(topicInfos) {

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
    useWebsocketServer: {
        title: "Utiliser le nouveau serveur de Websocket",
        description: "Passe par le nouveau serveur pour récupérer les infos des topics. (désactivé car trop instable)",
        type: "boolean",
        disabled: true,
        default: false,
    }
};

SK.moduleConstructors.WarnOnNewPost.prototype.shouldBeActivated = function() {
    return SK.Util.currentPageIn(SK.common.Pages.TOPIC_READ);
};
