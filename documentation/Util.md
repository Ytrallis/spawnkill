Documentation - Fonctions utilitaires (`Util`)
==============================================

Dernière mise à jour : v1.13.1.2

* **SK.Util.ws** : Effectue une requête sur la version mobile de jeuxvideo.com
    * `url` (string) : Suffixe de l'URL de la requête
    * `callback` (function) : Fonction appelée avec comme premier paramètre un objet jQuery correspondant à la page de réponse

```javascript
SK.Util.m("02.flux_news", function(news) {
    // On affiche les dernières news du site
    console.log(news);
});
```

----

* **SK.Util.timestamp** : Retourne le timestamp Unix courant (int)


* **SK.Util.currentPageIn**  : Retourne vrai si l'utilisateur est sur l'une des pages passée en paramètre
    * `pages` (SK.common.Pages...): Tous les identifiants de pages à tester

```javascript
// Est-ce que nous sommes bien soit sur la page qui liste les topics soit sur la page de réponse ?
if(SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST, SK.common.Pages.TOPIC_RESPONSE)) {
    // On fait un truc
}
```

----

* **SK.Util.showModal**  : Affiche la fenêtre modale passée en paramètre
    * `$modal` (SK.Modal) : Modale à afficher

**Note :** Voir la documentation des [`Modal`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Modal.md) pour plus d'informations

```javascript
var $modal = new SK.Modal({
    title : "SpawnKill",
    content : "Voici un exemple de modal box"
});

SK.Util.showModal($modal);
```

----

* **SK.Util.showModalLoader** : Affiche l'écran de chargement des fenêtres modales

**Note :** Voir la documentation des [`Modal`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Modal.md) pour plus d'informations

----

* **SK.Util.hideModal** : Cache toutes les fenêtres modales ouvertes

**Note :** Voir la documentation des [`Modal`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Modal.md) pour plus d'informations

----

* **SK.Util.addButton** : Ajoute un bouton au post à l'emplacement indiqué en paramètre dans les options*
    * `$msg` (jQuery Object) : Objet jQuery qui contient le post (.msg)
    * `buttonOptions` (object) : **Remarque** : ces paramètres sont les mêmes que ceux de **SK.Button()**
        * string `location` : "top" (défaut), "right" ou "bottom".
        * int `index` : position du bouton (de gauche à droite)
        * Les autres paramètres se trouvent [ici](http://un.lien)

**Note :** Voir la documentation des [`Button`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Button.md) pour plus d'informations

```javascript
var $msg = $(".msg").first();
var buttonOptions = {
    location : "right",
    index : 3
}

// On ajout le bouton dans le premier message trouvé
SK.Util.addButton($msg, buttonOptions)
```

----

* **SK.Util.addCss** : Permet d'injecter du code CSS dans la page
	* `css` (string) : Chaîne CSS de la page

```javascript
SK.Util.addCss("body { background-color: blue }");
```

----

* **SK.Util.sanitizeXML** : Permet de supprimer les caractères spéciaux pour éviter les erreurs de parsing
	* `xml` (string) : XML à échapper

----

* **SK.Util.fetchStyle** : Force le navigateur à recalculer le CSS pour les animations
	* `element` (HTMLElement) : Element à animer

----

* **SK.Util.setValue** : Wrapper de localStorage.setItem(); :warning: Cette fonction supprime toutes les données des auteurs périmées si le localStorage est plein.
	* `key` (string) : Clé de l'item dans le localStorage (sera prefixée par "SK.")
	* `value` (mix) : Données correspondantes. Attention, les donnés étant sérialisée, si l'objet a une méthode `toString()`, des informations peuvent être perdues.

```javascript
var key = "Foo";
var value = ["Bar", "Qux", 123];

SK.Util.setValue(key, value);
```

----

* **SK.Util.getValue** : Wraper de localStorage.getItem();
	* `key` (string) : Clé de l'item dans le localStorage (sera prefixée par "SK.")

----

* **SK.Util.deleteValue** : Wrapper de localStorage.deleteItem();
	* `key` (string) : Clé de l'item dans le localStorage (sera prefixée par "SK.")

----

* **SK.Util._** : Retourne `nbspCount` espaces insécables
 * `nbspCount` (int) : Nombre d'espaces insécables à retourner

```javascript
var foo = SK.Util._(10);

// Affiche 10 espaces insécables
console.log(foo);
```

----

* **SK.Util.htmlEncode** : Remplace les caractères (&, <, >, ", ', /) par leur entité équivalente
	* `string` (string) : Chaîne à encoder

```javascript
var string = "C'est un <b>Test</b>. &";
var encodedString = SK.Util.htmlEncode(string);

// Affiche "C&#39;est un &lt;b&gt;Test&lt;&#x2F;b&gt;. &amp;"
console.log(encodedString);
```

----

* **SK.Util.preload** : Permet de précharger une image
    * `$img` (HTMLImageElement) : image créé via `new Image()`, `document.createElement("img")`, ou `$("<img>")`
    * `callback` (function) : Cette fonction est exécutée lorsque l'image est chargée

```javascript
var $img = $("<img>", {
    src : "http://un.lien/image.jpg",
    alt : "Une image"
});

SK.Util.preload($img, function() {
    console.log("L'image est chargée");
});
```

----

* **SK.Util.dispatchEvent** : Permet de propager l'évènement `eventName` dans le système d'évènements sur <body>
	* `eventName` (string) : Nom de l'événement à propager

```javascript
/**
 * Exemple tiré de la "communication" entre le module "Quote.js" et "EmbedMedia.js"
 * ----
 *
 * Quote.js - SK.moduleConstructors.Quote.prototype.htmlizeAllQuotes();
 */
var $posts = $(".posts");
var postCount = $posts.length;
$posts.each(function(i, post)) {

    // ...

    if(i === postCount - 1) {
        // SpawnKill envoie l'évènement "betterQuoteLoaded" lorsque toutes les quotes ont été "htmlisées"
        SK.Util.dispatchEvent("betterQuoteLoaded");
    }
}

/**
 * EmbedMedia.js - SK.moduleConstructors.EmbedMedia.prototype.init()
 */

// Si betterQuote est activé, on a besoin que les citations soient chargées pour calculer la taille des vidéos
var mustWaitQuote = SK.modules.Quote.activated && SK.modules.Quote.getSetting("betterQuote");

// Si on doit attendre les quotes, alors on attend que l'évènement "betterQuoteLoaded" soit envoyé, sinon on éxecute directement la fonction callback
SK.Util.bindEventOrExecute(mustWaitQuote, "betterQuoteLoaded", function() {
    this.embedMedia();
}.bind(this));

```

----

* **SK.Util.getPostSelection** : Retourne la sélection texte d'un post, et contourne ainsi .getSelection() qui ne capture pas l'attribut `alt` des `<img>` sous Chrome.

----

* **SK.Util.bindEventOrExecute** : Bind une fonction à un évènement si la condition est vraie, sinon, elle est directement exécutée
	* `condition` (boolean) : Condition à tester
	* `eventName` (string) : Nom de l'événement
	* `fn` (function) : Fonction à exécuter

```javascript
/**
 * EmbedMedia.js - SK.moduleConstructors.EmbedMedia.prototype.init()
 */

 // Si on doit attendre les quotes, alors on attend que l'évènement "betterQuoteLoaded" soit envoyé, sinon on éxecute directement la fonction callback
SK.Util.bindEventOrExecute(mustWaitQuote, "betterQuoteLoaded", function() {
    this.embedMedia();
}.bind(this));
```
