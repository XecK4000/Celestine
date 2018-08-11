<?php

if($_GET['back_user'] && $_GET['action'])
{
	header('Access-Control-Allow-Origin: *');

	$return = array();

	include 'settings.php';
	if(HOST == 'TODO' || USER == 'TODO' || PASSWORD == 'TODO') {
		die('Veuillez définir les paramètres de connexion à la BDD dans serveur/settings.php');
	}
	$db = new mysqli(HOST, USER, PASSWORD);
	$db->query("SET NAMES utf8");
	$db->select_db(DATABASE);

	$result = $db->query("SELECT back_user_id, UNIX_TIMESTAMP(last_update) AS last_update FROM users WHERE back_user_id = ".(int)$_GET['back_user']);
	if($user = $result->fetch_assoc())
	{
		$db->query("INSERT INTO log_webservices (date, back_user_id, action)
		VALUES (NOW(), ".(int)$_GET['back_user'].", '".$_GET['action']."')");

		if($_GET['action'] == 'server_update')
		{
			if($user['last_update'] < time() - 50)
			{
				$db->query("UPDATE users SET last_update = NOW() WHERE back_user_id = ".(int)$_GET['back_user'] );
				$db->query("UPDATE chouettes SET last_update = NOW() WHERE current_back_user = ".(int)$_GET['back_user'] );

				if(mt_rand(1, 3) == 1)
				{
					$db->query("UPDATE chouettes SET current_back_user = 0, last_update = NOW() WHERE last_update < '".date('Y-m-d H:i:s', time() - 30 * 60)."'" );

					$result = $db->query("SELECT chouette_id, chouette_name FROM chouettes WHERE current_back_user = 0");
					if($chouette = $result->fetch_assoc())
					{
						$db->query("INSERT INTO log_webservices (date, back_user_id, action)
						VALUES (NOW(), ".(int)$_GET['back_user'].", 'new_owl')");

						$db->query("UPDATE chouettes SET current_back_user = ".(int)$_GET['back_user'].", last_update = NOW() WHERE chouette_id = ".(int)$chouette['chouette_id'] );

						$return['create'] = $chouette;
					}
				}
			}

			$return['current'] = array();
			$result = $db->query("SELECT chouette_id, chouette_name FROM chouettes WHERE current_back_user = ".(int)$_GET['back_user'] );
			while($chouette = $result->fetch_assoc())
			{
				$return['current'][$chouette['chouette_id']] = $chouette;
			}

			$return['locations'] = array();
			$result = $db->query("SELECT c.chouette_id, c.chouette_name, u.name AS user_name
			FROM chouettes c
			JOIN users u ON u.back_user_id = c.current_back_user" );
			while($chouette = $result->fetch_assoc())
			{
				$return['locations'][$chouette['chouette_id']] = $chouette;
			}
		}
		elseif($_GET['action'] == 'get_my_owls')
		{
			$chouettes = array();
			$result = $db->query("SELECT chouette_id, chouette_name FROM chouettes WHERE current_back_user = ".(int)$_GET['back_user']);
			while($chouette = $result->fetch_assoc())
			{
				$chouettes[] = $chouette;
			}

			$return = $chouettes;
		}
		elseif($_GET['action'] == 'leave' && $_GET['chouette_id'])
		{
			$db->query("UPDATE chouettes SET current_back_user = 0, last_update = NOW() WHERE chouette_id = ".(int)$_GET['chouette_id']." AND current_back_user = ".(int)$_GET['back_user']);
			$return = 'OK';
		}
		elseif($_GET['action'] == 'force_celestine_for_test')
		{
			$db->query("UPDATE chouettes SET current_back_user = 189, last_update = NOW() WHERE chouette_id = 1");
			$return = 'OK';
		}
	}
	else
	{
		$return = 'Pas accès aux chouettes';
	}

	echo json_encode($return);
	$db->close();
}
?>