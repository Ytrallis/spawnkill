"use strict";
/* jshint multistr: true */
/* jshint newcap: false */

/* Représente un auteur de JVC */
SK.Author = function(pseudo, avatarUrlSm) {
    this.pseudoWithCase = pseudo;
    this.pseudo = pseudo.toLowerCase().trim();

    //Vrai en cas de profil banni/supprimé
    if (this.pseudo.indexOf("pseudo supprimé") !== -1) {
        this.profileUnavailable = true;
    }
    else {
        this.profileUnavailable = false;
        this.key = "authors." + pseudo;
    }

    if (avatarUrlSm) {
        // https://regex101.com/r/kP6hL0/2
        this.fullSizeAvatar = avatarUrlSm.replace(/\/(avatars?)-(sm|md)\//, "/$1/");
    }
    this.profileLink = "";
    //"ban tempo", "ban def", "error" ou "removed"
    this.errorType = "";
    this.hasLocalData = false;
    this.messages = [];
};

/* Ajoute un message à l'auteur */
SK.Author.prototype.addMessage = function(message) {
    this.messages.push(message);
};
