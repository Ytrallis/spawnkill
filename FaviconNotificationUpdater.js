"use strict";

/**
 * Permet d'ajouter et de mettre à jour une notification dans le favicon.
 */
SK.FaviconNotificationUpdater = function(baseFaviconUrl) {

    // Objet jQuery des éléments <link> du favicon.
    this.$faviconLink = $("link[rel='icon'], link[rel='shortcut icon']");
    console.log(this.$faviconLink);
    this.baseFaviconUrl = baseFaviconUrl;

    //Création du canvas
    this.canvas = $("<canvas>").get(0);
    this.canvas.width = 16;
    this.canvas.height = 16;

    this.ctx = this.canvas.getContext("2d");

    this.img = new Image();

    /**
     * Affiche une point d'exclamation rouge discret sur le favicon.
     */
     this.showExclamationMark = function(color) {

        color = color || "red";

        this.showFaviconNotification("!", "transparent", color, true);
     };

    /**
     * Affiche une notification d'erreur dans le favicon (une croix)
     * @param {string} color Du type #123456 Couleur du background de la notification (gris par défaut).
     */
    this.showFaviconError = function(color) {

        color = color || "#666";
        var crossCharacter = "\u2a2f";

        this.showFaviconNotification(crossCharacter, color);
    };

    /**
     * Met à jour le favicon avec une notification (nombre)
     * @param {int} count Valeur à afficher (max 99)
     * @param {string} color Du type #123456 Couleur du background de la notification (rouge par défaut).
     */
    this.showFaviconCount = function(count, color) {

        if(isNaN(count)) {
            return;
        }

        color = color || "#D62222";

        //On limite le nombre à 99
        count = Math.min(99, count);

        this.showFaviconNotification(count, color);
    };

    /**
     * Met à jour le favicon avec une notification
     * @param {string} text Texte à afficher dans le favicon (maximum deux caractères)
     * @param {string} backgroundColor Du type #123456 Couleur du background de la notification.
     *                  peut aussi être "transparent" pour ne pas afficher de cadre
     * @param {string} textColor Du type #123456 Couleur du texte de la notification (#FFF par défaut)
     * @param {boolean} boldText Vrai si le texte doit être en gras
     */
    this.showFaviconNotification = function(text, backgroundColor, textColor, boldText) {

        textColor = textColor || "#FFF";
        boldText = boldText === false ? false : true;

        $(this.img).on("load", function() {

            //On reset le canvas
            this.ctx.clearRect(0, 0, 16, 16);

            //On ajoute le text à l'icône
            var textWidth = this.ctx.measureText(text).width;
            this.ctx.drawImage(this.img, 0, 0);

            //Pas de cadre si backgroundColor === false
            if(backgroundColor !== "transparent") {
                this.ctx.fillStyle = backgroundColor;
                this.ctx.fillRect(0, 0, textWidth + 3, 11);
            }

            this.ctx.fillStyle = textColor;
            this.ctx.font = (boldText ? "bold" : "normal") + " 10px Verdana";
            this.ctx.textBaseline = "bottom";
            this.ctx.fillText(text, 1, 11);

            var faviconDataUrl = this.canvas.toDataURL("image/png");

            //On remplace le favicon
            if(this.$faviconLink !== null) {
                this.$faviconLink.remove();
            }

            this.$faviconLink = $("<link>", {
                href: faviconDataUrl,
                rel: "shorcut icon",
                type: "image/png"
            });

            $("head").append(this.$faviconLink);

        }.bind(this));

        //Récupération du favicon
        this.img.src = this.baseFaviconUrl + "?" + SK.Util.pseudoRandomString();
    };
};
