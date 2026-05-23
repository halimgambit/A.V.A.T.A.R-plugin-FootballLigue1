import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function init () {
    await Avatar.lang.addPluginPak('FootballLigue1');
}

export async function action(data, callback) {

    try {

        const L = await Avatar.lang.getPak('FootballLigue1', data.language);

        const tblActions = {
            getScore: () => getFootball("classement-equipes/general", data.client, L),
            getCalendar: () => getFootball("calendrier-resultats", data.client, L)
        };

        info("FootballLigue1:", data.action.command, L.get("plugin.from"), data.client);

        if (tblActions[data.action.command]) {
            await tblActions[data.action.command]();
        }

    } catch (error) {
        if (data.client) Avatar.Speech.end(data.client);
        error("Football Ligue1 Error:", error.message);
    }

    callback();
}


// ==========================
// FOOTBALL
// ==========================
const getFootball = async (foot, client, L) => {

    try {

        const response = await fetch(`https://www.lequipe.fr/Football/ligue-1/page-${foot}`);

        if (!response.ok) {
            throw new Error(L.get("speech.errorHttp", response.status));
        }

        const body = await response.text();
        const $ = cheerio.load(body);

        // ==========================
        // CLASSEMENT
        // ==========================
        if (foot === "classement-equipes/general") {

            const rows = $('td.table__col.table__col--name');
            const points = $('td.table__col.table__col--points');
            const teams = [];

            rows.each((i, el) => {
                if (i >= 6) return false;

                teams.push({
                    name: $(el).text().trim(),
                    points: points.eq(i).text().trim()
                });
            });

            const message = teams.map((team, index) => {
                return L.get(["speech.rank", team.name, index === 0 ? L.get("speech.leader") : L.get("speech.position", index + 1), team.points]);
            }).join(', ');

            Avatar.speak(message, client, () => Avatar.Speech.end(client));
        }

        // ==========================
        // CALENDRIER (à compléter)
        // ==========================
        if (foot === "calendrier-resultats") {

            Avatar.speak(L.get("speech.calendarNotReady"), client, () => Avatar.Speech.end(client));
        }

    } catch (error) {
        error("Football error:", error.message);
        Avatar.speak(L.get("speech.errorAccess"), client, () => Avatar.Speech.end(client));
    }
};

