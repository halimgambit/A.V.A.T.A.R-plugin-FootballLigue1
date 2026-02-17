import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function action(data, callback) {

	try {
		
		const tblActions = {
			getScore : () => getClassement("classement", data.client)					
		}
		
		info("FootballLigue1:", data.action.command, L.get("plugin.from"), data.client);
			
		if (!tblActions[data.action.command]) {
			throw new Error("Commande inconnue");
		}

		await tblActions[data.action.command]();

	} catch (err) {

		error("Erreur plugin FootballLigue1:", err.message);

		if (data.client) {
			Avatar.speak("Désolé, une erreur s'est produite.", data.client, () => {
				Avatar.Speech.end(data.client);
			});
		}
	}
		
	callback();
}

async function getClassement(foot, data, client) {
	try {
		const response = await fetch(`https://www.footmercato.net/france/ligue-1/${foot}`);

		if (!response.ok) {
			throw new Error(`Code erreur : ${response.statusText}`);
		}

		const body = await response.text();
		const $ = cheerio.load(body);

		if (foot === "classement") {
			const players = [];
			for (let i = 0; i <= 5; i++) {
			const player = {
			name : $('td.rankingTable__team > a > span').eq(i).text(),
			points : $('td.rankingTable__points').eq(i).text()
			}
		players.push(player);
		}
		const message = players.map((player, index) => {
		return `${player.name} ${index === 0 ? 'En premier' : `à la ${index + 1}ème place`} avec ${player.points} points.`;
		  }).join(', ');
        Avatar.speak(message, client, () => Avatar.Speech.end(client));
		return;
        }

if (foot === "calendrier-resultats") {
	
  }
}
catch (error) {
info(error);
Avatar.speak(`Désolé, j'ai rencontré un problème en récupérant les informations sur le site. ${error.message}`, data.client, () => Avatar.Speech.end(data.client));
}
}





