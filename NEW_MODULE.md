SpawnKill - Guide de développement
=========

Création d'un module
--------------------

JVC SpawnKill est un plugin pour jeuxvideo.com ajoutant des fonctionnalités comme les avatars, les citations ou les signatures.
Ce guide présente la création d'un nouveau module avec pour illustration la création d'un module permettant d'accéder à la dernière page d'un topic depuis la liste des sujets.

Avant de contribuer, pensez à lire les quelques conventions que je me suis donné sur la page suivante : [Contribuer à SpawnKill](https://github.com/dorian-marchal/spawnkill/blob/master/CONTRIBUTING.md)

Vous pouvez ensuite suivre ce guide de création d'un module :smile:

### Ajout du code de base

Pour mettre en place un nouveau module, la première chose à faire est de créer le fichier correspondant :
- Copier / Coller le fichier [`modules/NouveauModule.js`](https://github.com/dorian-marchal/spawnkill/blob/master/modules/NouveauModule.js) dans [`modules/LastPage.js`](https://github.com/dorian-marchal/spawnkill/blob/master/modules/LastPage.js)
- Remplacer les occurences de `NouveauModule`dans le fichier par `LastPage` et ajouter le nom et la description du module au fichier.

```javascript
/**
 * LastPage : Ce module permet d'accéder à la dernière page d'un topic
 * directement depuis la liste des sujets
 */
SK.moduleConstructors.LastPage = SK.Module.new();

SK.moduleConstructors.LastPage.prototype.id = "LastPage";
SK.moduleConstructors.LastPage.prototype.title = "Dernière page";
SK.moduleConstructors.LastPage.prototype.description = "Permet d'accéder à la dernière page d'un topic directement depuis la liste des sujets";

//Si le module est requis (impossible de le désactiver), décommenter cette ligne
// SK.moduleConstructors.LastPage.prototype.required = true;

/**
 * Initialise le module, fonction appelée quand le module est chargé
 */
SK.moduleConstructors.LastPage.prototype.init = function() {
    //Code exécuté au chargement du module
};

/**
 * Méthode testant si un Module doit être activé.
 * peut-être redéfinie.
 * Par défaut le module est toujours activé
 */
SK.moduleConstructors.LastPage.prototype.shouldBeActivated = function() {
    return true;
};

/**
 * Retourne le CSS à injecter si le module est activé.
 * Par défaut, aucun CSS n'est injecté.
 */
SK.moduleConstructors.LastPage.prototype.getCss = function() {
    return "";
};

/**
 * Options configurables du module.
 * Ces options apparaitront dans le panneau de configuration de SpawnKill
 */ 
SK.moduleConstructors.LastPage.prototype.settings = {};
```

Ajouter ensuite une ligne en haut du fichier `jvc-spawnkill.user.js` pour importer le module dans le script :

```javascript
// @require     modules/LastPage.js
```

### Conditions d'exécution du module

La méthode `shouldBeActivated` doit retourner vrai si le script doit être exécuté. Un helper est disponible pour faciliter la reconnaissance des pages. Par exemple, dans notre cas, le script est exécuté sur la liste des topics :

```javascript
/**
 * Le script est exécuté sur la liste des sujets
 */
SK.moduleConstructors.LastPage.prototype.shouldBeActivated = function() {
    SK.Util.currentPageIn(SK.common.Pages.TOPIC_LIST); //Le module est activé si la page courante est la liste des sujets
};
```
La méthode `SK.Util.currentPageIn` prend en paramètres tous les `SK.common.Pages` à tester

### Initialisation du plugin

Lorsque le plugin est initialisé, la méthode `init` est appelée. C'est donc dans celle-ci que nous ajoutons le code du plugin.
Pour rendre le code plus clair et faciliter la maintenance, le code est divisé en plusieurs méthodes :

```javascript
/**
 * Initialise le module, fonction appelée quand le module est chargé
 */
SK.moduleConstructors.LastPage.prototype.init = function() {
    //Code exécuté au chargement du module
    this.addLastPageLinks();
};

/**
 * Ajoute le lien vers la dernière page du topic sur l'icone du sujet
 */
SK.moduleConstructors.LastPage.prototype.addLastPageLinks = function() {

	//On parcourt la liste des topics
	$("#liste_topics tr:not(:first-child)").each(function() {

		var $topic = $(this);

		var POST_PER_PAGE = 20;

		//Nombre de posts
		var postCount = parseInt($topic.find("td:eq(3)").html());
		//Nombre de pages
		var pageCount = Math.floor(postCount / POST_PER_PAGE + 1);

		var topicLink = $topic.find("td:eq(1) a").attr("href");

		//Dans le lien, on remplace le numéro de la page par la dernière page
		var lastPageLink = topicLink.replace(/(http:\/\/www\.jeuxvideo\.com\/forums\/[\d]*-[\d]*-[\d]*-)[\d]*(-.*)/, "$1" + pageCount + "$2");

		//On ajoute le lien dernière page à l'icone des topics
		$topic.find("td:eq(0) img").wrap($("<a>", {
			class: "last-page-link",
			href: lastPageLink,
			title: "Accéder à la dernière page du sujet"
		}));

	});
};
```

### CSS du module

Le CSS dont a besoin le module est retourné par la méthode `getCss`. Ici, nous ajouterons seulement une flèche à droite l'icone des topics pour indiquer qu'ils sont cliquables :

```javascript
/**
 * Retourne le CSS à injecter si le plugin est activé.
 * Par défaut, aucun CSS n'est injecté.
 */
SK.moduleConstructors.LastPage.prototype.getCss = function() {

	var css = "\
		a.last-page-link {\
		  position: relative;\
		  width: 27px;\
		}\
		a.last-page-link::after {\
		  content: \"\";\
		  display: block;\
		  position: absolute;\
		    left: 20px;\
		    top: 2px;\
		  border: solid 5px transparent;\
		  border-left-color: #999;\
		}\
		a.last-page-link:hover::after {\
		  border-left-color: #000;\
		}\
	";

    return css;
};
```

*Note : En javascript, pour poursuivre une chaîne sur plusieurs lignes, il faut terminer chaque ligne par un backslash.*

### Ajout d'options au module

Il est possible d'ajouter facilement des options au module avec l'attribut `settings`. Ces options apparaitront automatiquement dans le panneau de configuration de SpawnKill.
Plusieurs types d'options sont possibles (voir l'annexe : [Les types d'options](#les-types-doptions))
Pour l'exemple, nous allons rendre optionnel l'affichage de la petite flèche à droite du topic avec un booléen :

```javascript
/**
 * Options configurables du plugin.
 * Ces options apparaitront dans le panneau de configuration de SpawnKill
 */ 
SK.moduleConstructors.LastPage.prototype.settings = {
	showIndicator: {
	    title: "Ajout d'un indicateur",
	    description: "Ajout d'une flèche à droite de l'image du topic pour indiquer l'intéractivité.",
	    type: "boolean",
	    default: true
	}
};
```

Nous utilisons ensuite ce paramètre grâce à la méthode `getSetting` pour déterminer si nous allons afficher la flèche. Dans le css :

```javascript
SK.moduleConstructors.LastPage.prototype.getCss = function() {

	var css = "";

	if(this.getSetting("showIndicator")) {
		css += "\
			a.last-page-link {\
			  position: relative;\
			  width: 27px;\
			}\
			a.last-page-link::after {\
			  content: \"\";\
			  display: block;\
			  position: absolute;\
			    left: 20px;\
			    top: 2px;\
			  border: solid 5px transparent;\
			  border-left-color: #999;\
			}\
			a.last-page-link:hover::after {\
			  border-left-color: #000;\
			}\
		";
	}

    return css;
};
```
Voilà, en moins de 60 lignes, vous avez un module configurable et injectant du CSS dans la page. Il ne vous reste plus qu'à faire un `pull request`.
Mais avant ça, pensez à lire les quelques règles à respecter sur la page suivante : [Contribuer à SpawnKill](https://github.com/dorian-marchal/spawnkill/blob/master/CONTRIBUTING.md)

Pour les plugins plus complexes, vous pouvez aussi jeter un oeil à la documentation suivante : [`Modal`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Modal.md), [`Author`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Author.md), [`Message`](https://github.com/dorian-marchal/spawnkill/blob/master/Message.js), [`Button`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Button.md) ou [`SlideToggle`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/SlideToggle.md). Les fonctions statiques de la classe [`Util`](https://github.com/dorian-marchal/spawnkill/blob/master/documentation/Util.md) peuvent aussi être intéressantes, notamment pour interroger facilement l'API de JVC.

Si vous avez des questions, n'hésitez pas à m'envoyer un MP sur jeuxvideo.com. Mon pseudo est [`Spixel_`](http://www.jeuxvideo.com/messages-prives/nouveau.php?all_dest=Spixel_).

Bon développement :)


Annexe
------

### Les types d'options

Il existe plusieurs types d'option pour les modules, chacune a sa propre structure :

#### Les booléens (Bouton ON/OFF)

```javascript
/**
 * Boolean option
 */ 
SK.moduleConstructors.NouveauModule.prototype.settings = {
	optionId: {
	    title: "Titre de l'option",
	    description: "Description de l'option",
	    type: "boolean",
	    default: true,
	    disabled: false, // Optionnel, si `true`, le bouton est grisé
	}
};

```

#### Les selects (listes déroulantes)

```javascript
/**
 * Select option
 */ 
SK.moduleConstructors.NouveauModule.prototype.settings = {
	optionId: {
	    title: "Titre de l'option",
	    description: "Description de l'option",
	    type: "select",
	    options: { value1Id: "Valeur 1", value2Id: "Valeur 2", value3Id: "Valeur 3" },
	    default: "value2Id"
	}
};
```

#### Les boutons d'action

```javascript
/**
 * Action button
 */
SK.moduleConstructors.NouveauModule.prototype.settings = {
	actionId: {
	    title: "Titre de l'action",
	    description: "Description de l'action",
	    type: "button",
	    buttonLabel: "Label du bouton",
	    default: function() {
	        // Fonction exécutée au click sur le bouton
	    },
	}
};

```

---

### Analyse de code

[JSHint] est utilisé pour analyser le code JavaScript, et détecter
d'éventuels problèmes dans le code.

JSHint peut être installé avec [npm] simplement en exécutant `npm
install`.

Pour lancer la vérification, exécutez `make lint` (ou en l'absence de la
commande `make`, `node_modules/jshint/bin/jshint .` à la racine du
projet).

Il est conseillé de vérifier le code avec JSHint avant de proposer une
contribution.

[JSHint]: http://www.jshint.com/
[npm]: https://www.npmjs.org/
