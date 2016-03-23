<?php

/**
 * Permet de récupérer des données en parsant jeuxvideo.com.
 *
 * GET
 *    action: 'pseudos' ou 'topic'
 *    data:
 *        pseudos -> ["Spixel_","Alexandre","ElDollar"]
 *        topic   ->
 *    log: (optionnel) 1 si l'appel à l'API doit être enregistré
 */

include "config.php";

header('Content-Type: application/xml; charset=utf-8');

//Permet de supporter les version antérieures à la 1.10
if(!empty($_GET['pseudos'])) {
	$_GET['action'] = "pseudos";
	$_GET['data'] = $_GET['pseudos'];
}

$action = $_GET['action'];
$data = json_decode($_GET['data']);

//Vrai si l'appel à l'API doit être enregistré
$log_call = !empty($_GET['log']) && $_GET['log'] == 1;

//Vrai si le cache doit être mis à jour
$force_cache_reload = !empty($_GET['forceCacheReload']) && $_GET['forceCacheReload'] == 1;

/**
 * Permet d'effectuer plusieurs requêtes vers l'API de JVC en parallèle.
 * Récupère les données du cache si elles existent et sont valides
 */
function getApiData($urls, $cache_result = true) {

	//Crade mais pratique
	global $action;
	global $dbh;
	global $force_cache_reload;

	if(!is_array($urls)) {
		$urls = array($urls);
	}

	//On calcule le timestamp des dernières données valides
	$now = time();
	$lastValidDataTimestamp = $now - (CACHE_TTL * 3600);

	$curly = array();

	//Url à récupérer depuis l'API
	$urls_from_api = array();
	//Données récupérées depuis le cache
	$data_from_cache = array();
	//Données récupérées depuis l'API
	$data_from_api = array();
	//Retour de la fonction
	$result = array();

	//Nombre de ressources à récupérer
	$url_count = count($urls);

	$mh = curl_multi_init();

	foreach ($urls as $id => $url) {

		//On récupère les données dans le cache ou via l'API si demandé et qu'on ne doit pas forcer le cache
		if($cache_result && !$force_cache_reload) {
			$rows = $dbh->query("SELECT *
				FROM api_cache_data
				WHERE url = '$url'
				AND timestamp > $lastValidDataTimestamp
			");

			$cache_data = current($rows->fetchAll(PDO::FETCH_ASSOC));
			$data_from_cache[] = $cache_data;
		}

		//les données ne sont pas en cache, on les récupère depuis l'API
		if(empty($cache_data)) {
			$urls_from_api[$id] = $url;
			$curly[$id] = curl_init();

			curl_setopt($curly[$id], CURLOPT_URL, $url);
			curl_setopt($curly[$id], CURLOPT_HEADER, 0);
			curl_setopt($curly[$id], CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($curly[$id], CURLOPT_TIMEOUT, 10); //timeout after 10 seconds

			curl_multi_add_handle($mh, $curly[$id]);
		}

	}

	$running = null;
	do {
		do {
		    $mrc = curl_multi_exec($mh, $running);
		    usleep(2000);
		} while ($mrc == CURLM_CALL_MULTI_PERFORM);
	    usleep(2000);
	} while($running > 0);

	foreach($curly as $id => $c) {
		$error = false;
		$data = curl_multi_getcontent($c);

		//En cas d'erreur, on enregistre pas les données dans le cache
		if(empty($data)) {
			$error = true;
			$data = "<error>Api Error</error>";
		}
		else {
			// Récupère les données souhaitées.
			if ($action === 'pseudos') {
				$is_male = strpos($data, '<div class="titre-pseudo sexe-m">');
				$is_female = strpos($data, '<div class="titre-pseudo sexe-f">');
				$gender = $is_male ? 'male' : ($is_female ? 'female' : 'unknown');
				// https://regex101.com/r/oR8bY4/1
				preg_match("/<img id=\"avatar0\" alt=\"[^\\s]+?\" src=\"([^\\s]+?)\">/", $data, $matches);
				$avatar = $matches[1];
				$data = "
					<cdv>
						<image>$avatar</image>
						<gender>$gender</gender>
					</cdv>
				";
			}
		}

		//On insère les données récupérées en cache
		if(!$error && $cache_result) {
			$dbh->query("INSERT INTO api_cache_data(url, data, timestamp)
				VALUES(" . $dbh->quote($urls_from_api[$id]) . ", " . $dbh->quote($data) . ", $now)
				ON DUPLICATE KEY UPDATE
				    data = " . $dbh->quote($data) . ",
				    timestamp = $now
			");
		}

		$data_from_api[$id] = $data;
		curl_multi_remove_handle($mh, $c);
	}

	//On mixe le résultat du cache et des appels à l'API
	for($i = 0; $i < $url_count; $i++) {

		if(empty($data_from_cache[$i])) {
			$result[] = array_shift($data_from_api);
		}
		else {
			$result[] = $data_from_cache[$i]['data'];
		}
	}

	curl_multi_close($mh);

	return $result;
}

try {
	$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8');
	$dbh = new PDO("mysql:host=" . HOST . ";dbname=" . DATABASE . ";", LOGIN, PASS, $options);
}
catch (Exception $e) {
}

//Simple enregistrement d'une ligne pour voir la fréquentation du script
if($log_call) {
	$dbh->query("INSERT INTO api_calls(ip, action)
		VALUES(" . $dbh->quote($_SERVER['REMOTE_ADDR']) . ", " . $dbh->quote($action) . ")
	");
}

switch($action) {

	//Requêtes sur des pseudos
	case "pseudos" :

		$base_url = 'm.jeuxvideo.com/';
		$pseudos = $data;
		$urls = array();

		foreach($pseudos as $pseudo) {
			$urls[] = $base_url . 'profil/' . strtolower($pseudo) . '.html';
		}
		$results = getApiData($urls);
		$pseudosCount = count($pseudos);

		?>
		<api>
		<?php for($i = 0; $i < $pseudosCount; $i++): ?>
			<author pseudo="<?php echo $pseudos[$i]; ?>" >
				<?php echo $results[$i]; ?>
			</author>
		<?php endfor; ?>
		</api>
		<?php

		break;
}
