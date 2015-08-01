"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/* Représente un auteur de JVC */
SK.Author = function(pseudo) {
    this.version = SK.Author.VERSION;
    this.pseudoWithCase = pseudo;
    this.pseudo = pseudo.toLowerCase();

    //Vrai en cas de profil banni/supprimé
    if (this.pseudo === "pseudo supprimé") {
        this.profileUnavailable = true;
    }
    else {
        this.profileUnavailable = false;
    }

    this.key = "authors." + pseudo;
    this.rank = "";
    this.messageCount = 0;
    this.avatar = "";
    this.fullSizeAvatar = "";
    this.gender = "";
    this.profileLink = "";
    //"ban tempo", "ban def", "error" ou "removed"
    this.errorType = "";
    this.hasLocalData = false;
    this.messages = [];
};

/** Version du modèle. Permet de déprecier le cache si la structure change */
SK.Author.VERSION = "2.6";

/** Durée de validité du localStorage en jours */
SK.Author.DATA_TTL = 4;


/**
 * Set les données de l'auteur à partir d'un objet data
 */
SK.Author.prototype.initFromData = function(data) {
    this.version = data.version || "";
    this.rank = data.rank || "";
    this.messageCount = data.messageCount || 0;
    this.avatar = data.avatar || "";
    this.fullSizeAvatar = data.fullSizeAvatar || "";
    this.gender = data.gender || "";
    this.profileLink = data.profileLink || "";
    this.profileUnavailable = data.profileUnavailable || false;
    this.errorType = data.errorType || "";
    this.hasLocalData = data.hasLocalData || false;
};

/* Charge les données de l'auteur à partir d"un élément $cdv (issu de l'API JVC) */
SK.Author.prototype.initFromCdv = function($cdv) {

    this.profileLink = location.protocol + "//www.jeuxvideo.com/profil/" + this.pseudo + ".html";

    if($cdv.find("info_pseudo").length > 0 &&
        $cdv.find("petite_image").length > 0 &&
        $cdv.find("couleur_pseudo").length > 0
    ) {
        this.rank = SK.Author.getRankFromColor($cdv.find("couleur_rang").text());
        this.messageCount = parseInt($cdv.find("nb_messages").text()) || 0;
        this.avatar = $cdv.find("petite_image").text();
        this.fullSizeAvatar = $cdv.find("image").text();
        this.fullSizeAvatar = this.fullSizeAvatar.replace(/\/(avatars?)-(sm|md)\//, "/$1/");
        
        if(this.fullSizeAvatar === location.protocol + "//image.jeuxvideo.com/avatars/default.jpg") {
            this.fullSizeAvatar = this.avatar;
        }

        switch ($cdv.find("couleur_pseudo").text()) {
            case "#0066CC":
                this.gender = "male";
                break;
            case "#FF0099":
                this.gender = "female";
                break;
            default:
                this.gender = "unknown";
                break;

        }
    }
    else {
        this.profileUnavailable = true;

        var error = $cdv.find("texte_erreur").text();

        if(error === "Le pseudo est banni temporairement") {
            this.errorType = "ban tempo";
        }
        else if(error === "Le pseudo est banni") {
            this.errorType = "ban def";
        }
        else {
            this.errorType = "error";
        }
    }
};



/* Ajoute un message à l'auteur */
SK.Author.prototype.addMessage = function(message) {
    this.messages.push(message);
};

/**
 * Enregistre les données de l'auteur dans le localStorage
 */
SK.Author.prototype.saveLocalData = function() {

    var data = {
        version: this.version,
        rank: this.rank,
        messageCount: this.messageCount,
        avatar: this.avatar,
        fullSizeAvatar: this.fullSizeAvatar,
        gender: this.gender,
        profileLink: this.profileLink,
        profileUnavailable: this.profileUnavailable,
        errorType: this.errorType,
        hasLocalData: true,
        date: new Date()
    };

    SK.Util.setValue(this.key, data);
};

/*
 * Récupère les données de l'auteur dans le localStorage.
 * Retourne vrai si on a trouvé des données exploitables en local pour cet auteur
 */
SK.Author.prototype.loadLocalData = function() {

    var data = SK.Util.getValue(this.key);
    var dataLoaded = false;

    if(SK.Author.isDataValid(data)) {
        this.initFromData(data);
        dataLoaded = true;
    }

    return dataLoaded;
};

SK.Author.getRankFromColor = function(hexString) {

    var rank = "";

    switch(hexString) {
        case "#CDAF69" :
            rank = "carton";
            break;
        case "#E7AD87" :
            rank = "bronze";
            break;
        case "#CCCCCC" :
            rank = "argent";
            break;
        case "#F3D15C" :
            rank = "or";
            break;
        case "#E5727A" :
            rank = "rubis";
            break;
        case "#3C54C6" :
            rank = "saphir";
            break;
        case "#3D9F6A" :
            rank = "emeraude";
            break;
        case "#C7EBF9" :
            rank = "diamant";
            break;
    }

    return rank;
};

/**
 * Retourne faux si les données passées en paramètre sont obsolètes.
 */
SK.Author.isDataValid = function(data) {

    var valid = true;

    if(data === null) {
        return false;
    }

    //On ne charge les données que si elles sont encore valables
    var dataDate = new Date(data.date);
    var now = new Date();
    var timeDiff = Math.abs(now.getTime() - dataDate.getTime());
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if(data.version !== SK.Author.VERSION || diffDays >= SK.Author.DATA_TTL) {
        valid = false;
    }

    return valid;

};

/**
 * Supprime les auteurs dont les données sont expirées.
 */
SK.Author.clearObsoleteData = function() {

    //On parcourt les données locales
    Object
        .keys(localStorage)
        .forEach(function(key) {

            //Si les données concernent un auteur
            if (/^SK.authors./.test(key)) {

                var skKey = key.substr(3);
                var data = SK.Util.getValue(skKey);

                // Et qu'elles sont périmées
                if (!SK.Author.isDataValid(data)) {
                    //On les supprime
                    SK.Util.deleteValue(skKey);
                }
            }
        })
    ;
};

/**
 * Supprime toutes les données des auteurs du localStorage
 */
SK.Author.clearData = function() {
    //On parcourt les données locales
    Object
        .keys(localStorage)
        .forEach(function(key) {

            //Si les données concernent un auteur
            if (/^SK.authors./.test(key)) {

                var skKey = key.substr(3);

                //On les supprime
                SK.Util.deleteValue(skKey);
            }
        })
    ;
};
